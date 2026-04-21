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

        // Cuerpo (Círculo visual)
        jugadoresVisuales[sessionId] = add([
          circle(50),
          pos(jugador.x, jugador.y),
          color(...pColor),
          anchor("center"),
          z(5), // Cuerpo debajo del pie
        ]);

        // Pie (Forma base de tenis negro)
        const pie = add([
          // 55 de largo, 28 de alto, esquinas redondeadas
          rect(55, 28, { radius: 14 }), 
          pos(0, 0),
          color(20, 20, 20), // Negro casi oscuro
          anchor("center"),
          z(11), // Pie por encima del cuerpo
        ]);

        const direccion = isLocal ? 1 : -1;

        // Punta blanca del tenis
        const puntaX = 18 * direccion; 
        pie.add([
          rect(15, 28, { radius: 10 }),
          pos(puntaX, 0),
          color(230, 230, 230),
          anchor("center"),
        ]);

        // --- AGUJETAS (NUEVO) ---
        // Tres líneas blancas en la parte superior
        const posicionesAgujetas = [8, 0, -8]; // Distribución horizontal en el tenis
        
        posicionesAgujetas.forEach((posX) => {
          const agujeta = pie.add([
            rect(4, 12, { radius: 2 }), // Líneas delgadas y redondeadas
            pos(posX * direccion, -10), // Posicionadas en el borde superior (y = -10)
            color(230, 230, 230),
            anchor("center"),
          ]);
          // Les damos una ligera inclinación para que parezcan entrelazadas
          agujeta.angle = 20 * direccion; 
        });

        piesVisuales[sessionId] = pie;
      }

      const visual = jugadoresVisuales[sessionId];
      const pie = piesVisuales[sessionId];

      // Actualizar posición del cuerpo
      visual.pos.x = jugador.x;
      visual.pos.y = jugador.y;

      // Actualizar posición y animación del pie
      const isLocal = jugador.equipo === "local";
      const pieOffsetX = isLocal ? 28 : -28; 
      
      if (jugador.pateando) {
        // --- ANIMACIÓN DE PATADA ALTA ---
        const extensionX = isLocal ? 40 : -40; // Se lanza hacia adelante
        const alturaCara = jugador.y; // Sube al centro del jugador (la cara)
        const rotacionArriba = isLocal ? -60 : 60; // Gira la punta hacia arriba
        
        pie.pos.x = jugador.x + extensionX;
        pie.pos.y = alturaCara; // Altura de la cara
        pie.angle = rotacionArriba;
        pie.scale = vec2(1.2, 1.1); // Ligero estiramiento de impacto
      } else {
        // --- POSICIÓN NORMAL (REPOSO EN EL SUELO) ---
        pie.pos.x = jugador.x + pieOffsetX;
        pie.pos.y = jugador.y + 40; // Abajo, tocando el suelo
        pie.angle = 0; // Plano
        pie.scale = vec2(1.0); // Tamaño normal
      }
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