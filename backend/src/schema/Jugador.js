const { defineTypes } = require("@colyseus/schema");
const { Entidad } = require("./Entidad");

class Jugador extends Entidad {
  // En Jugador.js
  constructor() {
    super();
    this.equipo = "";
    this.width = 1280 * 0.06;
    this.height = 720 * 0.15;

    // Físicas locales (no sincronizadas, solo uso del servidor)
    this.vx = 0;
    this.vy = 0;
    this.speed = 10; // Velocidad al caminar
    this.jumpForce = -20; // Fuerza de salto (negativa porque Y crece hacia abajo)
    this.input = { left: false, right: false, jump: false };
  }
}

defineTypes(Jugador, {
  equipo: "string",
  width: "number",
  height: "number",
});

module.exports = { Jugador };
