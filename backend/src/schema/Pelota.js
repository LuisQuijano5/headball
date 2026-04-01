const { defineTypes } = require("@colyseus/schema");
const { Entidad } = require("./Entidad");

class Pelota extends Entidad {
    constructor() {
        super();
        this.radius = 26; // 1280 * 0.02
        this.vx = 0;
        this.vy = 0;
    }
}

defineTypes(Pelota, {
    radius: "number",
    vx: "number",
    vy: "number"
});

module.exports = { Pelota };