# Efectos de Sonido - Headball

## Archivos Disponibles

### sonido_gol.mp3
- **Uso**: Se reproduce cuando hay un gol
- **Volumen**: 2.5x (250%)
- **Duración**: Según el archivo

### sonido_gradas.mp3
- **Uso**: Sonido de afición, se reproduce en bucle cuando hay gol
- **Volumen**: 1.0x (100%)
- **Duración**: Según el archivo

## Archivos Faltantes

### sonido_pateo.mp3 ⚠️ REQUERIDO
- **Uso**: Se reproduce cuando un jugador ejecuta un pateo válido (contacto pie-pelota mientras patea)
- **Duración recomendada**: 0.2 - 0.4 segundos (efecto corto)
- **Volumen**: 1.5x (150%) en el código
- **Ubicación**: Debe estar en esta carpeta como `sonido_pateo.mp3`

## Cómo Agregar sonido_pateo.mp3

1. Obtén un archivo de audio de pateo/golpe (MP3)
   - Puede ser un efecto de sonido corto de golpe o patada
   - Debe ser un archivo .mp3 válido

2. Renómbralo como `sonido_pateo.mp3`

3. Colócalo en esta carpeta: `/frontend/sound_effects/`

4. El sistema ya está configurado para reproducirlo automáticamente:
   - Backend: Detecta pateos válidos en `PlayerManager.js`
   - Frontend: Lo reproduce sin retraso en `sync.js`

## Arquitectura de Sonidos

### Backend
- `PlayerManager.js`: Detecta colisiones pie-pelota mientras `jugador.pateando == true`
- `HeadballRoom.js`: Hace broadcast del evento `"kick"` con el equipo que pateó

### Frontend
- `main.js`: Carga el sonido
- `sync.js`: Escucha el evento `room.onMessage("kick")` y reproduce el sonido

## Características Implementadas

✅ Sonido se reproduce sin retraso  
✅ Solo en pateos válidos (pie + acción de patear)  
✅ No se reproduce en otras colisiones (jugador-jugador, balón-suelo, etc)  
✅ Diferenciado de otros sonidos del juego  

