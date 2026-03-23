import { io } from "socket.io-client";
import kaboom from "kaboom";

const socket = io("http://localhost:3000");

kaboom({
    width: 800,
    height: 600,
    background: [135, 206, 235], 
});

let player1Visual, player2Visual, ballVisual;

scene("game", () => {
    player1Visual = add([ rect(40, 40), pos(0, 0), color(255, 0, 0) ]);
    player2Visual = add([ rect(40, 40), pos(0, 0), color(0, 0, 255) ]);
    ballVisual = add([ circle(15), pos(0, 0), color(255, 255, 255) ]);

    socket.on('gameStateUpdate', (serverState) => {
        player1Visual.pos.x = serverState.player1.x * width();
        player1Visual.pos.y = serverState.player1.y * height();

        player2Visual.pos.x = serverState.player2.x * width();
        player2Visual.pos.y = serverState.player2.y * height();

        ballVisual.pos.x = serverState.ball.x * width();
        ballVisual.pos.y = serverState.ball.y * height();
    });
});

go("game");