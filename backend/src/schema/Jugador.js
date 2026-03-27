const { defineTypes } = require("@colyseus/schema");
const { Entidad } = require("./Entidad");

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

module.exports = { Jugador };