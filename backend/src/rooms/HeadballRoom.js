const { Room } = require("@colyseus/core");
const Matter = require("matter-js");
const { EstadoHeadBall } = require("../schema/EstadoHeadball");
const { Jugador } = require("../schema/Jugador");

class HeadBallRoom extends Room {
  onCreate(options) {
    console.log("Room HeadBall creada - Versión Unificada");
    this.maxClients = 2;
    this.setState(new EstadoHeadBall());

    // --- CONSTANTES DE FÍSICA ---
    this.GRAVITY = 1200;
    this.BALL_RADIUS = 26;
    this.AIR_FRICTION = 0.985;
    
    // Fuerzas de impacto
    this.REBOUND_BODY = 250;   
    this.REBOUND_FOOT = 550;   
    this.KICK_FORCE = 1600;    
    this.KICK_DURATION = 150;  

    this.ARENA_WIDTH = 1280;
    this.ARENA_HEIGHT = 720;
    this.GROUND_Y = 648;

    // --- INICIALIZAR MATTER.JS ---
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.world.gravity.y = 1; 

    // 1. Límites del Mundo (Guardamos el suelo en una variable de clase para el salto)
    this.suelo = Matter.Bodies.rectangle(640, 698, 1280, 100, { isStatic: true });
    const paredIz = Matter.Bodies.rectangle(-50, 360, 100, 720, { isStatic: true });
    const paredDer = Matter.Bodies.rectangle(1330, 360, 100, 720, { isStatic: true });

    // 2. Sensor de la Pelota
    this.pelotaBody = Matter.Bodies.circle(
      this.state.pelota.x,
      this.state.pelota.y,
      this.BALL_RADIUS,
      { isSensor: true } 
    );

    Matter.Composite.add(this.world, [this.suelo, paredIz, paredDer, this.pelotaBody]);

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

      // 2. Física manual de la pelota (Gravedad y Fricción personalizada)
      this.state.pelota.vy += (this.GRAVITY * dt);
      this.state.pelota.vx *= this.AIR_FRICTION;
      this.state.pelota.vy *= this.AIR_FRICTION;
      this.state.pelota.x += (this.state.pelota.vx * dt);
      this.state.pelota.y += (this.state.pelota.vy * dt);

      // Sincronizar el sensor físico con la posición lógica para detecciones
      Matter.Body.setPosition(this.pelotaBody, { x: this.state.pelota.x, y: this.state.pelota.y });

      // 3. Procesar Jugadores: Movimiento, Salto y Colisiones
      this.state.jugadores.forEach((jugador) => {
        if (jugador.fisica) {
          
          // --- A. LÓGICA DE PATADA (CON SEGURO) ---
          if (jugador.input?.kick && !jugador.pateando) {
              jugador.pateando = true;
              jugador.timerPatada = this.KICK_DURATION;
              jugador.input.kick = false; // Consumir para evitar repetición
          }
          
          if (jugador.pateando) {
            jugador.timerPatada -= deltaTime;
            if (jugador.timerPatada <= 0) {
                jugador.pateando = false;
            }
          }

          // --- B. DETECCIÓN DE COLISIONES (Cuerpo y Pie contra Balón) ---
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
              
              // Aplicar impulso al balón basado en el choque
              this.state.pelota.vx = (vpx * 0.5) + (nx * potencia * 0.6);
              this.state.pelota.vy = (ny * potencia * 0.5);

              // Elevación extra si es con el pie o patada activa
              if (parte.label === "hitbox_pie") {
                  this.state.pelota.vy -= (jugador.pateando ? 400 : 150);
              }

              // Separación inmediata para evitar que el balón atraviese hitboxes
              const overlap = colision.depth + 8;
              this.state.pelota.x += nx * overlap;
              this.state.pelota.y += ny * overlap;
            }
          });

          // --- C. MOVIMIENTO Y SALTO (Lógica Mejorada de tu amigo) ---
          let vx = 0;
          let vy = jugador.fisica.velocity.y;
          const velocidadCaminar = 8;

          if (jugador.input?.left) vx = -velocidadCaminar;
          else if (jugador.input?.right) vx = velocidadCaminar;

          if (jugador.input?.jump) {
            // Recopilamos plataformas: suelo, pelota y otros jugadores
            const cuerposParaSaltar = [this.suelo, this.pelotaBody];
            this.state.jugadores.forEach((otroJugador) => {
              if (otroJugador.fisica && otroJugador.fisica !== jugador.fisica) {
                cuerposParaSaltar.push(otroJugador.fisica);
              }
            });

            const colisionesSalto = Matter.Query.collides(jugador.fisica, cuerposParaSaltar);
            let estaApoyadoEnAlgo = false;

            for (let i = 0; i < colisionesSalto.length; i++) {
              const col = colisionesSalto[i];
              const otroCuerpo = col.bodyA === jugador.fisica ? col.bodyB : col.bodyA;

              // Si el objeto tocado está debajo del jugador (Margen de 10px)
              if (otroCuerpo.position.y > jugador.fisica.position.y + 10) {
                estaApoyadoEnAlgo = true;
                break;
              }
            }

            if (estaApoyadoEnAlgo) {
              vy = -16; // Fuerza de salto
            }
            jugador.input.jump = false; // Resetear input tras procesar
          }

          Matter.Body.setVelocity(jugador.fisica, { x: vx, y: vy });
          
          // Sincronizar posición con el Schema de Colyseus
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
        this.state.pelota.vy *= -0.7; // Rebote con el césped
      } else if (this.state.pelota.y < this.BALL_RADIUS) {
        this.state.pelota.y = this.BALL_RADIUS;
        this.state.pelota.vy *= -0.5; // Rebote techo
      }
    });
  }

  onJoin(client, options) {
    console.log("Jugador unido:", client.sessionId);
    const nuevoJugador = new Jugador();
    const esLocal = this.state.jugadores.size === 0;

    nuevoJugador.equipo = esLocal ? "local" : "visitante";
    nuevoJugador.x = esLocal ? 200 : 1080;
    // Spawneamos un poco arriba para que caiga
    nuevoJugador.y = 400; 

    // --- CREACIÓN DE HITBOX COMPUESTA (Tu código del pie) ---
    const hitboxCuerpo = Matter.Bodies.circle(0, 0, 50, { label: "hitbox_cuerpo" });
    const pieX = esLocal ? 28 : -28; 
    const hitboxPie = Matter.Bodies.rectangle(pieX, 40, 60, 40, { label: "hitbox_pie" });

    const jugadorBody = Matter.Body.create({
      parts: [hitboxCuerpo, hitboxPie],
      inertia: Infinity, // Evita que el jugador gire sobre sí mismo
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