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

    this.input = {
      left: false,
      right: false,
      jump: false,
      kick: false
    };

    this.pateando = false;
    this.timerPatada = 0;

    // NUEVO
    this.character = "default";
    this.ready = false;
  }
}

defineTypes(Jugador, {
  equipo: "string",

  width: "number",
  height: "number",

  pateando: "boolean",

  // NUEVO
  character: "string",
  ready: "boolean",
});

module.exports = { Jugador };