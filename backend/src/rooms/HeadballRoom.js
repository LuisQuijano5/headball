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

    this.ballManager = new BallManager(
      this.state,
      this.physicsManager.getWorld(),
      this.physicsManager.getBallBody()
    );

    this.playerManager = new PlayerManager(
      this.state,
      this.physicsManager,
      this.ballManager
    );

    this.gameStateManager = new GameStateManager(this.state);
    this.goalManager = new GoalManager(
      this,
      this.gameStateManager,
      this.ballManager,
      this.playerManager
    );

    // Pasar el flag de pausa al PlayerManager
    this.playerManager.setMovementPausedFlag(() => this.gameStateManager.isMovementPaused());

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

      // Actualizar pelota (integración manual)
      this.ballManager.update(dtSec);

      // Detectar gol (antes de mover jugadores para que la pausa afecte)
      const goalScored = this.goalManager.checkAndProcessGoal(
        this.state.pelota.x,
        this.state.pelota.y
      );

      // Actualizar jugadores (movimiento solo si no hay pausa)
      this.playerManager.updateAll(deltaTime);
    });
  }

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