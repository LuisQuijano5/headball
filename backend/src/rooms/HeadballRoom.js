// src/rooms/HeadballRoom.js

const { Room } = require("@colyseus/core");
const { EstadoHeadBall } = require("../schema/EstadoHeadball");

const { PhysicsManager } = require("./modules/PhysicsManager");
const { BallManager } = require("./modules/BallManager");
const { PlayerManager } = require("./modules/PlayerManager");
const { GameStateManager } = require("./modules/GameStateManager");
const { GoalManager } = require("./modules/GoalManager");

/**
 * Sala principal del juego Headball
 * Orquesta los módulos de física, jugadores, pelota y goles.
 */
class HeadBallRoom extends Room {

  onCreate(options) {
    console.log("🏟️ Room HeadBall - VERSIÓN DEFINITIVA (modular)");

    this.maxClients = 2;
    this.setState(new EstadoHeadBall());

    // Inicializar módulos
    this.physicsManager = new PhysicsManager();
    this.physicsManager.initialize();

<<<<<<< HEAD
    // --------------------------------------------------------------
    // 1. CONSTANTES FÍSICAS
    // --------------------------------------------------------------
    this.GRAVITY = 1200;           // Fuerza de gravedad (px/s²)
    this.BALL_RADIUS = 26;         // Radio de la pelota en píxeles
    this.AIR_FRICTION = 0.985;     // Fricción del aire (1 = sin fricción)
    
<<<<<<< HEAD
    // Fuerzas de impacto
    this.REBOUND_BODY = 250;   
    this.KICK_FORCE = 1600;    
    this.KICK_DURATION = 150;  
=======
    // Fuerzas de impacto según la parte del cuerpo y si está pateando
    this.REBOUND_BODY = 250;       // Rebote con el cuerpo
    this.REBOUND_FOOT = 550;       // Rebote con el pie
    this.KICK_FORCE = 1600;        // Fuerza de patada especial
    this.KICK_DURATION = 150;      // Duración de la animación de patada (ms)
>>>>>>> c0d0b2f (feat: Implementación de detección de goles y físicas corregidas)

    // Dimensiones de la arena (coinciden con el frontend)
    this.ARENA_WIDTH = 1280;        // Ancho total de la cancha
    this.ARENA_HEIGHT = 720;        // Alto total de la cancha
    this.GROUND_Y = 650;            // Altura del suelo (donde rebota la pelota)
    
    // Área de gol: rango de altura donde la pelota puede marcar gol
    this.GOAL_TOP = 400;            // Parte superior del travesaño
    this.GOAL_BOTTOM = 650;         // Base de la portería (suelo)

    // --------------------------------------------------------------
    // 2. INICIALIZAR MOTOR DE FÍSICA (Matter.js)
    // --------------------------------------------------------------
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.world.gravity.y = 1;  // Gravedad normal (hacia abajo)

<<<<<<< HEAD
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
=======
    // 2.1 Crear el suelo (cuerpo estático)
    this.suelo = Matter.Bodies.rectangle(640, this.GROUND_Y + 30, 1280, 60, { 
      isStatic: true,      // No se mueve
      restitution: 0.3,    // Rebote moderado
      friction: 0.5        // Fricción media
>>>>>>> c0d0b2f (feat: Implementación de detección de goles y físicas corregidas)
    });

    // 2.2 Crear la pelota (cuerpo sensor)
    // NOTA: es "sensor" porque la física manual controla su movimiento
    this.pelotaBody = Matter.Bodies.circle(
      this.state.pelota.x, this.state.pelota.y,
      this.BALL_RADIUS,
      { isSensor: true, restitution: 0.6, friction: 0.1 }
=======
    this.ballManager = new BallManager(
      this.state,
      this.physicsManager.getWorld(),
      this.physicsManager.getBallBody()
>>>>>>> 64609dd (Mis cambios finales)
    );

    this.gameStateManager = new GameStateManager(this.state);
    
    this.playerManager = new PlayerManager(
      this.state,
      this.physicsManager,
      this.ballManager,
      this.gameStateManager  // 🔥 Pasar el gameStateManager directamente
    );

    this.goalManager = new GoalManager(
      this,
      this.gameStateManager,
      this.ballManager,
      this.playerManager
    );

    // Escuchar mensajes de clientes
    this.onMessage("input", (client, input) => {
      const jugador = this.state.jugadores.get(client.sessionId);
      if (jugador) jugador.input = input;
    });

    // Loop de simulación
    this.setSimulationInterval((deltaTime) => {
      const dtSec = deltaTime / 1000;

      // Actualizar motor de física de Matter (para cuerpos de jugadores)
      this.physicsManager.update(deltaTime);

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
      // 4.2 Física MANUAL de la pelota (para tener más control)
      this.state.pelota.vy += this.GRAVITY * dt;           // Gravedad
      this.state.pelota.vx *= this.AIR_FRICTION;           // Fricción aire X
      this.state.pelota.vy *= this.AIR_FRICTION;           // Fricción aire Y
      this.state.pelota.x += this.state.pelota.vx * dt;    // Movimiento X
      this.state.pelota.y += this.state.pelota.vy * dt;    // Movimiento Y
=======
      // Actualizar pelota (integración manual)
      this.ballManager.update(dtSec);
>>>>>>> 64609dd (Mis cambios finales)

      // Detectar gol (antes de mover jugadores para que la pausa afecte)
      const goalScored = this.goalManager.checkAndProcessGoal(
        this.state.pelota.x,
        this.state.pelota.y
      );

<<<<<<< HEAD
      // 4.3 REBOTES
      // Rebote con el suelo
      if (this.state.pelota.y + this.BALL_RADIUS > this.GROUND_Y) {
        this.state.pelota.y = this.GROUND_Y - this.BALL_RADIUS;
        this.state.pelota.vy *= -0.7;  // Rebote menos elástico
        this.state.pelota.vx *= 0.98;  // Pérdida de velocidad horizontal
      }

      // Rebote con el techo
      if (this.state.pelota.y - this.BALL_RADIUS < 0) {
        this.state.pelota.y = this.BALL_RADIUS;
        this.state.pelota.vy *= -0.5;
>>>>>>> c0d0b2f (feat: Implementación de detección de goles y físicas corregidas)
      }

      // ------------------------------------------------------------
      // 5. DETECCIÓN DE GOL
      // ------------------------------------------------------------
      // Verificar si la pelota está en la altura correcta para marcar
      const dentroAltura = (this.state.pelota.y + this.BALL_RADIUS > this.GOAL_TOP &&
                            this.state.pelota.y - this.BALL_RADIUS < this.GOAL_BOTTOM);

      // Condiciones de gol (cruce de la línea de fondo + altura correcta)
      const golIzquierda = (this.state.pelota.x + this.BALL_RADIUS < 50) && dentroAltura;
      const golDerecha = (this.state.pelota.x - this.BALL_RADIUS > this.ARENA_WIDTH - 100) && dentroAltura;

      // Marcar gol si corresponde
      if (!this.goalLock && (golIzquierda || golDerecha)) {
        if (golIzquierda) {
          console.log("⚽ GOL VISITANTE");
          this.marcarGol("visitante");
        } else if (golDerecha) {
          console.log("⚽ GOL LOCAL");
          this.marcarGol("local");
        }
      }

      // ------------------------------------------------------------
      // 6. REBOTES LATERALES
      // ------------------------------------------------------------
      // Solo rebotan si NO están en el área de gol
      if (!dentroAltura) {
        // Rebote izquierdo
        if (this.state.pelota.x < this.BALL_RADIUS) {
          this.state.pelota.x = this.BALL_RADIUS;
          this.state.pelota.vx *= -0.85;
        }
        // Rebote derecho
        else if (this.state.pelota.x > this.ARENA_WIDTH - this.BALL_RADIUS) {
          this.state.pelota.x = this.ARENA_WIDTH - this.BALL_RADIUS;
          this.state.pelota.vx *= -0.85;
        }
      } else {
        // Si está en área de gol pero no marcó (por goalLock), evitar que se pierda
        if ((this.state.pelota.x + this.BALL_RADIUS < 0 || 
             this.state.pelota.x - this.BALL_RADIUS > this.ARENA_WIDTH) && !this.goalLock) {
          this.state.pelota.x = Math.min(Math.max(this.state.pelota.x, this.BALL_RADIUS), 
                                        this.ARENA_WIDTH - this.BALL_RADIUS);
          this.state.pelota.vx *= -0.5;
        }
      }

      // ------------------------------------------------------------
      // 7. PROCESAR CADA JUGADOR
      // ------------------------------------------------------------
      this.state.jugadores.forEach((jugador) => {
        if (!jugador.fisica) return;

        // 7.1 LÓGICA DE PATADA
        // Activar patada cuando se presiona espacio
        if (jugador.input?.kick && !jugador.pateando) {
          jugador.pateando = true;
          jugador.timerPatada = this.KICK_DURATION;
          jugador.input.kick = false;  // Consumir el input
        }
        // Desactivar patada después de la duración
        if (jugador.pateando) {
          jugador.timerPatada -= deltaTime;
          if (jugador.timerPatada <= 0) jugador.pateando = false;
        }

        // 7.2 COLISIONES CON LA PELOTA
        // Obtener las partes del jugador (cuerpo y pie)
        const partes = jugador.fisica.parts.slice(1);
        partes.forEach(parte => {
          const colision = Matter.Collision.collides(parte, this.pelotaBody);
          
          if (colision) {
            const nx = colision.normal.x;  // Dirección X del impacto
            const ny = colision.normal.y;  // Dirección Y del impacto
            
            // Determinar potencia según parte del cuerpo y si está pateando
            let potencia = (parte.label === "hitbox_pie") 
              ? (jugador.pateando ? this.KICK_FORCE : this.REBOUND_FOOT)
              : this.REBOUND_BODY;
            
            const vpx = jugador.fisica.velocity.x;  // Velocidad del jugador
            
            // Aplicar impulso a la pelota
            this.state.pelota.vx = (vpx * 0.5) + (nx * potencia * 0.6);
            this.state.pelota.vy = (ny * potencia * 0.5);
            
            // Efecto extra con el pie
            if (parte.label === "hitbox_pie") {
              this.state.pelota.vy -= (jugador.pateando ? 400 : 150);
            }
            
            // Separar para evitar que la pelota se clave en el jugador
            const overlap = colision.depth + 8;
            this.state.pelota.x += nx * overlap;
            this.state.pelota.y += ny * overlap;
          }
        });

        // 7.3 MOVIMIENTO Y SALTO
        let vx = 0;
        let vy = jugador.fisica.velocity.y;
        const velocidadCaminar = 8;
        
        // Movimiento lateral
        if (jugador.input?.left) vx = -velocidadCaminar;
        else if (jugador.input?.right) vx = velocidadCaminar;

        // Salto (solo si está tocando el suelo u otro objeto)
        if (jugador.input?.jump) {
          const cuerposSaltables = [this.suelo, this.pelotaBody];
          this.state.jugadores.forEach(otro => {
            if (otro.fisica && otro.fisica !== jugador.fisica) {
              cuerposSaltables.push(otro.fisica);
            }
          });
          
          const colisionesSalto = Matter.Query.collides(jugador.fisica, cuerposSaltables);
          let puedeSaltar = false;
          
          for (let col of colisionesSalto) {
            const otro = col.bodyA === jugador.fisica ? col.bodyB : col.bodyA;
            if (otro.position.y > jugador.fisica.position.y + 10) {
              puedeSaltar = true;
              break;
            }
          }
          
          if (puedeSaltar) vy = -14;  // Fuerza del salto
          jugador.input.jump = false;  // Consumir input
        }

        // Aplicar velocidad al cuerpo físico
        Matter.Body.setVelocity(jugador.fisica, { x: vx, y: vy });
        
        // Sincronizar posición con el estado de Colyseus
        jugador.x = jugador.fisica.position.x;
        jugador.y = jugador.fisica.position.y;
        
        // 7.4 EVITAR QUE SE HUNDAN O SALGAN DEL CAMPO
        // Evitar hundimiento en el suelo
        if (jugador.y + 50 > this.GROUND_Y) {
          jugador.y = this.GROUND_Y - 50;
          Matter.Body.setPosition(jugador.fisica, { x: jugador.x, y: jugador.y });
        }

        // Limitar movimiento horizontal (no salen de la pantalla)
        if (jugador.x < 50) jugador.x = 50;
        if (jugador.x > this.ARENA_WIDTH - 50) jugador.x = this.ARENA_WIDTH - 50;
        Matter.Body.setPosition(jugador.fisica, { x: jugador.x, y: jugador.y });
      });
    });
  }

  /**
   * Marca un gol para el equipo especificado
   * @param {string} equipoQueAnota - "local" o "visitante"
   */
  marcarGol(equipoQueAnota) {
    // Evitar múltiples goles en el mismo instante
    if (this.goalLock) return;
    this.goalLock = true;

<<<<<<< HEAD
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
=======
    // Asegurar que los marcadores existen (por si acaso)
    if (typeof this.state.marcadorLocal === 'undefined') {
      this.state.marcadorLocal = 0;
    }
    if (typeof this.state.marcadorVisitante === 'undefined') {
      this.state.marcadorVisitante = 0;
    }

    // Incrementar el marcador correspondiente
    if (equipoQueAnota === "local") {
      this.state.marcadorLocal++;
    } else if (equipoQueAnota === "visitante") {
      this.state.marcadorVisitante++;
    }

    console.log(`🏆 GOL de ${equipoQueAnota} → ${this.state.marcadorLocal} : ${this.state.marcadorVisitante}`);

    // Notificar a todos los clientes que hubo un gol
    this.broadcast("goal", {
      equipo: equipoQueAnota,
      local: this.state.marcadorLocal,
      visitante: this.state.marcadorVisitante
>>>>>>> c0d0b2f (feat: Implementación de detección de goles y físicas corregidas)
    });

    // Resetear la pelota al centro de la cancha
    this.state.pelota.x = this.ARENA_WIDTH / 2;
    this.state.pelota.y = this.GROUND_Y - this.BALL_RADIUS - 10;
    this.state.pelota.vx = 0;
    this.state.pelota.vy = 0;
    Matter.Body.setPosition(this.pelotaBody, { x: this.state.pelota.x, y: this.state.pelota.y });
    Matter.Body.setVelocity(this.pelotaBody, { x: 0, y: 0 });

    // Desbloquear después de 800ms (evita goles múltiples por el mismo disparo)
    setTimeout(() => {
      this.goalLock = false;
    }, 800);
  }

  /**
   * Se ejecuta cuando un jugador se une a la sala
   * @param {object} client - Cliente que se une
   * @param {object} options - Opciones de unión
   */
=======
      // 🔥 Actualizar jugadores - ahora pasamos el deltaTime y el flag de pausa se consulta internamente
      this.playerManager.updateAll(deltaTime);
    });
  }

>>>>>>> 64609dd (Mis cambios finales)
  onJoin(client, options) {
    console.log("👤 Jugador unido:", client.sessionId);
    const esLocal = this.state.jugadores.size === 0;
    this.playerManager.createPlayer(client.sessionId, esLocal);
  }

  onLeave(client, consented) {
    this.playerManager.removePlayer(client.sessionId);
  }
}

module.exports = { HeadBallRoom };