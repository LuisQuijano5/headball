const { Room } = require("@colyseus/core");
const { EstadoHeadBall } = require("../schema/EstadoHeadball");
const { Jugador } = require("../schema/Jugador");

class HeadBallRoom extends Room {
    onCreate(options) {
        console.log("onCreate called");
        
        this.maxClients = 2; 
        
        this.setState(new EstadoHeadBall());

        this.setSimulationInterval((deltaTime) => {
            // LOOP
        });
    }

    onJoin(client, options) {
        console.log("onJoin called", client.sessionId);
        const nuevoJugador = new Jugador();
        
        if (this.state.jugadores.size === 0) {
            nuevoJugador.equipo = "local";
            nuevoJugador.x = 1280 * 0.15; 
            nuevoJugador.y = 720 * 0.70;  
        } else {
            nuevoJugador.equipo = "visitante";
            nuevoJugador.x = 1280 * 0.85; 
            nuevoJugador.y = 720 * 0.70;
        }

        this.state.jugadores.set(client.sessionId, nuevoJugador);
    }

    onLeave(client, consented) {
        this.state.jugadores.delete(client.sessionId);
    }
}
module.exports = { HeadBallRoom };