// PENDIENTE
const { defineTypes } = require("@colyseus/schema");
const { Entidad } = require("./Entidad");

class Porteria extends Entidad {
    constructor() {
        super();
        this.equipo = "";
        this.width = 1280 * 0.05; 
        this.height = 720 * 0.30; 
    }
}

defineTypes(Porteria, {
    equipo: "string",
    width: "number",
    height: "number"
});

module.exports = { Porteria };