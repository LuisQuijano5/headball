import kaplay from "kaplay"; 
import { Client } from "@colyseus/sdk";


kaplay({
    width: 1280,
    height: 720,
    letterbox: true,
    background: [0, 0, 0]
});

loadSprite("bgd", "../public/assets/stadium2.png");

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const client = new Client(backendUrl);

async function iniciarJuego() {
    try {
        console.log("Conectando a:", backendUrl);
        const room = await client.joinOrCreate("headball_room");

        // ✅ FIX 1: In Colyseus 0.17+, the property is roomId, not id!
        console.log("Conectado a la sala:", room.roomId); 

        // --- ESCENARIO ---
        add([
            // ✅ FIX 2: Stretch the background to fit the screen
            sprite("bgd", { width: 1280, height: 720 }), 
            pos(0, 0)
        ]);

        add([
            rect(1280, 720 * 0.10),
            pos(0, 720 * 0.90),
            color(50, 150, 50),
            anchor("topleft")
        ]);

        // --- PELOTA ---
        // --- PELOTA ---
        const pelotaVisual = add([
            circle(1280 * 0.025),
            pos(0, 0), 
            color(255, 255, 255),
            anchor("center")
        ]);

        const jugadoresVisuales = {};

        // ✅ THE BULLETPROOF SYNC LOOP
        room.onStateChange((state) => {
            
            // --- 1. SINCRONIZAR PELOTA ---
            if (state.pelota) {
                pelotaVisual.pos.x = state.pelota.x;
                pelotaVisual.pos.y = state.pelota.y;
                pelotaVisual.angle = state.pelota.rotation;
            }

            // --- 2. SINCRONIZAR JUGADORES ---
            if (state.jugadores) {
                
                // ✅ SPAWN & UPDATE: Iterar SOLO sobre los jugadores reales usando forEach
                state.jugadores.forEach((jugador, sessionId) => {

                    // SPAWN: Si el jugador no existe en nuestra pantalla, lo creamos
                    if (!jugadoresVisuales[sessionId]) {
                        console.log("Creando visual para jugador:", sessionId);
                        
                        // Leer el equipo para asignar color
                        const colorJugador = jugador.equipo === "local" ? rgb(0, 0, 255) : rgb(255, 0, 0);
                        
                        jugadoresVisuales[sessionId] = add([
                            rect(jugador.width, jugador.height),
                            pos(jugador.x, jugador.y),
                            color(colorJugador),
                            anchor("center")
                        ]);
                    }

                    // UPDATE: Actualizar la posición del sprite
                    jugadoresVisuales[sessionId].pos.x = jugador.x;
                    jugadoresVisuales[sessionId].pos.y = jugador.y;
                });

                // ✅ REMOVE: Si tenemos un sprite, pero ya no está en el servidor, lo borramos
                for (const sessionId in jugadoresVisuales) {
                    // Usar .has() para comprobar de forma segura si existe en el backend
                    if (!state.jugadores.has(sessionId)) {
                        console.log("Eliminando visual para jugador:", sessionId);
                        destroy(jugadoresVisuales[sessionId]);
                        delete jugadoresVisuales[sessionId];
                    }
                }
            }
        });

    } catch (e) {
        console.error("Error conectando a Colyseus:", e);
    }
}

iniciarJuego();