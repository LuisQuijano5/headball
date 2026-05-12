const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const COLOR_BALL = [255, 255, 255];
const COLOR_LOCAL = [0, 0, 255];
const COLOR_VISITANTE = [255, 0, 0];

// Variable para controlar que el log de tiempo finalizado en el frontend se haga solo una vez
let tiempoFinalizadoLogueado = false;
let pantallaLobby = null;

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

function crearLobby(room) {

  if (pantallaLobby) return;

  pantallaLobby = document.createElement("div");

  pantallaLobby.style.position = "absolute";
  pantallaLobby.style.top = "0";
  pantallaLobby.style.left = "0";
  pantallaLobby.style.width = "100%";
  pantallaLobby.style.height = "100%";
  pantallaLobby.style.background = `
    radial-gradient(circle at center, #1e293b 0%, #020617 100%)
  `;
  pantallaLobby.style.display = "flex";
  pantallaLobby.style.flexDirection = "column";
  pantallaLobby.style.justifyContent = "center";
  pantallaLobby.style.alignItems = "center";
  pantallaLobby.style.zIndex = "9999";
  pantallaLobby.style.color = "white";
  pantallaLobby.style.fontFamily = "Arial";

  pantallaLobby.innerHTML = `
  
    <h1 style="
      font-size:70px;
      margin-bottom:10px;
      letter-spacing:4px;
      color:white;
      text-shadow:0 0 20px rgba(255,255,255,0.3);
    ">
      HEADBALL
    </h1>

    <div id="lobby-status" style="
      font-size:24px;
      margin-bottom:40px;
      color:#cbd5e1;
    ">
      Esperando jugador...
    </div>

    <div id="character-selection" style="
      display:none;
      width:100%;
      justify-content:center;
      align-items:center;
      gap:120px;
    ">

      <!-- PLAYER 1 -->
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
      ">

        <h2 id="player1-title" style="
          color:#60a5fa;
          margin-bottom:25px;
          font-size:36px;
        ">
          PLAYER 1
        </h2>

        <div class="character-grid" style="
          display:grid;
          grid-template-columns:repeat(3, 140px);
          gap:20px;
        ">

          <img
            src="/assets/elpidio.png"
            class="character-option"
            data-character="elpidio"
            style="
              width:140px;
              height:140px;
              object-fit:cover;
              border:4px solid transparent;
              border-radius:18px;
              cursor:pointer;
              transition:0.2s;
              background:#111827;
            "
          />

          <img
            src="/assets/godoy.png"
            class="character-option"
            data-character="godoy"
            style="
              width:140px;
              height:140px;
              object-fit:cover;
              border:4px solid transparent;
              border-radius:18px;
              cursor:pointer;
              transition:0.2s;
              background:#111827;
            "
          />

          <img
            src="/assets/luislao.png"
            class="character-option"
            data-character="luislao"
            style="
              width:140px;
              height:140px;
              object-fit:cover;
              border:4px solid transparent;
              border-radius:18px;
              cursor:pointer;
              transition:0.2s;
              background:#111827;
            "
          />

        </div>

      </div>

      <!-- PLAYER 2 -->
      <div  style="
        display:flex;
        flex-direction:column;
        align-items:center;
      ">

        <h2 id="player2-title" style="
          color:#f87171;
          margin-bottom:25px;
          font-size:36px;
        ">
          PLAYER 2
        </h2>

        <div style="
          width:480px;
          height:140px;
          border:4px dashed rgba(255,255,255,0.2);
          border-radius:18px;
          display:flex;
          justify-content:center;
          align-items:center;
          font-size:24px;
          color:#94a3b8;
        ">
          Esperando selección...
        </div>

      </div>

    </div>

    <button id="btn-ready" style="
      display:none;
      margin-top:50px;
      padding:18px 50px;
      font-size:24px;
      font-weight:bold;
      border:none;
      border-radius:14px;
      cursor:pointer;
      background:#2563eb;
      color:white;
      transition:0.2s;
    ">
      CONFIRMAR
    </button>
  `;

  document.body.appendChild(pantallaLobby);

  let selectedCharacter = null;

  const options = pantallaLobby.querySelectorAll(".character-option");

  options.forEach(option => {

    option.onmouseenter = () => {
      option.style.transform = "scale(1.06)";
    };

    option.onmouseleave = () => {
      option.style.transform = "scale(1)";
    };

    option.onclick = () => {

      options.forEach(o => {
        o.style.border = "4px solid transparent";
      });

      option.style.border = "4px solid #facc15";

      selectedCharacter = option.dataset.character;

      document.getElementById("btn-ready").style.display = "block";
    };
  });

  document.getElementById("btn-ready").onclick = () => {

    if (!selectedCharacter) return;
    
    // 🔥 FORZAR DESBLOQUEO DEL AUDIO: Reproducir sonido mudo en el gesto del usuario
    try {
      play("gol", { volume: 0.001 });
    } catch (e) { }

    room.send("selectCharacter", selectedCharacter);

    document.getElementById("btn-ready").innerText =
      "Esperando rival...";

    document.getElementById("btn-ready").disabled = true;
  };
}

