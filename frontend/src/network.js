// src/network.js
import { Client } from "@colyseus/sdk";
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const client = new Client(backendUrl);

export async function crearSalaPrivada() {
    console.log("Pidiendo al server crear sala...");
    const room = await client.create("headball_room");
    console.log("¡Sala recibida en network.js!", room);
    return room; 
}

export async function unirseASala(roomId) {
    const room = await client.joinById(roomId);
    return room;
}