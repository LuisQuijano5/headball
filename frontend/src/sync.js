const SCREEN_WIDTH = 1280;
const COLOR_BALL = [255, 255, 255];
const COLOR_LOCAL = [0, 0, 255];
const COLOR_VISITANTE = [255, 0, 0];

// Variable para controlar que el log de tiempo finalizado en el frontend se haga solo una vez
let tiempoFinalizadoLogueado = false;

// Crear pantalla de resultados al finalizar el juego
function crearPantallaFinal(room, golesLocal, golesVisitante) {
  if (!document.getElementById("end-screen-container")) {
    const container = document.createElement("div");
    container.id = "end-screen-container";
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.zIndex = "2000";
    container.style.color = "white";
    container.style.fontFamily = "Arial, sans-serif";

    const title = document.createElement("h1");
    title.innerText = "FIM DE JOGO";
    title.style.fontSize = "60px";
    title.style.marginBottom = "20px";

    const score = document.createElement("div");
    score.style.fontSize = "40px";
    score.style.marginBottom = "40px";
    
    let winnerText = "EMPATE";
    if (golesLocal > golesVisitante) winnerText = "JOGADOR 1 VENCEU";
    else if (golesVisitante > golesLocal) winnerText = "JOGADOR 2 VENCEU";

    score.innerHTML = `${winnerText}<br><br>Jogador 1: ${golesLocal}<br>Jogador 2: ${golesVisitante}`;
    score.style.textAlign = "center";

    const btnRestart = document.createElement("button");
    btnRestart.innerText = "Outro jogo";
    btnRestart.style.fontSize = "24px";
    btnRestart.style.padding = "15px 40px";
    btnRestart.style.cursor = "pointer";
    btnRestart.style.backgroundColor = "#4CAF50";
    btnRestart.style.color = "white";
    btnRestart.style.border = "none";
    btnRestart.style.borderRadius = "8px";
    btnRestart.style.fontWeight = "bold";

    btnRestart.onclick = () => {
      room.send("restart");
      
      // Devolver el foco al canvas del juego para que los controles respondan inmediatamente
      const canvas = document.querySelector("canvas");
      if (canvas) canvas.focus();
    };

    container.appendChild(title);
    container.appendChild(score);
    container.appendChild(btnRestart);
    document.body.appendChild(container);
  }
}

// Crear elementos HTML para el marcador simulando la imagen
function crearMarcador() {
  if (!document.getElementById("scoreboard-container")) {
    const container = document.createElement("div");
    container.id = "scoreboard-container";
    // Estilo del contenedor principal
    container.style.position = "absolute";
    container.style.top = "10px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.gap = "30px";
    container.style.padding = "10px 20px";
    container.style.backgroundColor = "rgba(180, 190, 185, 0.85)"; // Fondo grisáceo
    container.style.border = "4px solid #6b8e8e"; // Borde externo sutil
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontWeight = "bold";
    container.style.zIndex = "1000";

    // Panel Jugador 1 (Local)
    const p1Div = document.createElement("div");
    p1Div.style.border = "4px solid black";
    p1Div.style.backgroundColor = "#ccc";
    p1Div.style.padding = "10px 30px";
    p1Div.style.textAlign = "center";
    p1Div.innerHTML = `
            <div style="color: #4169e1; font-size: 28px; margin-bottom: 5px;">Jugador 1</div>
            <div id="score-local" style="color: black; font-size: 36px;">0</div>
        `;

    // Panel de Tiempo
    const timeDiv = document.createElement("div");
    timeDiv.style.textAlign = "center";
    timeDiv.style.display = "flex";
    timeDiv.style.flexDirection = "column";
    timeDiv.style.alignItems = "center";
    timeDiv.innerHTML = `
            <div style="color: black; font-size: 24px; margin-bottom: 8px; line-height: 1.1;">Tiempo<br>restante</div>
            <div id="time-display" style="border: 3px solid black; background-color: #ccc; color: black; font-size: 28px; padding: 5px 15px;">03:00</div>
        `;

    // Panel Jugador 2 (Visitante)
    const p2Div = document.createElement("div");
    p2Div.style.border = "4px solid black";
    p2Div.style.backgroundColor = "#ccc";
    p2Div.style.padding = "10px 30px";
    p2Div.style.textAlign = "center";
    p2Div.innerHTML = `
            <div style="color: #ff3333; font-size: 28px; margin-bottom: 5px;">Jugador 2</div>
            <div id="score-visitante" style="color: black; font-size: 36px;">0</div>
        `;

    container.appendChild(p1Div);
    container.appendChild(timeDiv);
    container.appendChild(p2Div);
    document.body.appendChild(container);
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

  // Evento de gol (Opcional: Si el server manda esto, aquí sigue funcionando)
  room.onMessage("goal", ({ equipo, local, visitante }) => {
    // La actualización de los textos se maneja en onStateChange de forma más robusta,
    // pero puedes mantener esta animación visual.
    const textoGol = add([
      text("¡GOOOL!"),
      pos(SCREEN_WIDTH / 2, 200), // Bajé un poco el texto para no tapar el marcador nuevo
      anchor("center"),
      z(999),
      scale(1.5),
    ]);
    wait(1.2, () => destroy(textoGol));
  });

  // Sincronización del estado
  room.onStateChange((state) => {
    // Actualizar Marcadores
    const localSpan = document.getElementById("score-local");
    const visitanteSpan = document.getElementById("score-visitante");
    if (localSpan && typeof state.golesLocal !== "undefined")
      localSpan.innerText = state.golesLocal;
    if (visitanteSpan && typeof state.golesVisitante !== "undefined")
      visitanteSpan.innerText = state.golesVisitante;

    // Actualizar Reloj
    if (typeof state.tiempoRestante !== "undefined") {
      const minutos = Math.floor(state.tiempoRestante / 60);
      const segundos = state.tiempoRestante % 60;
      const formatMin = minutos.toString().padStart(2, "0");
      const formatSeg = segundos.toString().padStart(2, "0");

      const timeDisplay = document.getElementById("time-display");
      if (timeDisplay) timeDisplay.innerText = `${formatMin}:${formatSeg}`;

      // Mostrar pantalla final al llegar a cero
      if (state.tiempoRestante === 0 && !tiempoFinalizadoLogueado) {
        console.log("tiempo finalizado");
        tiempoFinalizadoLogueado = true;
        crearPantallaFinal(room, state.golesLocal, state.golesVisitante);
      }

      // Quitar la pantalla final si el juego se reinicia
      if (state.tiempoRestante > 0 && document.getElementById("end-screen-container")) {
        document.getElementById("end-screen-container").remove();
        tiempoFinalizadoLogueado = false;
      }
    }

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
