const { defineTypes } = require("@colyseus/schema");
const { Entidad } = require("./Entidad");

class Pelota extends Entidad {
    constructor() {
        super();
        this.radius = 1280 * 0.02; 
    }
}

defineTypes(Pelota, {
    radius: "number"
});

module.exports = { Pelota };