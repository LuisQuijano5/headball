// src/rooms/modules/PlayerManager.js

const Matter = require("matter-js");
const {
  WALK_SPEED,
  JUMP_VELOCITY,
  GROUND_Y,
  ARENA_WIDTH,
  KICK_DURATION,
  KICK_FORCE,
  REBOUND_BODY,
  REBOUND_FOOT,
  SPAWN_LOCAL_X,
  SPAWN_VISITANTE_X,
  SPAWN_Y
} = require('../constants/GameConstants');

/**
 * Maneja la creación, movimiento, patadas y colisiones de los jugadores.
 */
class PlayerManager {
  constructor(roomState, physicsManager, ballManager, gameStateManager) {
    this.state = roomState;
    this.physics = physicsManager;
    this.ballManager = ballManager;
    this.gameStateManager = gameStateManager; // ✅ Esto es lo que usa para isMovementPaused()
  }

  /**
   * Crea un nuevo jugador y lo agrega al estado y al mundo físico.
   * @param {string} sessionId
   * @param {boolean} esLocal
   * @returns {object} el objeto Jugador del schema
   */
  createPlayer(sessionId, esLocal) {
    const { Jugador } = require("../../schema/Jugador");
    const nuevoJugador = new Jugador();
    nuevoJugador.equipo = esLocal ? "local" : "visitante";
    const spawnX = esLocal ? SPAWN_LOCAL_X : SPAWN_VISITANTE_X;
    nuevoJugador.x = spawnX;
    nuevoJugador.y = SPAWN_Y;
    
    // Inicializar input por defecto
    nuevoJugador.input = { left: false, right: false, jump: false, kick: false };
    nuevoJugador.pateando = false;
    nuevoJugador.timerPatada = 0;

    const playerBody = this.physics.createPlayerBody(spawnX, SPAWN_Y, nuevoJugador.equipo);
    this.physics.addBody(playerBody);
    nuevoJugador.fisica = playerBody;

    this.state.jugadores.set(sessionId, nuevoJugador);
    return nuevoJugador;
  }

  /**
   * Elimina un jugador del mundo físico y del estado.
   * @param {string} sessionId
   */
  removePlayer(sessionId) {
    const jugador = this.state.jugadores.get(sessionId);
    if (jugador && jugador.fisica) {
      this.physics.removeBody(jugador.fisica);
    }
    this.state.jugadores.delete(sessionId);
  }

  /**
   * Actualiza todos los jugadores: movimiento, saltos, patadas, colisiones con pelota.
   * @param {number} deltaTimeMs - delta en milisegundos
   */
  updateAll(deltaTimeMs) {
    const dt = Math.min(deltaTimeMs / 1000, 0.033);
    
    this.state.jugadores.forEach((jugador) => {
      if (!jugador.fisica) return;

      const input = jugador.input || { left: false, right: false, jump: false, kick: false };

      // Si el juego finalizó, congelar al jugador
      if (this.state.estadoPartido === "finalizado") {
        jugador.pateando = false;
        jugador.timerPatada = 0;
        Matter.Body.setVelocity(jugador.fisica, { x: 0, y: 0 });
      } else {
        // Lógica de patada
        if (input.kick && !jugador.pateando) {
          jugador.pateando = true;
          jugador.timerPatada = KICK_DURATION;
          input.kick = false; // consumir evento
        }
        if (jugador.pateando) {
          jugador.timerPatada -= deltaTimeMs;
          if (jugador.timerPatada <= 0) jugador.pateando = false;
        }

        // Colisiones con la pelota
        this.handleBallCollisions(jugador);

        // 🔥 Verificar si el movimiento está pausado
        const isPaused = this.gameStateManager.isMovementPaused();
        
        // Movimiento y salto (solo si NO está en pausa)
        if (!isPaused) {
          this.handleMovement(jugador, input, dt);
        }
      }

      // Sincronizar posición del schema con el cuerpo físico
      jugador.x = jugador.fisica.position.x;
      jugador.y = jugador.fisica.position.y;

      // Evitar que se hundan en el suelo
      if (jugador.y + 50 > GROUND_Y) {
        jugador.y = GROUND_Y - 50;
        Matter.Body.setPosition(jugador.fisica, { x: jugador.x, y: jugador.y });
      }

      // Limitar movimiento horizontal
      if (jugador.x < 50) jugador.x = 50;
      if (jugador.x > ARENA_WIDTH - 50) jugador.x = ARENA_WIDTH - 50;
      Matter.Body.setPosition(jugador.fisica, { x: jugador.x, y: jugador.y });
    });
  }

  handleBallCollisions(jugador) {
    const partes = jugador.fisica.parts.slice(1);
    const ballBody = this.physics.getBallBody();

    for (const parte of partes) {
      const colision = Matter.Collision.collides(parte, ballBody);
      if (colision) {
        const nx = colision.normal.x;
        const ny = colision.normal.y;
        const esPie = parte.label === "hitbox_pie";
        let potencia = esPie ? (jugador.pateando ? KICK_FORCE : REBOUND_FOOT) : REBOUND_BODY;
        const vpx = jugador.fisica.velocity.x;

        this.ballManager.applyCollisionImpulse(nx, ny, potencia, vpx, esPie, jugador.pateando);
        this.ballManager.resolveOverlap(nx, ny, colision.depth);
      }
    }
  }

  handleMovement(jugador, input, dt) {
    let vx = 0;
    let vy = jugador.fisica.velocity.y;

    // Movimiento horizontal
    if (input.left) vx = -WALK_SPEED;
    else if (input.right) vx = WALK_SPEED;

    // Salto
    if (input.jump) {
      if (this.canJump(jugador)) {
        vy = JUMP_VELOCITY;
      }
      input.jump = false; // consumir salto
    }

    Matter.Body.setVelocity(jugador.fisica, { x: vx, y: vy });
  }

  canJump(jugador) {
    // Cuerpos sobre los que se puede saltar (suelo, pelota, otros jugadores)
    const saltables = [this.physics.getGroundBody(), this.physics.getBallBody()];
    
    this.state.jugadores.forEach(otro => {
      if (otro.fisica && otro.fisica !== jugador.fisica) {
        saltables.push(otro.fisica);
      }
    });
    
    const colisiones = Matter.Query.collides(jugador.fisica, saltables);
    
    for (let col of colisiones) {
      const otro = col.bodyA === jugador.fisica ? col.bodyB : col.bodyA;
      // Verificar si el otro cuerpo está por debajo del jugador
      if (otro.position.y > jugador.fisica.position.y + 10) {
        return true;
      }
    }
    return false;
  }

  /**
   * Resetea todos los jugadores a sus posiciones de spawn.
   */
  resetPlayersToSpawn() {
    this.state.jugadores.forEach((jugador, sessionId) => {
      const esLocal = jugador.equipo === "local";
      const nuevaX = esLocal ? SPAWN_LOCAL_X : SPAWN_VISITANTE_X;
      const nuevaY = SPAWN_Y;

      jugador.x = nuevaX;
      jugador.y = nuevaY;
      if (jugador.fisica) {
        Matter.Body.setPosition(jugador.fisica, { x: nuevaX, y: nuevaY });
        Matter.Body.setVelocity(jugador.fisica, { x: 0, y: 0 });
      }
      
      // Resetear estado de patada
      jugador.pateando = false;
      jugador.timerPatada = 0;
    });
  }
}

module.exports = { PlayerManager };