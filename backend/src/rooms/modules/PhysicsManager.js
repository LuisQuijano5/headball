// src/rooms/modules/PhysicsManager.js

const Matter = require("matter-js");
const { GROUND_Y, GROUND_THICKNESS, ARENA_WIDTH, BALL_RADIUS } = require('../constants/GameConstants');

/**
 * Inicializa y mantiene el motor de física Matter.js.
 */
class PhysicsManager {
  constructor() {
    this.engine = null;
    this.world = null;
    this.groundBody = null;
    this.ballBody = null;
  }

  /**
   * Crea el motor, el mundo y los cuerpos estáticos.
   */
  initialize() {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.world.gravity.y = 1; // gravedad normal (se aplica manualmente a la pelota, pero se deja)

    // Suelo
    this.groundBody = Matter.Bodies.rectangle(
      ARENA_WIDTH / 2,
      GROUND_Y + GROUND_THICKNESS / 2,
      ARENA_WIDTH,
      GROUND_THICKNESS,
      { isStatic: true, restitution: 0.3, friction: 0.5 }
    );

    // Pelota (cuerpo sensor)
    this.ballBody = Matter.Bodies.circle(
      0, 0,
      BALL_RADIUS,
      { isSensor: true, restitution: 0.6, friction: 0.1 }
    );

    Matter.Composite.add(this.world, [this.groundBody, this.ballBody]);
  }

  /**
   * Actualiza el motor de física (integración de Matter).
   * @param {number} deltaTimeMs - tiempo en milisegundos
   */
  update(deltaTimeMs) {
    Matter.Engine.update(this.engine, deltaTimeMs);
  }

  getWorld() {
    return this.world;
  }

  getBallBody() {
    return this.ballBody;
  }

  getGroundBody() {
    return this.groundBody;
  }

  /**
   * Crea un cuerpo compuesto para un jugador.
   * @param {number} x - posición X inicial
   * @param {number} y - posición Y inicial
   * @param {string} team - "local" o "visitante"
   * @returns {Matter.Body}
   */
  createPlayerBody(x, y, team) {
    const { PLAYER_RADIUS, FOOT_SIZE, FOOT_OFFSET, PLAYER_MASS } = require('../constants/GameConstants');
    const pieOffsetX = team === "local" ? FOOT_OFFSET : -FOOT_OFFSET;

    const hitboxCuerpo = Matter.Bodies.circle(0, 0, PLAYER_RADIUS, {
      label: "hitbox_cuerpo",
      restitution: 0.3,
      friction: 0.3
    });

    const hitboxPie = Matter.Bodies.rectangle(pieOffsetX, 40, FOOT_SIZE.width, FOOT_SIZE.height, {
      label: "hitbox_pie",
      restitution: 0.3,
      friction: 0.3
    });

    const playerBody = Matter.Body.create({
      parts: [hitboxCuerpo, hitboxPie],
      inertia: Infinity,
      restitution: 0.3,
      friction: 0.3,
      mass: PLAYER_MASS
    });

    Matter.Body.setPosition(playerBody, { x, y });
    return playerBody;
  }

  addBody(body) {
    Matter.Composite.add(this.world, body);
  }

  removeBody(body) {
    Matter.Composite.remove(this.world, body);
  }
}

module.exports = { PhysicsManager };