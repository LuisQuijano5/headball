/**
 * ARCHIVO PRINCIPAL DEL JUEGO (FRONTEND)
 */

import kaplay from "kaplay";              
// NUEVO: Importamos las nuevas funciones separadas
import { crearSalaPrivada, unirseASala } from "./network.js";     
import { setupEnvironment } from "./environment.js";  
import { setupGameSync } from "./sync.js";       

// =============================================================
// 1. CONFIGURACIÓN DE LA PANTALLA
// =============================================================
const SCREEN_WIDTH = 1280;   
const SCREEN_HEIGHT = 720;   
const BG_COLOR = [0, 0, 0];  

// =============================================================
// 2. CONFIGURACIÓN DE SPRITES (IMÁGENES)
// =============================================================
const SPRITE_ID = "bgd";                    
const SPRITE_PATH = "/assets/stadium2.png";  // Corregí la ruta para que Vite la lea de /public

const GROUND_Y = 810;      
const GOAL_SCALE = 1.3;    

// =============================================================
// 3. INICIALIZAR KAPLAY
// =============================================================
kaplay({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    letterbox: true,    
    background: BG_COLOR
});

// =============================================================
// 4. CARGAR SPRITES (IMÁGENES) EN MEMORIA
// =============================================================
loadSprite(SPRITE_ID, SPRITE_PATH);                    
loadSprite("porteria_izq", "/assets/porteria_izquierda.png");  
loadSprite("porteria_der", "/assets/porteria_derecha.png");     

// =============================================================
// 5. FUNCIÓN PARA DIBUJAR LAS PORTERÍAS
// =============================================================
function dibujarPorterias() {
    const OFFSET_X = 230;  
    
    add([
        sprite("porteria_izq"),
        pos(-OFFSET_X, GROUND_Y),      
        anchor("botleft"),              
        scale(GOAL_SCALE),             
        z(2),                          
    ]);
    
    add([
        sprite("porteria_der"),
        pos(SCREEN_WIDTH + OFFSET_X, GROUND_Y),  
        anchor("botright"),             
        scale(GOAL_SCALE),
        z(2),
    ]);
}

// =============================================================
// 6. FUNCIÓN PRINCIPAL QUE INICIA EL JUEGO (SÚPER LIMPIA)
// =============================================================
async function iniciarJuego() {
    const urlParams = new URLSearchParams(window.location.search);
    let roomId = urlParams.get('room');

    if (roomId === "undefined" || roomId === "null" || roomId === "") {
        console.log("URL sucia detectada. Limpiando...");
        window.history.replaceState(null, '', '/');
        roomId = null;
    }

    let room;

    if (!roomId) {
        try {
            room = await crearSalaPrivada();
            
            const idSeguro = room.id || room.roomId; 
            console.log("El ID seguro a usar es:", idSeguro);
            
            window.history.pushState(null, '', `/?room=${idSeguro}`);
            
        } catch (e) {
            console.error("Error crítico al crear la sala:", e);
            return; 
        }

    } else {
        try {
            console.log(`Intentando unirse a la sala: ${roomId}`);
            room = await unirseASala(roomId);
            console.log("¡Unión exitosa!");
        } catch (e) {
            console.error("Error al unirse. La sala caducó o está llena.", e);
            window.location.href = "/";
            return;
        }
    }
    
    setupEnvironment();
    dibujarPorterias();
    setupGameSync(room);
}

iniciarJuego();