const { Schema, MapSchema, defineTypes } = require("@colyseus/schema");

class Entidad extends Schema {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.rotation = 0; 
    }
}
// ✅ Official vanilla JS way to define schema types
defineTypes(Entidad, {
    x: "number",
    y: "number",
    rotation: "number"
});

class Jugador extends Entidad {
    constructor() {
        super();
        this.equipo = ""; 
        this.width = 1280 * 0.06; 
        this.height = 720 * 0.15; 
    }
}
defineTypes(Jugador, {
    equipo: "string",
    width: "number",
    height: "number"
});

class EstadoHeadBall extends Schema {
    constructor() {
        super();
        this.jugadores = new MapSchema(); 
        this.pelota = new Entidad(); 
        
        this.pelota.x = 1280 * 0.50; 
        this.pelota.y = 720 * 0.30;
        
        this.golesLocal = 0; 
        this.golesVisitante = 0;
        this.estadoPartido = "esperando_jugadores"; 
    }
}
defineTypes(EstadoHeadBall, {
    jugadores: { map: Jugador },
    pelota: Entidad,
    golesLocal: "number",
    golesVisitante: "number",
    estadoPartido: "string"
});

module.exports = { EstadoHeadBall, Jugador, Entidad };