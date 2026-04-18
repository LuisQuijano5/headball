// Importación de dependencias necesarias
const { Room } = require("@colyseus/core");  // Clase base para salas de Colyseus
const Matter = require("matter-js");          // Motor de física 2D
const { EstadoHeadBall } = require("../schema/EstadoHeadball");  // Estado compartido
const { Jugador } = require("../schema/Jugador");                // Esquema del jugador

/**
 * Sala principal del juego Headball
 * Maneja la lógica de física, colisiones, goles y sincronización
 */
class HeadBallRoom extends Room {
  
  /**
   * Se ejecuta cuando la sala es creada
   * Configura todas las constantes, el motor de física y los eventos
   */
  onCreate(options) {
    console.log("🏟️ Room HeadBall - VERSIÓN DEFINITIVA (goles y sin escapes)");
    
    // Máximo 2 jugadores por partida
    this.maxClients = 2;
    
    // Inicializar el estado compartido (se sincroniza automáticamente con los clientes)
    this.setState(new EstadoHeadBall());

    // Evita que se marquen múltiples goles en milisegundos
    this.goalLock = false;

    // --------------------------------------------------------------
    // 1. CONSTANTES FÍSICAS
    // --------------------------------------------------------------
    this.GRAVITY = 1200;           // Fuerza de gravedad (px/s²)
    this.BALL_RADIUS = 26;         // Radio de la pelota en píxeles
    this.AIR_FRICTION = 0.985;     // Fricción del aire (1 = sin fricción)
    
    // Fuerzas de impacto según la parte del cuerpo y si está pateando
    this.REBOUND_BODY = 250;       // Rebote con el cuerpo
    this.REBOUND_FOOT = 550;       // Rebote con el pie
    this.KICK_FORCE = 1600;        // Fuerza de patada especial
    this.KICK_DURATION = 150;      // Duración de la animación de patada (ms)

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

    // 2.1 Crear el suelo (cuerpo estático)
    this.suelo = Matter.Bodies.rectangle(640, this.GROUND_Y + 30, 1280, 60, { 
      isStatic: true,      // No se mueve
      restitution: 0.3,    // Rebote moderado
      friction: 0.5        // Fricción media
    });

    // 2.2 Crear la pelota (cuerpo sensor)
    // NOTA: es "sensor" porque la física manual controla su movimiento
    this.pelotaBody = Matter.Bodies.circle(
      this.state.pelota.x, this.state.pelota.y,
      this.BALL_RADIUS,
      { isSensor: true, restitution: 0.6, friction: 0.1 }
    );

    // Añadir los cuerpos al mundo físico
    Matter.Composite.add(this.world, [this.suelo, this.pelotaBody]);

    // --------------------------------------------------------------
    // 3. ESCUCHAR EVENTOS DE LOS CLIENTES
    // --------------------------------------------------------------
    // Cada cliente envía sus inputs (teclas presionadas)
    this.onMessage("input", (client, input) => {
      const jugador = this.state.jugadores.get(client.sessionId);
      if (jugador) jugador.input = input;
    });

    // --------------------------------------------------------------
    // 4. LOOP DE SIMULACIÓN (60 veces por segundo)
    // --------------------------------------------------------------
    this.setSimulationInterval((deltaTime) => {
      // Limitar deltaTime para evitar saltos muy grandes
      const dt = Math.min(deltaTime / 1000, 0.033);

      // 4.1 Actualizar la física de Matter (jugadores)
      Matter.Engine.update(this.engine, deltaTime);

      // 4.2 Física MANUAL de la pelota (para tener más control)
      this.state.pelota.vy += this.GRAVITY * dt;           // Gravedad
      this.state.pelota.vx *= this.AIR_FRICTION;           // Fricción aire X
      this.state.pelota.vy *= this.AIR_FRICTION;           // Fricción aire Y
      this.state.pelota.x += this.state.pelota.vx * dt;    // Movimiento X
      this.state.pelota.y += this.state.pelota.vy * dt;    // Movimiento Y

      // Sincronizar el sensor físico con la posición lógica
      Matter.Body.setPosition(this.pelotaBody, { 
        x: this.state.pelota.x, 
        y: this.state.pelota.y 
      });

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
  onJoin(client, options) {
    console.log("👤 Jugador unido:", client.sessionId);
    const nuevoJugador = new Jugador();
    const esLocal = this.state.jugadores.size === 0;  // El primero es local
    
    // Asignar equipo y posición inicial
    nuevoJugador.equipo = esLocal ? "local" : "visitante";
    nuevoJugador.x = esLocal ? 200 : 1080;   // Izquierda o derecha
    nuevoJugador.y = this.GROUND_Y - 60;     // Sobre el suelo

    // Crear hitboxes del jugador (cuerpo + pie)
    const hitboxCuerpo = Matter.Bodies.circle(0, 0, 50, { 
      label: "hitbox_cuerpo",
      restitution: 0.3,
      friction: 0.3
    });
    
    const pieX = esLocal ? 28 : -28;  // El pie mira hacia el centro
    const hitboxPie = Matter.Bodies.rectangle(pieX, 40, 60, 40, { 
      label: "hitbox_pie",
      restitution: 0.3,
      friction: 0.3
    });

    // Unir las partes en un solo cuerpo físico
    const jugadorBody = Matter.Body.create({
      parts: [hitboxCuerpo, hitboxPie],
      inertia: Infinity,    // No rota (siempre mira hacia adelante)
      restitution: 0.3,
      friction: 0.3,
      mass: 5
    });

    // Posicionar y añadir al mundo físico
    Matter.Body.setPosition(jugadorBody, { x: nuevoJugador.x, y: nuevoJugador.y });
    Matter.Composite.add(this.world, jugadorBody);
    
    // Guardar referencia al cuerpo físico en el estado
    nuevoJugador.fisica = jugadorBody;
    this.state.jugadores.set(client.sessionId, nuevoJugador);
  }

  /**
   * Se ejecuta cuando un jugador abandona la sala
   * @param {object} client - Cliente que se va
   * @param {boolean} consented - Si abandonó voluntariamente
   */
  onLeave(client, consented) {
    const jugador = this.state.jugadores.get(client.sessionId);
    // Eliminar el cuerpo físico del mundo para liberar recursos
    if (jugador?.fisica) Matter.Composite.remove(this.world, jugador.fisica);
    this.state.jugadores.delete(client.sessionId);
  }
}

module.exports = { HeadBallRoom };