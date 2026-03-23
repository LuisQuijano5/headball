const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

let gameState = {
    player1: { x: 0.1, y: 0.8 },
    player2: { x: 0.9, y: 0.8 },
    ball: { x: 0.5, y: 0.5 }
};

io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

setInterval(() => {
    io.emit('gameStateUpdate', gameState);
}, 1000 / 60); 

server.listen(3000, () => {
    console.log('Servidor Back-end corriendo en http://localhost:3000');
});