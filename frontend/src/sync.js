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
        anchor("center")
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
                        anchor("center")
                    ]);
                }

                //Continuously update position
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
}