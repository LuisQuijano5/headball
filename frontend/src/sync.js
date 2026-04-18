const SCREEN_WIDTH = 1280;
const COLOR_BALL = [255, 255, 255];
const COLOR_LOCAL = [0, 0, 255];
const COLOR_VISITANTE = [255, 0, 0];

// Crear elementos HTML para el marcador (si no existen)
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

    // --- Evento de gol (actualiza marcador y muestra texto) ---
    room.onMessage("goal", ({ equipo, local, visitante }) => {
        // Actualizar HTML
        const localSpan = document.getElementById("score-local");
        const visitanteSpan = document.getElementById("score-visitante");
        if (localSpan) localSpan.innerText = local;
        if (visitanteSpan) visitanteSpan.innerText = visitante;

        // Mostrar animación de "GOOOL"
        const textoGol = add([
            text("¡GOOOL!"),
            pos(SCREEN_WIDTH / 2, 120),
            anchor("center"),
            z(999),
            scale(1),
        ]);
        wait(1.2, () => destroy(textoGol));
    });

    // --- Sincronización del estado (jugadores y pelota) ---
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
                jugadoresVisuales[sessionId] = add([
                    circle(50),
                    pos(jugador.x, jugador.y),
                    color(...pColor),
                    anchor("center"),
                ]);
                piesVisuales[sessionId] = add([
                    rect(60, 40),
                    pos(0, 0),
                    color(...pColor),
                    anchor("center"),
                ]);
            }

            const visual = jugadoresVisuales[sessionId];
            const pie = piesVisuales[sessionId];
            visual.pos.x = jugador.x;
            visual.pos.y = jugador.y;

            const isLocal = jugador.equipo === "local";
            const pieOffsetX = isLocal ? 28 : -28;
            const extension = jugador.pateando ? (isLocal ? 12 : -12) : 0;
            pie.pos.x = jugador.x + pieOffsetX + extension;
            pie.pos.y = jugador.y + 40;
            pie.scale = vec2(jugador.pateando ? 1.2 : 1.0);
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

    // --- Controles ---
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