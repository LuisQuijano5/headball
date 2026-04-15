const { defineTypes } = require("@colyseus/schema");
const { Entidad } = require("./Entidad");

class Jugador extends Entidad {
  constructor() {
    super();
    this.equipo = "";
    this.width = 60; 
    this.height = 100;
    this.vx = 0;
    this.vy = 0;
    this.input = { left: false, right: false, jump: false, kick: false };
    this.pateando = false; // Sincronizado con el cliente
    this.timerPatada = 0;
  }
}

defineTypes(Jugador, {
  equipo: "string",
  width: "number",
  height: "number",
  pateando: "boolean", // ¡IMPORTANTE!
});

module.exports = { Jugador };