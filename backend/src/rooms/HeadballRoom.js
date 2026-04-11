const { Room } = require("@colyseus/core");
const Matter = require("matter-js");
const { EstadoHeadBall } = require("../schema/EstadoHeadball");
const { Jugador } = require("../schema/Jugador");

class HeadBallRoom extends Room {
  onCreate(options) {
    console.log("onCreate called");
    this.maxClients = 2;
    this.setState(new EstadoHeadBall());

    // --- CONSTANTES DE FÍSICA ---
    this.GRAVITY = 1200; // píxeles/segundo²
    this.BALL_RADIUS = 26;
    this.IMPACT_FORCE = 800; // Fuerza de impacto inicial
    this.RESTITUTION_FLOOR = 0.75; // Suelo
    this.RESTITUTION_WALLS = 0.85; // Paredes laterales
    this.RESTITUTION_CEILING = 0.5; // Techo
    this.AIR_FRICTION = 0.98; // Fricción del aire (amortiguamiento por frame)
    this.ARENA_WIDTH = 1280;
    this.ARENA_HEIGHT = 720;
    this.GROUND_Y = 648; // Posición Y del suelo (alineado mejor con jugadores)

    // --- INICIALIZAR MATTER.JS ---
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.world.gravity.y = 1; // Gravedad para jugadores; el balón usa gravedad personalizada

    // 1. Crear el Suelo Físico (Alineado con césped visual de Kaplay)
    // Kaplay Visual Ground Y = 720 - 72 = 648. Centro del rectángulo en 698.
    this.suelo = Matter.Bodies.rectangle(
      1280 / 2,
      698, // Centro Y
      1280,
      100, // Alto
      { isStatic: true },
    );

    // 2. Crear las Paredes
    const paredIzquierda = Matter.Bodies.rectangle(-50, 720 / 2, 100, 720, {
      isStatic: true,
    });
    const paredDerecha = Matter.Bodies.rectangle(1280 + 50, 720 / 2, 100, 720, {
      isStatic: true,
    });

    // 3. Crear la Pelota Física
    this.pelotaBody = Matter.Bodies.circle(
      this.state.pelota.x,
      this.state.pelota.y,
      this.BALL_RADIUS,
      {
        restitution: 0,
        friction: 0,
        density: 0.001,
        isKinematic: true, // Controlaremos su movimiento manualmente
      },
    );

    Matter.Composite.add(this.world, [
      this.suelo,
      paredIzquierda,
      paredDerecha,
      this.pelotaBody,
    ]);

    // --- ESCUCHAR CONTROLES ---
    this.onMessage("input", (client, input) => {
      const jugador = this.state.jugadores.get(client.sessionId);
      if (jugador) jugador.input = input;
    });

    // --- LOOP DE SIMULACIÓN ---
    this.setSimulationInterval(() => {
      const deltaTime = 1000 / 60; // 16.67ms a 60 FPS
      const dt = deltaTime / 1000; // Convertir a segundos

      // --- ACTUALIZAR FÍSICAS DE MATTER.JS (para jugadores y gravedad) ---
      Matter.Engine.update(this.engine, deltaTime);

      // --- FÍSICA DEL BALÓN ---
      // 1. Aplicar gravedad personalizada
      this.state.pelota.vy += this.GRAVITY * dt;

      // 2. Aplicar fricción del aire (amortiguamiento)
      this.state.pelota.vx *= this.AIR_FRICTION;
      this.state.pelota.vy *= this.AIR_FRICTION;

      // 3. Actualizar posición del balón
      this.state.pelota.x += this.state.pelota.vx * dt;
      this.state.pelota.y += this.state.pelota.vy * dt;

      // --- DETECCIÓN DE COLISIÓN JUGADOR-BALÓN ---
      this.state.jugadores.forEach((jugador, sessionId) => {
        if (jugador.fisica) {
          // Calcular distancia entre centros
          const dx = this.state.pelota.x - jugador.x;
          const dy = this.state.pelota.y - jugador.y;
          const distancia = Math.sqrt(dx * dx + dy * dy);

          const distanciaMinima = jugador.width / 2 + this.BALL_RADIUS;

          // Si hay colisión
          if (distancia < distanciaMinima) {
            // Calcular dirección del rebote (vector normalizado)
            const nx = dx / distancia;
            const ny = dy / distancia;

            // Velocidad del jugador en el momento del impacto
            const vpx = jugador.fisica.velocity.x;
            const vpy = jugador.fisica.velocity.y;

            // Calcular nueva velocidad del balón
            this.state.pelota.vx = vpx * 0.5 + nx * this.IMPACT_FORCE;
            this.state.pelota.vy = vpy * 0.5 + ny * this.IMPACT_FORCE;

            // Separar el balón del jugador para evitar múltiples colisiones
            this.state.pelota.x = jugador.x + nx * distanciaMinima;
            this.state.pelota.y = jugador.y + ny * distanciaMinima;
          }
        }
      });

      // --- REBOTES CON PAREDES Y SUELO ---
      // Rebote con paredes laterales (izquierda y derecha)
      if (this.state.pelota.x - this.BALL_RADIUS < 0) {
        this.state.pelota.x = this.BALL_RADIUS;
        this.state.pelota.vx = -this.state.pelota.vx * this.RESTITUTION_WALLS;
      }
      if (this.state.pelota.x + this.BALL_RADIUS > this.ARENA_WIDTH) {
        this.state.pelota.x = this.ARENA_WIDTH - this.BALL_RADIUS;
        this.state.pelota.vx = -this.state.pelota.vx * this.RESTITUTION_WALLS;
      }

      // Rebote con suelo
      if (this.state.pelota.y + this.BALL_RADIUS > this.GROUND_Y) {
        this.state.pelota.y = this.GROUND_Y - this.BALL_RADIUS;
        this.state.pelota.vy = -this.state.pelota.vy * this.RESTITUTION_FLOOR;
      }

      // Rebote con techo
      if (this.state.pelota.y - this.BALL_RADIUS < 0) {
        this.state.pelota.y = this.BALL_RADIUS;
        this.state.pelota.vy = -this.state.pelota.vy * this.RESTITUTION_CEILING;
      }

      // --- SINCRONIZAR POSICIÓN DEL PELOTABODY CON EL ESTADO ---
      Matter.Body.setPosition(this.pelotaBody, {
        x: this.state.pelota.x,
        y: this.state.pelota.y,
      });

      // --- CONTROLAR Y SINCRONIZAR JUGADORES ---
      this.state.jugadores.forEach((jugador, sessionId) => {
        if (jugador.fisica) {
          let vx = jugador.fisica.velocity.x;
          let vy = jugador.fisica.velocity.y;
          const velocidadCaminar = 8;

          if (jugador.input?.left) {
            vx = -velocidadCaminar;
          } else if (jugador.input?.right) {
            vx = velocidadCaminar;
          } else {
            vx = 0;
          }

          // --- NUEVA LÓGICA DE SALTO ---
          if (jugador.input?.jump) {
            // 1. Recopilamos todos los objetos que sirven de "plataforma"
            const cuerposParaSaltar = [this.suelo, this.pelotaBody];

            // Añadimos a los otros jugadores (excluyendo al jugador actual)
            this.state.jugadores.forEach((otroJugador) => {
              if (otroJugador.fisica && otroJugador.fisica !== jugador.fisica) {
                cuerposParaSaltar.push(otroJugador.fisica);
              }
            });

            // 2. Buscamos si estamos tocando alguno de esos objetos
            const colisiones = Matter.Query.collides(
              jugador.fisica,
              cuerposParaSaltar,
            );
            let estaApoyadoEnAlgo = false;

            // 3. Revisamos si el objeto tocado está realmente DEBAJO
            for (let i = 0; i < colisiones.length; i++) {
              const colision = colisiones[i];

              // Identificamos cuál de los dos cuerpos chocando es el "otro" objeto
              const otroCuerpo =
                colision.bodyA === jugador.fisica
                  ? colision.bodyB
                  : colision.bodyA;

              // En Matter.js la Y crece hacia abajo.
              // Si el centro del otro objeto tiene una Y mayor que el jugador, está debajo.
              // Sumamos "10" como margen de seguridad para evitar saltar si se rozan de lado.
              if (otroCuerpo.position.y > jugador.fisica.position.y + 10) {
                estaApoyadoEnAlgo = true;
                break; // Encontramos algo debajo, dejamos de buscar
              }
            }

            // 4. Ejecutar el salto si las condiciones se cumplen
            if (estaApoyadoEnAlgo) {
              vy = -15;
            }

            // Apagamos el input siempre. Al aplicar la velocidad, el jugador se separará
            // del objeto en el siguiente frame, garantizando que el salto ocurra "solo una vez".
            jugador.input.jump = false;
          }

          Matter.Body.setVelocity(jugador.fisica, { x: vx, y: vy });

          // Sincronizar coordenadas
          jugador.x = jugador.fisica.position.x;
          jugador.y = jugador.fisica.position.y;
        }
      });
    });
  }

