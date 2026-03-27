const { Schema, defineTypes } = require("@colyseus/schema");

class Entidad extends Schema {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.rotation = 0; 
    }
}

defineTypes(Entidad, {
    x: "number",
    y: "number",
    rotation: "number"
});

module.exports = { Entidad };