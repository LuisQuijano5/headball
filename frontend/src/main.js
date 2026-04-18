/**
 * ARCHIVO PRINCIPAL DEL JUEGO (FRONTEND)
 * 
 * Este archivo inicializa el juego, carga los sprites,
 * dibuja las porterías y conecta con el servidor.
 */

import kaplay from "kaplay";              // Motor de juegos 2D
import { connectRoom } from "./network.js";     // Conexión a Colyseus
import { setupEnvironment } from "./environment.js";  // Dibuja la cancha
import { setupGameSync } from "./sync.js";       // Sincronización del juego

// =============================================================
// 1. CONFIGURACIÓN DE LA PANTALLA
// =============================================================
const SCREEN_WIDTH = 1280;   // Ancho de la pantalla en píxeles
const SCREEN_HEIGHT = 720;   // Alto de la pantalla en píxeles
const BG_COLOR = [0, 0, 0];  // Color de fondo (negro)

// =============================================================
// 2. CONFIGURACIÓN DE SPRITES (IMÁGENES)
// =============================================================
const SPRITE_ID = "bgd";                    // ID del sprite del estadio
const SPRITE_PATH = "../public/assets/stadium2.png";  // Ruta de la imagen

const GROUND_Y = 810;      // Posición Y donde se apoya la portería (suelo)
const GOAL_SCALE = 1.3;    // Escala de las porterías (tamaño)

// =============================================================
// 3. INICIALIZAR KAPLAY
// =============================================================
kaplay({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    letterbox: true,    // Mantiene la proporción al redimensionar
    background: BG_COLOR
});

// =============================================================
// 4. CARGAR SPRITES (IMÁGENES) EN MEMORIA
// =============================================================
// NOTA: Las imágenes deben estar en la carpeta public/assets/
loadSprite(SPRITE_ID, SPRITE_PATH);                    // Fondo del estadio
loadSprite("porteria_izq", "/assets/porteria_izquierda.png");  // Portería izquierda
loadSprite("porteria_der", "/assets/porteria_derecha.png");     // Portería derecha

// =============================================================
// 5. FUNCIÓN PARA DIBUJAR LAS PORTERÍAS
// =============================================================
/**
 * Dibuja las dos porterías en los extremos de la cancha
 * La izquierda en x = -OFFSET, la derecha en x = SCREEN_WIDTH + OFFSET
 */
function dibujarPorterias() {
    const OFFSET_X = 230;  // Cuánto sobresale la portería fuera de la pantalla
    
    // Portería izquierda (anclada en la parte inferior izquierda)
    add([
        sprite("porteria_izq"),
        pos(-OFFSET_X, GROUND_Y),      // Posición X negativa (fuera de pantalla)
        anchor("botleft"),              // Ancla en la esquina inferior izquierda
        scale(GOAL_SCALE),             // Escalar la imagen
        z(2),                          // Capa 2 (por encima del fondo)
    ]);
    
    // Portería derecha (anclada en la parte inferior derecha)
    add([
        sprite("porteria_der"),
        pos(SCREEN_WIDTH + OFFSET_X, GROUND_Y),  // Posición X > ancho de pantalla
        anchor("botright"),             // Ancla en la esquina inferior derecha
        scale(GOAL_SCALE),
        z(2),
    ]);
}

// =============================================================
// 6. FUNCIÓN PRINCIPAL QUE INICIA EL JUEGO
// =============================================================
/**
 * Conecta al servidor y configura todo el juego
 */
async function iniciarJuego() {
    // Conectar a la sala de Colyseus
    const room = await connectRoom();
    if (!room) return;  // Si no hay conexión, no continuar

    // NOTA: NO agregamos el fondo manualmente porque setupEnvironment()
    // ya se encarga de dibujar la cancha completa (césped, líneas, etc.)
    
    // Dibujar el entorno (líneas de la cancha, césped, etc.)
    setupEnvironment();
    
    // Dibujar las porterías visuales
    dibujarPorterias();
    
    // Configurar la sincronización del juego (jugadores, pelota, eventos)
    setupGameSync(room);
}

// =============================================================
// 7. EJECUTAR EL JUEGO
// =============================================================
iniciarJuego();