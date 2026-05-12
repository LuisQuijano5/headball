const { Schema, MapSchema, defineTypes } = require("@colyseus/schema");
const { Jugador } = require("./Jugador");
const { Pelota } = require("./Pelota");
const { Porteria } = require("./Porteria");

class EstadoHeadBall extends Schema {
  constructor() {
    super();

    this.jugadores = new MapSchema();

    this.pelota = new Pelota();
    this.pelota.x = 1280 * 0.5;
    this.pelota.y = 720 * 0.3;

    this.porteriaLocal = new Porteria();
    this.porteriaLocal.equipo = "local";
    this.porteriaLocal.x = 1280 * 0.05;
    this.porteriaLocal.y = 720 * 0.7;

    this.porteriaVisitante = new Porteria();
    this.porteriaVisitante.equipo = "visitante";
    this.porteriaVisitante.x = 1280 * 0.95;
    this.porteriaVisitante.y = 720 * 0.7;

    this.golesLocal = 0;
    this.golesVisitante = 0;

    this.tiempoRestante = 180;

    this.estadoPartido = "esperando_jugadores";

    this.estadoSala = "WAITING";
  }
}

defineTypes(EstadoHeadBall, {
  jugadores: { map: Jugador },

  pelota: Pelota,

  porteriaLocal: Porteria,
  porteriaVisitante: Porteria,

  golesLocal: "number",
  golesVisitante: "number",

  tiempoRestante: "number",

  estadoPartido: "string",

  estadoSala: "string",
});

module.exports = { EstadoHeadBall };
