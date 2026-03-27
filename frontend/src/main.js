import kaplay from "kaplay";
import { connectRoom } from "./network.js";
import { setupEnvironment } from "./environment.js";
import { setupGameSync } from "./sync.js";

// CONSTANTES QUE IGUAL ALGUNAS REQUIEREN VENIR DEL SERVER O PROPAGARSE
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const BG_COLOR = [0, 0, 0];
const SPRITE_ID = "bgd";
const SPRITE_PATH = "../public/assets/stadium2.png";

kaplay({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    letterbox: true,
    background: BG_COLOR
});

loadSprite(SPRITE_ID, SPRITE_PATH);

async function iniciarJuego() {
    const room = await connectRoom();

    if (room) {
        setupEnvironment();
        setupGameSync(room);
    }
}

iniciarJuego();