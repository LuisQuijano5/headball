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

      // 2. Física manual de la pelota
      this.state.pelota.vy += (this.GRAVITY * dt);
      this.state.pelota.vx *= this.AIR_FRICTION;
      this.state.pelota.vy *= this.AIR_FRICTION;
      this.state.pelota.x += (this.state.pelota.vx * dt);
      this.state.pelota.y += (this.state.pelota.vy * dt);

      // Sincronizar el sensor físico
      Matter.Body.setPosition(this.pelotaBody, { x: this.state.pelota.x, y: this.state.pelota.y });

      // 3. Procesar Jugadores
      this.state.jugadores.forEach((jugador) => {
        if (jugador.fisica) {
          
          // --- A. LÓGICA DE PATADA ---
          if (jugador.input?.kick && !jugador.pateando) {
              jugador.pateando = true;
              jugador.timerPatada = this.KICK_DURATION;
              jugador.input.kick = false; 
          }
          
          if (jugador.pateando) {
            jugador.timerPatada -= deltaTime;
            if (jugador.timerPatada <= 0) {
                jugador.pateando = false;
            }
          }

          // --- B. DETECCIÓN DE COLISIONES ---
          const partes = jugador.fisica.parts.slice(1);
          partes.forEach(parte => {
            const colision = Matter.Collision.collides(parte, this.pelotaBody);

            if (colision) {
              const nx = colision.normal.x;
              const ny = colision.normal.y;
              
              const bvx = this.state.pelota.vx;
              const bvy = this.state.pelota.vy;
              
              const pvx = jugador.fisica.velocity.x * 60; 
              const pvy = jugador.fisica.velocity.y * 60; 
              
              // Detectamos si el jugador viene corriendo o saltando
              const estaEnMovimiento = Math.abs(pvx) > 100 || Math.abs(pvy) > 100;

              if (parte.label === "hitbox_pie" && jugador.pateando) {
                // --- 1. PATADA ACTIVA ---
                this.state.pelota.vx = (pvx * 0.3) + (nx * this.KICK_FORCE * 0.8);
                this.state.pelota.vy = (ny * this.KICK_FORCE * 0.6) - 400; 
              } else if (estaEnMovimiento) {
                // --- 2. JUGADOR EN MOVIMIENTO (Cabezazo o Choque en carrera) ---
                const fuerzaBase = this.REBOUND_BODY * 1.5; 
                this.state.pelota.vx = (bvx * 0.3) + (nx * fuerzaBase) + (pvx * 0.8);
                this.state.pelota.vy = (bvy * 0.3) + (ny * fuerzaBase) + (pvy * 0.8);
              } else {
                // --- 3. JUGADOR QUIETO (Pasivo - Actúa exactamente como la pared) ---
                // Dependiendo de por dónde le pegue (lados o arriba/abajo), rebotamos la velocidad del balón
                if (Math.abs(nx) > Math.abs(ny)) {
                  // Choque horizontal (pegó de lado)
                  this.state.pelota.vx = Math.abs(bvx) * nx * 0.6; // Invierte y amortigua al 60%
                  this.state.pelota.vy *= 0.9; // Ligera fricción para que no resbale infinito
                } else {
                  // Choque vertical (le cayó encima o le dio por debajo)
                  this.state.pelota.vy = Math.abs(bvy) * ny * 0.6; // Invierte y amortigua al 60%
                  this.state.pelota.vx *= 0.9; // Ligera fricción
                }
              }

              // --- Separación inmediata ---
              const overlap = colision.depth + 8;
              this.state.pelota.x += nx * overlap;
              this.state.pelota.y += ny * overlap;
            }
          });

          // --- C. MOVIMIENTO Y SALTO ---
          let vx = 0;
          let vy = jugador.fisica.velocity.y;
          const velocidadCaminar = 8;

          if (jugador.input?.left) vx = -velocidadCaminar;
          else if (jugador.input?.right) vx = velocidadCaminar;

          if (jugador.input?.jump) {
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

              if (otroCuerpo.position.y > jugador.fisica.position.y + 10) {
                estaApoyadoEnAlgo = true;
                break;
              }
            }

            if (estaApoyadoEnAlgo) {
              vy = -16; 
            }
            jugador.input.jump = false; 
          }

          Matter.Body.setVelocity(jugador.fisica, { x: vx, y: vy });
          
          jugador.x = jugador.fisica.position.x;
          jugador.y = jugador.fisica.position.y;
        }
      });

      // 4. Rebotes Escenario
      if (this.state.pelota.x < this.BALL_RADIUS) {
        this.state.pelota.x = this.BALL_RADIUS;
        this.state.pelota.vx *= -0.85;
      } else if (this.state.pelota.x > this.ARENA_WIDTH - this.BALL_RADIUS) {
        this.state.pelota.x = this.ARENA_WIDTH - this.BALL_RADIUS;
        this.state.pelota.vx *= -0.85;
      }

      if (this.state.pelota.y > this.GROUND_Y - this.BALL_RADIUS) {
        this.state.pelota.y = this.GROUND_Y - this.BALL_RADIUS;
        this.state.pelota.vy *= -0.7; 
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
    nuevoJugador.y = 400; 

    // --- CREACIÓN DE HITBOX COMPUESTA ---
    const hitboxCuerpo = Matter.Bodies.circle(0, 0, 50, { label: "hitbox_cuerpo" });
    
    // Hitbox del pie: 65x42
    const pieX = esLocal ? 30 : -30; 
    const hitboxPie = Matter.Bodies.rectangle(pieX, 42, 65, 42, { label: "hitbox_pie" });

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