const SCREEN_WIDTH = 1280;
const BALL_RADIUS_RATIO = 0.025;
const COLOR_BALL = [255, 255, 255];
const COLOR_LOCAL = [0, 0, 255];
const COLOR_VISITANTE = [255, 0, 0];

export function setupGameSync(room) {
  const pelotaVisual = add([
    circle(SCREEN_WIDTH * BALL_RADIUS_RATIO),
    pos(0, 0),
    color(...COLOR_BALL),
    anchor("center"),
  ]);

  const jugadoresVisuales = {};

  room.onStateChange((state) => {
    // Sync Ball Position
    if (state.pelota) {
      pelotaVisual.pos.x = state.pelota.x;
      pelotaVisual.pos.y = state.pelota.y;
      pelotaVisual.angle = state.pelota.rotation;
    }

    // Sync Players
    if (state.jugadores) {
      state.jugadores.forEach((jugador, sessionId) => {
        // Spawn the player if they dont exist locally yet
        if (!jugadoresVisuales[sessionId]) {
          const isLocal = jugador.equipo === "local";
          const playerColor = isLocal ? COLOR_LOCAL : COLOR_VISITANTE;

          jugadoresVisuales[sessionId] = add([
            rect(jugador.width, jugador.height),
            pos(jugador.x, jugador.y),
            color(...playerColor),
            anchor("center"),
          ]);
        }

        // Continuously update position
        jugadoresVisuales[sessionId].pos.x = jugador.x;
        jugadoresVisuales[sessionId].pos.y = jugador.y;
      });

      // Clean up disconnected players
      for (const sessionId in jugadoresVisuales) {
        if (!state.jugadores.has(sessionId)) {
          destroy(jugadoresVisuales[sessionId]);
          delete jugadoresVisuales[sessionId];
        }
      }
    }
  });

  // ==========================================
  // NUEVO: CONTROLES DEL JUGADOR
  // ==========================================

  // Objeto para llevar el rastro de qué estamos presionando
  const inputState = { left: false, right: false, jump: false };

  // Función auxiliar para enviar el estado actual al servidor
  const sendInput = () => {
    room.send("input", inputState);
  };

  // --- Movimiento a la Izquierda ---
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

  // --- Movimiento a la Derecha ---
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

  // --- Salto ---
  // onKeyPress se ejecuta solo 1 vez al presionar la tecla
  onKeyPress("up", () => {
    inputState.jump = true;
    sendInput();

    // evitar salto infinito
    inputState.jump = false;
  });
}
