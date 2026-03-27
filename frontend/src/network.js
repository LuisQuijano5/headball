import { Client } from "@colyseus/sdk";
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const client = new Client(backendUrl);

export async function connectRoom() {
    try {
        return await client.joinOrCreate("headball_room");
    } catch (e) {
        console.error(e);
    }
}