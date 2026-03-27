const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config(); 

const { Server } = require('@colyseus/core');
const { WebSocketTransport } = require('@colyseus/ws-transport');

const { HeadBallRoom } = require('./rooms/HeadballRoom');

const PORT = process.env.BACKEND_PORT|| 3001;


const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());


const server = http.createServer(app);

const gameServer = new Server({
    transport: new WebSocketTransport({
        server: server
    })
});

gameServer.define("headball_room", HeadBallRoom);

gameServer.listen(PORT);
console.log(`Server running on http://localhost:${PORT}`);