// src/rooms/modules/GoalManager.js

const { GOAL_TOP, GOAL_BOTTOM, GOAL_LEFT_X, GOAL_RIGHT_X, BALL_RADIUS, ARENA_WIDTH, POST_GOAL_PAUSE_DURATION } = require('../constants/GameConstants');

/**
 * Maneja la detección de goles, reposicionamiento y notificaciones.
 */
class GoalManager {
  constructor(room, gameStateManager, ballManager, playerManager) {
    this.room = room;
    this.gameState = gameStateManager;
    this.ballManager = ballManager;
    this.playerManager = playerManager;
    this.postGoalTimeout = null;
  }

  /**
   * Verifica si se marcó un gol y lo procesa.
   * @param {number} ballX
   * @param {number} ballY
   * @returns {boolean} true si se marcó gol
   */
  checkAndProcessGoal(ballX, ballY) {
    if (!this.gameState.canScoreGoal()) return false;

    const dentroAltura = (ballY + BALL_RADIUS > GOAL_TOP && ballY - BALL_RADIUS < GOAL_BOTTOM);
    const golIzquierda = (ballX + BALL_RADIUS < GOAL_LEFT_X) && dentroAltura;
    const golDerecha = (ballX - BALL_RADIUS > GOAL_RIGHT_X) && dentroAltura;

    let equipoQueAnota = null;
    if (golIzquierda) equipoQueAnota = "visitante";
    else if (golDerecha) equipoQueAnota = "local";

    if (equipoQueAnota) {
      this.processGoal(equipoQueAnota);
      return true;
    }
    return false;
  }

  processGoal(equipoQueAnota) {
    this.gameState.lockGoal();
    this.gameState.pauseMovement();
    this.gameState.incrementScore(equipoQueAnota);

    // Notificar a todos los clientes
    const score = this.gameState.getScore();
    this.room.broadcast("goal", {
      equipo: equipoQueAnota,
      local: score.local,
      visitante: score.visitante
    });

    // Reposicionar jugadores y pelota
    this.playerManager.resetPlayersToSpawn();
    this.ballManager.resetBall();

    // Programar desbloqueo después de la pausa
    if (this.postGoalTimeout) clearTimeout(this.postGoalTimeout);
    this.postGoalTimeout = setTimeout(() => {
      this.gameState.unlockGoal();
      this.gameState.resumeMovement();
      this.postGoalTimeout = null;
    }, POST_GOAL_PAUSE_DURATION);
  }

  dispose() {
    if (this.postGoalTimeout) {
      clearTimeout(this.postGoalTimeout);
      this.postGoalTimeout = null;
    }
  }
}

module.exports = { GoalManager };