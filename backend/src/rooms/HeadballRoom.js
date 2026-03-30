const { Room } = require("@colyseus/core");
const Matter = require("matter-js");
const { EstadoHeadBall } = require("../schema/EstadoHeadball");
const { Jugador } = require("../schema/Jugador");

class HeadBallRoom extends Room {
  onCreate(options) {
    console.log("onCreate called");
    this.maxClients = 2;
    this.setState(new EstadoHeadBall());

    // --- INICIALIZAR MATTER.JS ---
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.world.gravity.y = 1;

    // 1. Crear el Suelo Físico (Alineado con césped visual de Kaplay)
    // Kaplay Visual Ground Y = 720 - 72 = 648. Centro del rectángulo en 698.
    const suelo = Matter.Bodies.rectangle(
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
    // this.pelotaBody = Matter.Bodies.circle(
    //   this.state.pelota.x,
    //   this.state.pelota.y,
    //   26, // Equivalente a 1280 * 0.02
    //   {
    //     restitution: 0.8, // Rebote
    //     friction: 0.005,
    //     density: 0.001, // Densidad ligera
    //   },
    // );

    Matter.Composite.add(this.world, [
      suelo,
      paredIzquierda,
      paredDerecha,
      // this.pelotaBody,
    ]);

    // --- ESCUCHAR CONTROLES ---
    this.onMessage("input", (client, input) => {
      const jugador = this.state.jugadores.get(client.sessionId);
      if (jugador) jugador.input = input;
    });

    // --- LOOP DE SIMULACIÓN ---
    this.setSimulationInterval(() => {
      // 1. Avanzar la física a 60 FPS estables
      Matter.Engine.update(this.engine, 1000 / 60);

      // 2. Sincronizar la Pelota (Convertimos radianes a grados para Kaplay)
      this.state.pelota.x = this.pelotaBody.position.x;
      this.state.pelota.y = this.pelotaBody.position.y;
      this.state.pelota.rotation = this.pelotaBody.angle * (180 / Math.PI);

      // 3. Controlar y Sincronizar Jugadores
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

          // Salto
          if (jugador.input?.jump && Math.abs(vy) < 0.5) {
            vy = -15;
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
