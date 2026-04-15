const SCREEN_WIDTH = 1280;
const COLOR_BALL = [255, 255, 255];
const COLOR_LOCAL = [0, 0, 255];
const COLOR_VISITANTE = [255, 0, 0];

export function setupGameSync(room) {
  // --- 1. OBJETO VISUAL DE LA PELOTA ---
  const pelotaVisual = add([
    circle(26),
    pos(0, 0),
    color(...COLOR_BALL),
    anchor("center"),
    z(10), // Asegura que esté por encima de los jugadores
  ]);

  const jugadoresVisuales = {};
  const piesVisuales = {};

  // --- 2. SINCRONIZACIÓN DEL ESTADO ---
  room.onStateChange((state) => {
    // A. Sincronizar Pelota
    if (state.pelota) {
      pelotaVisual.pos.x = state.pelota.x;
      pelotaVisual.pos.y = state.pelota.y;
    }

    // B. Sincronizar Jugadores
    state.jugadores.forEach((jugador, sessionId) => {
      // Si el jugador no existe localmente, lo creamos
      if (!jugadoresVisuales[sessionId]) {
        const isLocal = jugador.equipo === "local";
        const pColor = isLocal ? COLOR_LOCAL : COLOR_VISITANTE;

        // Cuerpo
        jugadoresVisuales[sessionId] = add([
          rect(jugador.width, jugador.height),
          pos(jugador.x, jugador.y),
          color(...pColor),
          anchor("center"),
        ]);

        // Pie (Hitbox circular visual)
        piesVisuales[sessionId] = add([
          circle(25),
          pos(0, 0),
          color(...pColor),
          anchor("center"),
        ]);
      }

      const visual = jugadoresVisuales[sessionId];
      const pie = piesVisuales[sessionId];

      // Actualizar posición del cuerpo
      visual.pos.x = jugador.x;
      visual.pos.y = jugador.y;

      // Actualizar posición del pie (coincidiendo con el servidor)
      const isLocal = jugador.equipo === "local";
      const pieOffsetX = isLocal ? 28 : -28; 
      
      // El "estiramiento" al patear ahora es sutil (12 píxeles) para que se vea natural
      const extension = jugador.pateando ? (isLocal ? 12 : -12) : 0;

      pie.pos.x = jugador.x + pieOffsetX + extension;
      pie.pos.y = jugador.y + 40;

      // Efecto visual de escala al patear (Crece un 20%)
      const targetScale = jugador.pateando ? 1.2 : 1.0;
      pie.scale = vec2(targetScale);
    });

    // C. Limpieza: Eliminar jugadores que se fueron
    for (const sessionId in jugadoresVisuales) {
      if (!state.jugadores.has(sessionId)) {
        destroy(jugadoresVisuales[sessionId]);
        destroy(piesVisuales[sessionId]);
        delete jugadoresVisuales[sessionId];
        delete piesVisuales[sessionId];
      }
    }
  });

  // --- 3. GESTIÓN DE CONTROLES ---
  const inputState = { left: false, right: false, jump: false, kick: false };

  // Función para enviar el objeto de input completo
  const sendInput = () => {
    room.send("input", inputState);
  };

  // Movimiento Lateral
  onKeyDown("left", () => {
    if (!inputState.left) {
      inputState.left = true;
      sendInput();
    }
  });
  onKeyRelease("left", () => {
    inputState.left = false;
    sendInput();
  });

  onKeyDown("right", () => {
    if (!inputState.right) {
      inputState.right = true;
      sendInput();
    }
  });
  onKeyRelease("right", () => {
    inputState.right = false;
    sendInput();
  });

  // Salto (Presión única)
  onKeyPress("up", () => {
    inputState.jump = true;
    sendInput();
    inputState.jump = false; // El servidor procesa el salto y lo apaga
  });

  // Patada (Espacio - Presión única)
  onKeyPress("space", () => {
    inputState.kick = true;
    sendInput();
    inputState.kick = false; // El servidor activará el timer de patada y se apagará solo
  });
}