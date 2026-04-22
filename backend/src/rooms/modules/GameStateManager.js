/**
 * Maneja el estado global del juego: marcador, bloqueo de goles, pausa post-gol y tiempo.
 */
class GameStateManager {
  constructor(roomState) {
    this.state = roomState;
    this.goalLock = false;
    this.postGoalPause = false;
    this.timerAccumulator = 0; // Acumulador para contar los segundos exactos

    // Asegurar que los marcadores y el tiempo existen en el schema
    if (typeof this.state.golesLocal === "undefined") {
      this.state.golesLocal = 0;
    }
    if (typeof this.state.golesVisitante === "undefined") {
      this.state.golesVisitante = 0;
    }
    if (typeof this.state.tiempoRestante === "undefined") {
      this.state.tiempoRestante = 180; // 3 minutos en segundos
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
    return this.postGoalPause || this.state.estadoPartido === "finalizado";
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
      this.state.golesLocal++;
    } else if (team === "visitante") {
      this.state.golesVisitante++;
    }
    console.log(
      `🏆 GOL de ${team} → ${this.state.golesLocal} : ${this.state.golesVisitante}`,
    );
  }

  getScore() {
    return {
      local: this.state.golesLocal,
      visitante: this.state.golesVisitante,
    };
  }

  resetGoalLockAndPause() {
    this.goalLock = false;
    this.postGoalPause = false;
  }

  /**
   * Actualiza el reloj del juego.
   * IMPORTANTE: Llama a este método dentro de la función de update/simulación de tu Room.
   * @param {number} deltaTime - Tiempo transcurrido en milisegundos desde el último frame.
   */
  updateTimer(deltaTime) {
    if (this.state.tiempoRestante > 0 && this.state.estadoPartido !== "finalizado") {
      this.timerAccumulator += deltaTime;

      // Cuando pasa 1 segundo (1000ms), reducimos el contador
      if (this.timerAccumulator >= 1000) {
        this.state.tiempoRestante--;
        this.timerAccumulator -= 1000; // Restamos el segundo y conservamos el remanente

        if (this.state.tiempoRestante === 0) {
          console.log("tiempo finalizado");
          this.state.estadoPartido = "finalizado";
        }
      }
    }
  }

  restartGame() {
    this.state.golesLocal = 0;
    this.state.golesVisitante = 0;
    this.state.tiempoRestante = 180;
    this.state.estadoPartido = "jugando";
    this.resetGoalLockAndPause();
    this.timerAccumulator = 0;
  }
}

module.exports = { GameStateManager };