export function setupGameSync(room) {
  crearLobby(room);
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

  let isSlowMo = false;
  let isGoalSoundPlaying = false;
  let audioGradas = null; // Guardará la referencia al bucle de la afición

  room.onMessage("goal", ({ equipo, local, visitante }) => {
    console.log("⚽ ¡GOL! Animación ejecutándose...");

    // 3. Integración de Sonido: Sin retraso y sin superposición
    if (!isGoalSoundPlaying) {
      isGoalSoundPlaying = true;
      
      // Reiniciar sonido de gradas al instante para sincronizar con el impacto del GOL
      if (audioGradas) {
        audioGradas.stop();
      }
      audioGradas = play("gradas", { loop: true, volume: 1.0 });

      try {
        play("gol", { 
          speed: 1.0, 
          volume: 2.5 // Volumen aumentado a 250%
        });
      } catch (err) {
        console.warn("Audio de gol omitido (falta el archivo o hay un error).");
      }
      // Liberar el seguro del sonido incondicionalmente a los 2 segundos
      wait(2, () => isGoalSoundPlaying = false);
    }

    // Efecto de cámara lenta visual en personajes por 1 segundo
    isSlowMo = true;
    wait(1, () => {
      isSlowMo = false;
    });

    // Animación de ¡GOOOL! con arco, solapamiento y escalamiento progresivo
    const lettersData = [
      { char: "¡", size: 110, xOffset: -300, yOffset: 40 },
      { char: "G", size: 150, xOffset: -220, yOffset: 15 },
      { char: "O", size: 180, xOffset: -110, yOffset: -15 },
      { char: "O", size: 200, xOffset: 0,    yOffset: -30 }, // Punto máximo del arco
      { char: "O", size: 180, xOffset: 110,  yOffset: -15 },
      { char: "L", size: 150, xOffset: 220,  yOffset: 15 },
      { char: "!", size: 110, xOffset: 280,  yOffset: 40 }
    ];

    const startY = SCREEN_HEIGHT + 150;
    const centerX = SCREEN_WIDTH / 2;
    const endYCenter = SCREEN_HEIGHT / 2 - 50;

    lettersData.forEach((data, i) => {
      const textObj = add([
        text(data.char, { size: data.size }),
        pos(centerX + data.xOffset, startY),
        rotate(12), // Inclinación hacia la derecha (Shear/Italic) para dar velocidad
        anchor("center"),
        z(999 + i), // Solapamiento: La "O" pisa a la "G", la siguiente "O" pisa a la anterior, etc.
        color(255, 215, 0), // Dorado
        outline(12, rgb(0, 0, 0)), // Borde más grueso para solidificar el bloque
        opacity(1)
      ]);

      const targetY = endYCenter + data.yOffset;

      // Efecto de estallido súper rápido: i * 0.05 hace que las letras salgan casi al mismo tiempo
      wait(i * 0.05, () => {
        // easeOutBack da ese efecto jugoso de pasarse de largo un poquito y rebotar a su lugar
        tween(textObj.pos.y, targetY, 0.35, (val) => textObj.pos.y = val, easings.easeOutBack);
      });

      // Dura menos en pantalla (1.5s) y desaparece suavemente mientras cae un poco
      wait(1.5, () => {
        tween(textObj.opacity, 0, 0.3, (val) => textObj.opacity = val, easings.linear).onEnd(() => destroy(textObj));
        tween(textObj.pos.y, targetY + 30, 0.3, (val) => textObj.pos.y = val, easings.easeInQuad);
      });
    });
  });

  // Sincronización del estado
  room.onStateChange((state) => {
    let soyLocal = true;

    state.jugadores.forEach((jugador, sessionId) => {
      if (sessionId === room.sessionId) {
        soyLocal = jugador.equipo === "local";
        console.log("hey")
      }
    });

    const status = document.getElementById("lobby-status");
    const selection = document.getElementById("character-selection");
     console.log("heey22");

    if (state.estadoSala === "WAITING") {

      status.innerText = "Esperando segundo jugador...";
    }

    if (state.estadoSala === "SELECTING") {

      status.innerText = soyLocal
        ? "Selecciona tu personaje (Jugador 1)"
        : "Selecciona tu personaje (Jugador 2)";

      selection.style.display = "flex";

      const player1Title = document.getElementById("player1-title");
      const player2Title = document.getElementById("player2-title");

if (soyLocal) {

  player1Title.style.opacity = "1";
  player2Title.style.opacity = "0.35";

  player1Title.style.color = "#60a5fa";
  player2Title.style.color = "#f87171";

  selection.style.flexDirection = "row";

} else {

  player1Title.style.opacity = "0.35";
  player2Title.style.opacity = "1";

  player2Title.style.color = "#60a5fa";
  player1Title.style.color = "#f87171";
    player1Title.innerText = "PLAYER 2";
  player2Title.innerText = "PLAYER 1";

  selection.style.flexDirection = "row-reverse";
}
    }

    if (state.estadoSala === "PLAYING") {

      // Iniciar el sonido de fondo de gradas desde el primer segundo de la partida
      if (!audioGradas) {
        audioGradas = play("gradas", { loop: true, volume: 1.0 });
      }

      if (pantallaLobby) {
        pantallaLobby.remove();
        pantallaLobby = null;
      }
    }


    // Actualizar Marcadores
    const localSpan = document.getElementById("score-local");
    const visitanteSpan = document.getElementById("score-visitante");
    
    if (localSpan && typeof state.golesLocal !== "undefined") {
      if (localSpan.innerText !== state.golesLocal.toString()) {
        console.log(`Marcador Local actualizado visualmente a ${state.golesLocal}. Timestamp: ${Date.now()} ms`);
        localSpan.innerText = state.golesLocal;
      }
    }
    
    if (visitanteSpan && typeof state.golesVisitante !== "undefined") {
      if (visitanteSpan.innerText !== state.golesVisitante.toString()) {
        console.log(`[OKR7-I2] Marcador Visitante actualizado visualmente a ${state.golesVisitante}. Timestamp: ${Date.now()} ms`);
        visitanteSpan.innerText = state.golesVisitante;
      }
    }

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
      if (isSlowMo) {
        pelotaVisual.pos.x = lerp(pelotaVisual.pos.x, state.pelota.x, 0.1);
        pelotaVisual.pos.y = lerp(pelotaVisual.pos.y, state.pelota.y, 0.1);
      } else {
        pelotaVisual.pos.x = state.pelota.x;
        pelotaVisual.pos.y = state.pelota.y;
      }
    }

    // Jugadores
    state.jugadores.forEach((jugador, sessionId) => {
      const charName = (jugador.character && jugador.character !== "default" && jugador.character !== "") ? jugador.character : "elpidio";

      // Si el jugador ya existe pero cambió de personaje en el lobby, lo destruimos para recrearlo
      if (jugadoresVisuales[sessionId] && jugadoresVisuales[sessionId].charName !== charName) {
        destroy(jugadoresVisuales[sessionId]);
        destroy(piesVisuales[sessionId]);
        delete jugadoresVisuales[sessionId];
        delete piesVisuales[sessionId];
      }

      if (!jugadoresVisuales[sessionId]) {
        const isLocal = jugador.equipo === "local";
        const pColor = isLocal ? COLOR_LOCAL : COLOR_VISITANTE;
        

        // Cuerpo
        jugadoresVisuales[sessionId] = add([
  sprite(charName),
  pos(jugador.x, jugador.y),
  anchor("center"),
  scale(0.5),
  z(5),
]);
        jugadoresVisuales[sessionId].charName = charName; // Guardamos qué personaje es actualmente

        // Pie
        let pie;

if (charName === "elpidio") {

  pie = add([
    sprite("elpidiopie"),
    pos(0, 0),
    anchor("center"),
    scale(0.45),
    z(11),
  ]);

} else if (charName === "godoy") {

  pie = add([
    sprite("godoypie"),
    pos(0, 0),
    anchor("center"),
    scale(0.45),
    z(11),
  ]);

} else {

  // Luislao usa el pie procedural
  pie = add([
    rect(85, 28, { radius: 14 }),
    pos(0, 0),
    color(20, 20, 20),
    anchor("center"),
    z(11),
  ]);

  const direccion = isLocal ? 1 : -1;

  // Punta blanca
  pie.add([
    rect(18, 28, { radius: 10 }),
    pos(28 * direccion, 0),
    color(230, 230, 230),
    anchor("center"),
  ]);

  // Agujetas
  const posicionesAgujetas = [14, 0, -14];

  posicionesAgujetas.forEach((posX) => {
    pie.add([
      rect(4, 12, { radius: 2 }),
      pos(posX * direccion, -10),
      color(230, 230, 230),
      anchor("center"),
    ]);
  });
}

piesVisuales[sessionId] = pie;
      }

      const visual = jugadoresVisuales[sessionId];
      const pie = piesVisuales[sessionId];
      const isLocal = jugador.equipo === "local";

      if (isSlowMo) {
        visual.pos.x = lerp(visual.pos.x, jugador.x, 0.1);
        visual.pos.y = lerp(visual.pos.y, jugador.y, 0.1);
      } else {
        visual.pos.x = jugador.x;
        visual.pos.y = jugador.y;
      }

      const pieOffsetX = isLocal ? 28 : -28;

      if (jugador.pateando) {
        const extensionX = isLocal ? 40 : -40;
        const alturaCara = visual.pos.y;
        const rotacionArriba = isLocal ? -60 : 60;

        pie.pos.x = visual.pos.x + extensionX;
        pie.pos.y = alturaCara;
        pie.angle = rotacionArriba;
        pie.scale = vec2(1.2, 1.1);
      } else {
        pie.pos.x = visual.pos.x + pieOffsetX;
        pie.pos.y = visual.pos.y + 40;
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
