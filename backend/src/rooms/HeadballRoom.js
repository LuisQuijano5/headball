const { Room } = require("@colyseus/core");
const { EstadoHeadBall } = require("../schema/EstadoHeadball");

const { PhysicsManager } = require("./modules/PhysicsManager");
const { BallManager } = require("./modules/BallManager");
const { PlayerManager } = require("./modules/PlayerManager");
const { GameStateManager } = require("./modules/GameStateManager");
const { GoalManager } = require("./modules/GoalManager");
// ELIMINADO: const { CountdownManager } = require("./modules/CountdownManager");

class HeadBallRoom extends Room {
  onCreate(options) {
    console.log("🏟️ Room HeadBall - VERSIÓN MODULAR COMPLETA");
    console.log("SALA REAL CREADA CON ID:", this.roomId);

    this.maxClients = 2;
    this.selecciones = new Map();
    this.setState(new EstadoHeadBall());

    // Inicializar módulos
    this.physicsManager = new PhysicsManager();
    this.physicsManager.initialize();

    this.ballManager = new BallManager(
      this.state,
      this.physicsManager.getWorld(),
      this.physicsManager.getBallBody(),
    );

    this.gameStateManager = new GameStateManager(this.state);

    // ✅ NUEVO: Crear callback para pateos válidos
    const onKickCallback = (equipo) => {
      this.broadcast("kick", { equipo });
    };

    this.playerManager = new PlayerManager(
      this.state,
      this.physicsManager,
      this.ballManager,
      this.gameStateManager,
      onKickCallback,
    );

    this.goalManager = new GoalManager(
      this,
      this.gameStateManager,
      this.ballManager,
      this.playerManager,
    );

    // ELIMINADO: this.countdownManager = new CountdownManager(this);
    // ELIMINADO: this.gameStarted = false;

    // Escuchar mensajes de clientes
    this.onMessage("input", (client, input) => {
      const jugador = this.state.jugadores.get(client.sessionId);
      if (jugador) jugador.input = input;
    });

    this.onMessage("restart", (client) => {
      if (this.state.estadoPartido === "finalizado") {
        this.gameStateManager.restartGame();
        this.playerManager.resetPlayersToSpawn();
        this.ballManager.resetBall();
      }
    });

    this.onMessage("selectCharacter", (client, character) => {
      console.log(client.sessionId, "eligió", character);

      this.selecciones.set(client.sessionId, character);

      const jugador = this.state.jugadores.get(client.sessionId);

      if (jugador) {
        jugador.character = character;
        jugador.ready = true;
      }

      if (
        this.clients.length === 2 &&
        [...this.state.jugadores.values()].every(j => j.ready)
      ) {
        console.log("Ambos jugadores listos");

        this.state.estadoSala = "PLAYING";
      }
    });

    this.setSimulationInterval((deltaTime) => {

      if (this.state.estadoSala !== "PLAYING") {
        return;
      }

      const dtSec = deltaTime / 1000;

      this.gameStateManager.updateTimer(deltaTime);

      this.physicsManager.update(deltaTime);
      this.ballManager.update(dtSec);

      this.goalManager.checkAndProcessGoal(
        this.state.pelota.x,
        this.state.pelota.y,
      );

      this.playerManager.updateAll(deltaTime);
    });

    this.state.estadoSala = "EMPTY";
  }

  onJoin(client, options) {
    console.log("Jugador unido:", client.sessionId);

    setTimeout(() => {

      if (this.clients.length === 1) {
        console.log("NOT HERE")
        this.state.estadoSala = "WAITING";
      }

      if (this.clients.length === 2) {
        console.log("YUES HERE")
        this.state.estadoSala = "SELECTING";
      }

    }, 50);

    const esLocal = this.clients.length === 1;
this.playerManager.createPlayer(client.sessionId, esLocal);
  }

  onLeave(client, consented) {
    this.playerManager.removePlayer(client.sessionId);

    if (this.clients.length < 2) {
        this.state.estadoSala = "WAITING";
    }
  }
}

module.exports = { HeadBallRoom };
