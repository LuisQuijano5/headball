const { Room } = require("@colyseus/core");
const Matter = require("matter-js");
const { EstadoHeadBall } = require("../schema/EstadoHeadball");
const { Jugador } = require("../schema/Jugador");

class HeadBallRoom extends Room {
  onCreate(options) {
    console.log("Room HeadBall creada");
    this.maxClients = 2;
    this.setState(new EstadoHeadBall());

    // --- CONSTANTES DE FÍSICA ---
    this.GRAVITY = 1200;
    this.BALL_RADIUS = 26;
    this.AIR_FRICTION = 0.985;
    
    // Fuerzas de impacto (Ajustadas para naturalidad)
    this.REBOUND_BODY = 250;   
    this.REBOUND_FOOT = 250;   
    this.KICK_FORCE = 1600;    
    this.KICK_DURATION = 150;  

    this.ARENA_WIDTH = 1280;
    this.ARENA_HEIGHT = 720;
    this.GROUND_Y = 648;

    // --- INICIALIZAR MATTER.JS ---
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.world.gravity.y = 1; 

    // 1. Límites del Mundo
    const suelo = Matter.Bodies.rectangle(640, 698, 1280, 100, { isStatic: true });
    const paredIz = Matter.Bodies.rectangle(-50, 360, 100, 720, { isStatic: true });
    const paredDer = Matter.Bodies.rectangle(1330, 360, 100, 720, { isStatic: true });

    // 2. Sensor de la Pelota
    this.pelotaBody = Matter.Bodies.circle(
      this.state.pelota.x,
      this.state.pelota.y,
      this.BALL_RADIUS,
      { isSensor: true } 
    );

    Matter.Composite.add(this.world, [suelo, paredIz, paredDer, this.pelotaBody]);

    // --- ESCUCHAR CONTROLES ---
    this.onMessage("input", (client, input) => {
      const jugador = this.state.jugadores.get(client.sessionId);
      if (jugador) {
          jugador.input = input;
      }
    });

    // --- LOOP DE SIMULACIÓN (60 FPS) ---
    this.setSimulationInterval((deltaTime) => {
      const dt = deltaTime / 1000;

      // 1. Actualizar motor físico
      Matter.Engine.update(this.engine, deltaTime);

      // 2. Física manual de la pelota
      this.state.pelota.vy += (this.GRAVITY * dt);
      this.state.pelota.vx *= this.AIR_FRICTION;
      this.state.pelota.vy *= this.AIR_FRICTION;
      this.state.pelota.x += (this.state.pelota.vx * dt);
      this.state.pelota.y += (this.state.pelota.vy * dt);

      // Sincronizar el sensor con la posición lógica
      Matter.Body.setPosition(this.pelotaBody, { x: this.state.pelota.x, y: this.state.pelota.y });

      // 3. Procesar Jugadores: Movimiento y Colisiones
      // --- DENTRO DEL LOOP DE SIMULACIÓN (setSimulationInterval) ---
  this.state.jugadores.forEach((jugador) => {
  if (jugador.fisica) {
    
    // 1. Lógica de Patada (CON SEGURO)
    if (jugador.input?.kick && !jugador.pateando) {
        jugador.pateando = true;
        jugador.timerPatada = this.KICK_DURATION;
        
        // ¡IMPORTANTE! Consumimos el input para que no se repita en el siguiente frame
        jugador.input.kick = false; 
    }
    
    if (jugador.pateando) {
      jugador.timerPatada -= deltaTime;
      if (jugador.timerPatada <= 0) {
          jugador.pateando = false;
      }
    }

    // ... resto de la lógica de colisiones y movimiento ...
    const partes = jugador.fisica.parts.slice(1);
    partes.forEach(parte => {
      const colision = Matter.Collision.collides(parte, this.pelotaBody);
      if (colision) {
        const nx = colision.normal.x;
        const ny = colision.normal.y;
        let potencia = (parte.label === "hitbox_pie") 
            ? (jugador.pateando ? this.KICK_FORCE : this.REBOUND_FOOT) 
            : this.REBOUND_BODY;

        const vpx = jugador.fisica.velocity.x;
        this.state.pelota.vx = (vpx * 0.5) + (nx * potencia * 0.6);
        this.state.pelota.vy = (ny * potencia * 0.5);

        if (parte.label === "hitbox_pie") {
            this.state.pelota.vy -= (jugador.pateando ? 400 : 150);
        }

        const overlap = colision.depth + 8;
        this.state.pelota.x += nx * overlap;
        this.state.pelota.y += ny * overlap;
      }
    });

    // Movimiento normal
    let vx = 0;
    if (jugador.input?.left) vx = -8;
    else if (jugador.input?.right) vx = 8;

    let vy = jugador.fisica.velocity.y;
    if (jugador.input?.jump && Math.abs(vy) < 0.5) {
      vy = -16;
      jugador.input.jump = false;
    }

    Matter.Body.setVelocity(jugador.fisica, { x: vx, y: vy });
    jugador.x = jugador.fisica.position.x;
    jugador.y = jugador.fisica.position.y;
  }
});

      // 4. Rebotes con el Escenario
      if (this.state.pelota.x < this.BALL_RADIUS) {
        this.state.pelota.x = this.BALL_RADIUS;
        this.state.pelota.vx *= -0.85;
      } else if (this.state.pelota.x > this.ARENA_WIDTH - this.BALL_RADIUS) {
        this.state.pelota.x = this.ARENA_WIDTH - this.BALL_RADIUS;
        this.state.pelota.vx *= -0.85;
      }

      if (this.state.pelota.y > this.GROUND_Y - this.BALL_RADIUS) {
        this.state.pelota.y = this.GROUND_Y - this.BALL_RADIUS;
        this.state.pelota.vy *= -0.7; // Rebote suelo
      } else if (this.state.pelota.y < this.BALL_RADIUS) {
        this.state.pelota.y = this.BALL_RADIUS;
        this.state.pelota.vy *= -0.5;
      }
    });
  }

  onJoin(client, options) {
    console.log("Jugador unido:", client.sessionId);
    const nuevoJugador = new Jugador();
    const esLocal = this.state.jugadores.size === 0;

    nuevoJugador.equipo = esLocal ? "local" : "visitante";
    nuevoJugador.x = esLocal ? 200 : 1080;
    nuevoJugador.y = this.GROUND_Y - (nuevoJugador.height / 2); // A ras del suelo

    // Crear Hitbox Compuesta
    const hitboxCuerpo = Matter.Bodies.rectangle(0, 0, 60, 100, { label: "hitbox_cuerpo" });
    const pieX = esLocal ? 28 : -28; 
    const hitboxPie = Matter.Bodies.circle(pieX, 40, 25, { label: "hitbox_pie" });

    const jugadorBody = Matter.Body.create({
      parts: [hitboxCuerpo, hitboxPie],
      inertia: Infinity, 
      restitution: 0,
      friction: 0.1
    });

    Matter.Body.setPosition(jugadorBody, { x: nuevoJugador.x, y: nuevoJugador.y });
    Matter.Composite.add(this.world, jugadorBody);

    nuevoJugador.fisica = jugadorBody;
    this.state.jugadores.set(client.sessionId, nuevoJugador);
  }

  onLeave(client, consented) {
    const jugador = this.state.jugadores.get(client.sessionId);
    if (jugador?.fisica) Matter.Composite.remove(this.world, jugador.fisica);
    this.state.jugadores.delete(client.sessionId);
  }
}

module.exports = { HeadBallRoom };