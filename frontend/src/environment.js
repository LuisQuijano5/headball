// CONSTANTES QUE SE VA A OCUPAR QUE VENGAN DEL SERVER, AL MENOS LAS BASE Y CALCULAR LAS OTRAS.
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const GRASS_VISUAL_HEIGHT = SCREEN_HEIGHT * 0.10;
const VISUAL_GROUND_Y = SCREEN_HEIGHT - GRASS_VISUAL_HEIGHT;
const GOAL_WIDTH = SCREEN_WIDTH * 0.05;
const LINE_WIDTH = 4;
const STRIPE_WIDTH = 100;

// Helper: Pone el background
function drawBackground() {
    add([
        sprite("bgd", { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }),
        pos(0, 0),
        z(-10)
    ]);

    add([
        rect(SCREEN_WIDTH, SCREEN_HEIGHT),
        pos(0, 0),
        color(0, 0, 0),
        opacity(0.4),
        z(-9)
    ]);
}

// Helper: Dibuja las stripes
function drawGrassStripes() {
    const numStripes = Math.ceil(SCREEN_WIDTH / STRIPE_WIDTH);
    
    for (let i = 0; i < numStripes; i++) {
        const isLightGreen = i % 2 === 0;
        add([
            rect(STRIPE_WIDTH, GRASS_VISUAL_HEIGHT),
            pos(i * STRIPE_WIDTH, VISUAL_GROUND_Y),
            color(isLightGreen ? rgb(70, 150, 70) : rgb(60, 140, 60)),
            z(-5)
        ]);
    }
}

// Helper: Pitch lines dibuja
function drawPitchLines() {
    const bottomMargin = 15;
    const bottomLineY = SCREEN_HEIGHT - bottomMargin;
    const lineHeight = bottomLineY - VISUAL_GROUND_Y;

    // Bottom horizontal line connecting the goals
    add([
        rect(SCREEN_WIDTH - (GOAL_WIDTH * 2), LINE_WIDTH),
        pos(GOAL_WIDTH, bottomLineY),
        color(255, 255, 255),
        z(-4)
    ]);

    // Center vertical line
    add([
        rect(LINE_WIDTH, lineHeight),
        pos(SCREEN_WIDTH / 2 - (LINE_WIDTH / 2), VISUAL_GROUND_Y),
        color(255, 255, 255),
        z(-4)
    ]);

    // Center semi-circle (drawn with perspective)
    const radiusX = GRASS_VISUAL_HEIGHT * 1.2;
    const radiusY = radiusX * 0.3;
    const perspectivePoints = [];
    
    for (let i = 0; i <= 20; i++) {
        const angle = (i / 20) * Math.PI;
        perspectivePoints.push(vec2(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY));
    }
    
    add([
        pos(SCREEN_WIDTH / 2, VISUAL_GROUND_Y),
        z(-4),
        {
            draw() {
                drawLines({ pts: perspectivePoints, width: LINE_WIDTH, color: rgb(255, 255, 255) });
            }
        }
    ]);

    // Left goal vertical line
    add([
        rect(LINE_WIDTH, lineHeight),
        pos(GOAL_WIDTH, VISUAL_GROUND_Y),
        color(255, 255, 255),
        z(-4)
    ]);

    // Right goal vertical line
    add([
        rect(LINE_WIDTH, lineHeight),
        pos(SCREEN_WIDTH - GOAL_WIDTH - LINE_WIDTH, VISUAL_GROUND_Y),
        color(255, 255, 255),
        z(-4)
    ]);
}

export function setupEnvironment() {
    drawBackground();
    drawGrassStripes();
    drawPitchLines();
}