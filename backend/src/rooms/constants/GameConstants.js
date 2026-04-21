// src/rooms/constants/GameConstants.js

module.exports = {
  // Física general
  GRAVITY: 1200,
  AIR_FRICTION: 0.985,

  // Pelota
  BALL_RADIUS: 26,
  REBOUND_BODY: 250,
  REBOUND_FOOT: 550,
  KICK_FORCE: 1600,
  KICK_DURATION: 150,

  // Arena
  ARENA_WIDTH: 1280,
  ARENA_HEIGHT: 720,
  GROUND_Y: 650,
  GROUND_THICKNESS: 60,
  GROUND_Y_POS: 650 + 30, // posición del cuerpo del suelo (mitad del grosor)

  // Portería (rango Y donde se puede marcar gol)
  GOAL_TOP: 400,
  GOAL_BOTTOM: 650,

  // Spawns jugadores
  SPAWN_LOCAL_X: 200,
  SPAWN_VISITANTE_X: 1080,
  SPAWN_Y: 650 - 60, // GROUND_Y - 60

  // Límites de la cancha (para rebotes)
  LEFT_WALL: 0,
  RIGHT_WALL: 1280,
  GOAL_LEFT_X: 50,
  GOAL_RIGHT_X: 1280 - 100,

  // Parámetros de colisiones
  BALL_BOUNCE_GROUND: -0.7,
  BALL_BOUNCE_WALL: -0.85,
  BALL_BOUNCE_CEILING: -0.5,
  GROUND_FRICTION: 0.5,
  BALL_FRICTION_AIR: 0.985,
  BALL_FRICTION_GROUND: 0.98,

  // Jugador
  PLAYER_MASS: 5,
  PLAYER_RADIUS: 50,
  FOOT_SIZE: { width: 60, height: 40 },
  FOOT_OFFSET: 28, // para local (visitante usa -28)
  WALK_SPEED: 8,
  JUMP_VELOCITY: -14,

  // Tiempos (ms)
  POST_GOAL_PAUSE_DURATION: 800
};