  onJoin(client, options) {
    console.log("onJoin called", client.sessionId);
    const nuevoJugador = new Jugador();

    let startX = this.state.jugadores.size === 0 ? 1280 * 0.15 : 1280 * 0.85;

    nuevoJugador.equipo =
      this.state.jugadores.size === 0 ? "local" : "visitante";
    nuevoJugador.x = startX;
    nuevoJugador.y = 720 * 0.3; // soltar jugador desde arriba
    nuevoJugador.input = { left: false, right: false, jump: false };

    // --- CREAR EL JUGADOR EN MATTER.JS ---
    const jugadorBody = Matter.Bodies.rectangle(
      nuevoJugador.x,
      nuevoJugador.y,
      nuevoJugador.width,
      nuevoJugador.height,
      {
        inertia: Infinity,
        friction: 0,
        restitution: 0,
        density: 0.05,
      },
    );

    Matter.Composite.add(this.world, jugadorBody);
    nuevoJugador.fisica = jugadorBody;
    this.state.jugadores.set(client.sessionId, nuevoJugador);
  }

  onLeave(client, consented) {
    const jugador = this.state.jugadores.get(client.sessionId);
    if (jugador && jugador.fisica) {
      Matter.Composite.remove(this.world, jugador.fisica);
    }
    this.state.jugadores.delete(client.sessionId);
  }
}

module.exports = { HeadBallRoom };
