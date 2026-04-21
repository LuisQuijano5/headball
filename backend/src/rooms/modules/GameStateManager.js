// src/rooms/modules/GameStateManager.js

/**
 * Maneja el estado global del juego: marcador, bloqueo de goles y pausa post-gol.
 */
class GameStateManager {
  constructor(roomState) {
    this.state = roomState;
    this.goalLock = false;
    this.postGoalPause = false;

    // Asegurar que los marcadores existen en el schema
    if (typeof this.state.marcadorLocal === 'undefined') {
      this.state.marcadorLocal = 0;
    }
    if (typeof this.state.marcadorVisitante === 'undefined') {
      this.state.marcadorVisitante = 0;
    }
  }

  canScoreGoal() {
    return !this.goalLock;
  }

  lockGoal() {
    this.goalLock = true;
  }

  unlockGoal() {
    this.goalLock = false;
  }

  isMovementPaused() {
    return this.postGoalPause;
  }

  pauseMovement() {
    this.postGoalPause = true;
    console.log("⏸️ Movimiento bloqueado por 800ms");
  }

  resumeMovement() {
    this.postGoalPause = false;
    console.log("▶️ Movimiento reactivado");
  }

  /**
   * Incrementa el marcador del equipo especificado.
   * @param {"local" | "visitante"} team
   */
  incrementScore(team) {
    if (team === "local") {
      this.state.marcadorLocal++;
    } else if (team === "visitante") {
      this.state.marcadorVisitante++;
    }
    console.log(`🏆 GOL de ${team} → ${this.state.marcadorLocal} : ${this.state.marcadorVisitante}`);
  }

  getScore() {
    return {
      local: this.state.marcadorLocal,
      visitante: this.state.marcadorVisitante
    };
  }

  resetGoalLockAndPause() {
    this.goalLock = false;
    this.postGoalPause = false;
  }
}

module.exports = { GameStateManager };