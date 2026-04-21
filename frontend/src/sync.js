// frontend/src/sync.js
const SCREEN_WIDTH = 1280;
const COLOR_BALL = [255, 255, 255];
const COLOR_LOCAL = [0, 0, 255];
const COLOR_VISITANTE = [255, 0, 0];

// Crear elementos HTML para el marcador
function crearMarcador() {
    if (!document.getElementById("score-local")) {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.top = "20px";
        div.style.left = "50%";
        div.style.transform = "translateX(-50%)";
        div.style.fontSize = "48px";
        div.style.fontFamily = "monospace";
        div.style.fontWeight = "bold";
        div.style.backgroundColor = "rgba(0,0,0,0.7)";
        div.style.padding = "10px 20px";
        div.style.borderRadius = "10px";
        div.style.color = "white";
        div.style.zIndex = "1000";
        div.innerHTML = `<span id="score-local">0</span> : <span id="score-visitante">0</span>`;
        document.body.appendChild(div);
    }
}

export function setupGameSync(room) {
    crearMarcador();

    const pelotaVisual = add([
        circle(26),
        pos(0, 0),
        color(...COLOR_BALL),
        anchor("center"),
        z(10),
    ]);

    const jugadoresVisuales = {};
    const piesVisuales = {};

    // Evento de gol
    room.onMessage("goal", ({ equipo, local, visitante }) => {
        const localSpan = document.getElementById("score-local");
        const visitanteSpan = document.getElementById("score-visitante");
        if (localSpan) localSpan.innerText = local;
        if (visitanteSpan) visitanteSpan.innerText = visitante;

        // Animación de gol
        const textoGol = add([
            text("¡GOOOL!"),
            pos(SCREEN_WIDTH / 2, 120),
            anchor("center"),
            z(999),
            scale(1),
        ]);
        wait(1.2, () => destroy(textoGol));
    });

    // Sincronización del estado
    room.onStateChange((state) => {
        // Pelota
        if (state.pelota) {
            pelotaVisual.pos.x = state.pelota.x;
            pelotaVisual.pos.y = state.pelota.y;
        }

        // Jugadores
        state.jugadores.forEach((jugador, sessionId) => {
            if (!jugadoresVisuales[sessionId]) {
                const isLocal = jugador.equipo === "local";
                const pColor = isLocal ? COLOR_LOCAL : COLOR_VISITANTE;
                
                // Cuerpo
                jugadoresVisuales[sessionId] = add([
                    circle(50),
                    pos(jugador.x, jugador.y),
                    color(...pColor),
                    anchor("center"),
                    z(5),
                ]);

                // Pie
                const pie = add([
                    rect(55, 28, { radius: 14 }),
                    pos(0, 0),
                    color(20, 20, 20),
                    anchor("center"),
                    z(11),
                ]);

                const direccion = isLocal ? 1 : -1;

                // Punta blanca
                pie.add([
                    rect(15, 28, { radius: 10 }),
                    pos(18 * direccion, 0),
                    color(230, 230, 230),
                    anchor("center"),
                ]);

                // Agujetas
                const posicionesAgujetas = [8, 0, -8];
                posicionesAgujetas.forEach((posX) => {
                    pie.add([
                        rect(4, 12, { radius: 2 }),
                        pos(posX * direccion, -10),
                        color(230, 230, 230),
                        anchor("center"),
                    ]);
                });

                piesVisuales[sessionId] = pie;
            }

            const visual = jugadoresVisuales[sessionId];
            const pie = piesVisuales[sessionId];
            const isLocal = jugador.equipo === "local";

            visual.pos.x = jugador.x;
            visual.pos.y = jugador.y;

            const pieOffsetX = isLocal ? 28 : -28;
            
            if (jugador.pateando) {
                const extensionX = isLocal ? 40 : -40;
                const alturaCara = jugador.y;
                const rotacionArriba = isLocal ? -60 : 60;
                
                pie.pos.x = jugador.x + extensionX;
                pie.pos.y = alturaCara;
                pie.angle = rotacionArriba;
                pie.scale = vec2(1.2, 1.1);
            } else {
                pie.pos.x = jugador.x + pieOffsetX;
                pie.pos.y = jugador.y + 40;
                pie.angle = 0;
                pie.scale = vec2(1);
            }
        });

        // Limpiar jugadores que salieron
        for (const sid in jugadoresVisuales) {
            if (!state.jugadores.has(sid)) {
                destroy(jugadoresVisuales[sid]);
                destroy(piesVisuales[sid]);
                delete jugadoresVisuales[sid];
                delete piesVisuales[sid];
            }
        }
    });

    // Controles
    const inputState = { left: false, right: false, jump: false, kick: false };
    const sendInput = () => room.send("input", inputState);

    onKeyDown("left", () => {
        if (!inputState.left) { inputState.left = true; sendInput(); }
    });
    onKeyRelease("left", () => {
        inputState.left = false; sendInput();
    });
    onKeyDown("right", () => {
        if (!inputState.right) { inputState.right = true; sendInput(); }
    });
    onKeyRelease("right", () => {
        inputState.right = false; sendInput();
    });
    onKeyPress("up", () => {
        inputState.jump = true;
        sendInput();
        inputState.jump = false;
    });
    onKeyPress("space", () => {
        inputState.kick = true;
        sendInput();
        inputState.kick = false;
    });
}