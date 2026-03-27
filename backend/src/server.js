const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config(); 

const { Server } = require('@colyseus/core');
const { WebSocketTransport } = require('@colyseus/ws-transport');

const { HeadBallRoom } = require('./rooms/HeadballRoom');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Attach Colyseus to HTTP server
const gameServer = new Server({
    transport: new WebSocketTransport({
        server: server
    })
});

// Register room
gameServer.define("headball_room", HeadBallRoom);

// Start server
const PORT = 3001;

gameServer.listen(PORT);
console.log(`Server running on http://localhost:${PORT}`);