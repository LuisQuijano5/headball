const { Schema, MapSchema, defineTypes } = require("@colyseus/schema");
const { Jugador } = require("./Jugador");
const { Pelota } = require("./Pelota");
const { Porteria } = require("./Porteria");

class EstadoHeadBall extends Schema {
    constructor() {
        super();
        this.jugadores = new MapSchema(); 
        
        // Setup Ball
        this.pelota = new Pelota(); 
        this.pelota.x = 1280 * 0.50; 
        this.pelota.y = 720 * 0.30;
        
        // Setup Local Goal
        this.porteriaLocal = new Porteria();
        this.porteriaLocal.equipo = "local";
        this.porteriaLocal.x = 1280 * 0.05; // Left edge
        this.porteriaLocal.y = 720 * 0.70;  // Ground level

        // Setup Visitante Goal
        this.porteriaVisitante = new Porteria();
        this.porteriaVisitante.equipo = "visitante";
        this.porteriaVisitante.x = 1280 * 0.95; // Right edge
        this.porteriaVisitante.y = 720 * 0.70;  // Ground level
        
        this.golesLocal = 0; 
        this.golesVisitante = 0;
        this.estadoPartido = "esperando_jugadores"; 
    }
}

defineTypes(EstadoHeadBall, {
    jugadores: { map: Jugador },
    pelota: Pelota,
    porteriaLocal: Porteria,
    porteriaVisitante: Porteria,
    golesLocal: "number",
    golesVisitante: "number",
    estadoPartido: "string"
});

module.exports = { EstadoHeadBall };