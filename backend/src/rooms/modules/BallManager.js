// src/rooms/modules/BallManager.js

const Matter = require("matter-js");
const {
  GRAVITY,
  AIR_FRICTION,
  BALL_RADIUS,
  GROUND_Y,
  ARENA_WIDTH,
  BALL_BOUNCE_GROUND,
  BALL_BOUNCE_WALL,
  BALL_BOUNCE_CEILING,
  BALL_FRICTION_AIR,
  BALL_FRICTION_GROUND,
  LEFT_WALL,
  RIGHT_WALL,
  GOAL_LEFT_X,
  GOAL_RIGHT_X
} = require('../constants/GameConstants');

/**
 * Maneja la física y posición de la pelota.
 */
class BallManager {
  constructor(roomState, world, ballBody) {
    this.state = roomState; // schema EstadoHeadBall
    this.world = world;
    this.ballBody = ballBody;
  }

  /**
   * Actualiza la posición y velocidad de la pelota (integración manual).
   * @param {number} dt - delta time en segundos
   */
  update(dt) {
    // Si el juego finalizó, detenemos la pelota
    if (this.state.estadoPartido === "finalizado") {
      this.state.pelota.vx = 0;
      this.state.pelota.vy = 0;
      Matter.Body.setVelocity(this.ballBody, { x: 0, y: 0 });
      return;
    }

    // Aplicar gravedad y fricción
    this.state.pelota.vy += GRAVITY * dt;
    this.state.pelota.vx *= AIR_FRICTION;
    this.state.pelota.vy *= AIR_FRICTION;

    // Integrar posición
    this.state.pelota.x += this.state.pelota.vx * dt;
    this.state.pelota.y += this.state.pelota.vy * dt;

    // Sincronizar cuerpo físico de Matter (si se usa para colisiones)
    Matter.Body.setPosition(this.ballBody, {
      x: this.state.pelota.x,
      y: this.state.pelota.y
    });

    this.handleBoundaries();
  }

  handleBoundaries() {
    // Rebote con el suelo
    if (this.state.pelota.y + BALL_RADIUS > GROUND_Y) {
      this.state.pelota.y = GROUND_Y - BALL_RADIUS;
      this.state.pelota.vy *= BALL_BOUNCE_GROUND;
      this.state.pelota.vx *= BALL_FRICTION_GROUND;
    }

    // Rebote con el techo
    if (this.state.pelota.y - BALL_RADIUS < 0) {
      this.state.pelota.y = BALL_RADIUS;
      this.state.pelota.vy *= BALL_BOUNCE_CEILING;
    }

    // Rebotes laterales (fuera del área de gol)
    const dentroAlturaGol = (this.state.pelota.y + BALL_RADIUS > GOAL_LEFT_X && 
                              this.state.pelota.y - BALL_RADIUS < GOAL_RIGHT_X); // nota: usar GOAL_TOP/GOAL_BOTTOM
    // Corregir: usar constantes correctas
    const dentroAltura = (this.state.pelota.y + BALL_RADIUS > 400 && 
                          this.state.pelota.y - BALL_RADIUS < 650);
    
    if (!dentroAltura) {
      if (this.state.pelota.x < BALL_RADIUS) {
        this.state.pelota.x = BALL_RADIUS;
        this.state.pelota.vx *= BALL_BOUNCE_WALL;
      } else if (this.state.pelota.x > ARENA_WIDTH - BALL_RADIUS) {
        this.state.pelota.x = ARENA_WIDTH - BALL_RADIUS;
        this.state.pelota.vx *= BALL_BOUNCE_WALL;
      }
    } else {
      // Dentro del área de gol, evitar que la pelota se salga por los laterales
      if (this.state.pelota.x + BALL_RADIUS < 0 || this.state.pelota.x - BALL_RADIUS > ARENA_WIDTH) {
        this.state.pelota.x = Math.min(Math.max(this.state.pelota.x, BALL_RADIUS), ARENA_WIDTH - BALL_RADIUS);
        this.state.pelota.vx *= -0.5;
      }
    }
  }

  /**
   * Resetea la pelota al centro de la cancha.
   */
  resetBall() {
    this.state.pelota.x = ARENA_WIDTH / 2;
    this.state.pelota.y = GROUND_Y - BALL_RADIUS - 10;
    this.state.pelota.vx = 0;
    this.state.pelota.vy = 0;
    Matter.Body.setPosition(this.ballBody, { x: this.state.pelota.x, y: this.state.pelota.y });
    Matter.Body.setVelocity(this.ballBody, { x: 0, y: 0 });
  }

  /**
   * Aplica una fuerza/impulso a la pelota desde una colisión.
   * @param {number} nx - normal X
   * @param {number} ny - normal Y
   * @param {number} potencia - fuerza base
   * @param {number} vpx - velocidad del jugador en X
   * @param {boolean} esPie - si es colisión con el pie
   * @param {boolean} pateando - si el jugador está pateando
   */
  applyCollisionImpulse(nx, ny, potencia, vpx, esPie, pateando) {
    this.state.pelota.vx = (vpx * 0.5) + (nx * potencia * 0.6);
    this.state.pelota.vy = (ny * potencia * 0.5);
    if (esPie) {
      this.state.pelota.vy -= (pateando ? 400 : 150);
    }
  }

  /**
   * Separa la pelota de un cuerpo con el que colisionó (resuelve solapamiento).
   * @param {number} nx
   * @param {number} ny
   * @param {number} overlap
   */
  resolveOverlap(nx, ny, overlap) {
    this.state.pelota.x += nx * (overlap + 8);
    this.state.pelota.y += ny * (overlap + 8);
  }
}

module.exports = { BallManager };