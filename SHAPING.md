---
shaping: true
---

# Stakk — 3D Tetris Game Shaping

## Frame

### Source

> Quiero crear un pequeño proyecto que sea como un videojuego de un Tetris 3D. Algo como la imagen que se ve. Tiene que tener visible cuál será el siguiente cubo que bajará y los puntos. Además de una zona de ranking pero sin login, cualquiera puede hacerlo.

> [Imagen de referencia: Estética isométrica con bloques negros sobre fondo amarillo, grid visible]

### Problem

Los clones de Tetris 3D existentes no tienen una identidad visual distintiva ni mecánicas que los diferencien. Además, la mayoría requieren login para participar en rankings, lo que añade fricción innecesaria.

### Outcome

Un juego web de Tetris 3D con:
- Estética isométrica monocromática distintiva
- Ranking global accesible sin autenticación
- Experiencia inmediata "click to play"

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | **Hacer un Tetris 3D jugable en navegador** | Core goal |
| **R1** | **Mecánica de limpieza** | |
| R1.1 | Limpiar planos horizontales completos (5x5) | Must-have |
| R1.2 | Grid de 5x5 base, 15 niveles de altura | Must-have |
| R1.3 | Tetrominós 2D clásicos posicionados en espacio 3D | Must-have |
| **R2** | **Controles** | |
| R2.1 | Flechas para mover pieza en plano X/Z | Must-have |
| R2.2 | Q/E para rotación horizontal, R/F para rotación vertical | Must-have |
| R2.3 | Mouse drag para rotar cámara | Must-have |
| R2.4 | Teclas X/Y/Z para snap de cámara a ejes | Must-have |
| R2.5 | Espacio para drop rápido | Must-have |
| R2.6 | ESC para pausar | Must-have |
| **R3** | **Estética visual** | |
| R3.1 | Proyección isométrica | Must-have |
| R3.2 | Fondo amarillo sólido (#FFD700) | Must-have |
| R3.3 | Bloques negros con borde amarillo | Must-have |
| R3.4 | Grid de líneas finas visibles | Must-have |
| R3.5 | Flash blanco al limpiar plano | Must-have |
| **R4** | **Sistema de puntos** | |
| R4.1 | Puntos por altura de caída (drop height × 10) | Must-have |
| R4.2 | Multiplicador por combos consecutivos | Must-have |
| R4.3 | Bonus exponencial por multi-plano (planes² × 100) | Must-have |
| R4.4 | Sin penalizaciones | Must-have |
| **R5** | **Dificultad progresiva** | |
| R5.1 | Velocidad aumenta por planos limpiados | Must-have |
| R5.2 | Curva exponencial (speed = base × 1.1^planes) | Must-have |
| R5.3 | Sin tope máximo (eventualmente imposible) | Must-have |
| **R6** | **Ranking sin login** | |
| R6.1 | Solo nickname (se pide cada partida) | Must-have |
| R6.2 | Validación básica de scores en servidor | Must-have |
| R6.3 | Ranking global con filtros diario/semanal | Must-have |
| R6.4 | Top 5 visible durante el juego | Must-have |
| **R7** | **UI/UX** | |
| R7.1 | Landing mínima: título + "click to play" + ranking preview | Must-have |
| R7.2 | Juego centrado, paneles laterales (next piece, score, ranking) | Must-have |
| R7.3 | Solo mostrar siguiente pieza (no cola de 3) | Must-have |
| R7.4 | Pausa con juego oculto, máximo 2 min | Must-have |
| R7.5 | Panel de ayuda toggle (?) con controles | Must-have |
| R7.6 | Game over minimalista: score, posición, retry, ver ranking | Must-have |
| **R8** | **Audio (Fase 2)** | |
| R8.1 | Efectos de voz con ElevenLabs (reacciones + feedback) | Nice-to-have |
| R8.2 | Loop ambient de música | Nice-to-have |
| R8.3 | Presets de audio: todo/efectos/música/silencio | Nice-to-have |
| **R9** | **Técnico** | |
| R9.1 | Three.js puro (sin React wrapper) | Must-have |
| R9.2 | Vercel serverless para API | Must-have |
| R9.3 | Supabase para persistencia | Must-have |
| R9.4 | Responsive básico (enfocado en desktop) | Must-have |

---

## Selected Shape: A — Three.js + Vercel + Supabase

Solo hay una shape porque las decisiones ya fueron tomadas en la sesión de diseño.

### A: Stack minimalista web-native

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Core Game Engine** | |
| A1.1 | Three.js scene con proyección isométrica | |
| A1.2 | Grid 3D (5×5×15) como array tridimensional | |
| A1.3 | 7 tetrominós clásicos como geometrías 3D | |
| A1.4 | Game loop con requestAnimationFrame | |
| A1.5 | Sistema de colisiones (grid-based) | |
| A1.6 | Detección y limpieza de planos completos | |
| **A2** | **Input System** | |
| A2.1 | KeyboardEvent listeners para movimiento/rotación | |
| A2.2 | Mouse drag con Pointer Lock o delta tracking | |
| A2.3 | Snaps de cámara a posiciones predefinidas (X/Y/Z) | |
| **A3** | **Rendering** | |
| A3.1 | OrthographicCamera con posición isométrica | |
| A3.2 | MeshBasicMaterial negro + EdgesGeometry amarillo | |
| A3.3 | GridHelper o líneas custom para el floor | |
| A3.4 | Animación flash (color → blanco → fade) | |
| **A4** | **Scoring & Difficulty** | |
| A4.1 | Score calculator: dropHeight × 10 × comboMultiplier | |
| A4.2 | Multi-plane bonus: planesCleared² × 100 | |
| A4.3 | Difficulty curve: fallInterval = base / (1.1^level) | |
| **A5** | **State Management** | |
| A5.1 | Game state object: grid, score, level, currentPiece, nextPiece | |
| A5.2 | Pause state con timer de 2 minutos | |
| A5.3 | Game over state con finalScore | |
| **A6** | **UI Layer** | |
| A6.1 | HTML/CSS overlay para score, level, next piece | |
| A6.2 | Landing page estática | |
| A6.3 | Modal de pausa | |
| A6.4 | Modal de game over con input de nickname | |
| A6.5 | Vista de ranking con tabs de filtro | |
| A6.6 | Panel de ayuda (controles) | |
| **A7** | **Backend API** | |
| A7.1 | POST /api/submit-score: valida y guarda en Supabase | |
| A7.2 | GET /api/rankings?filter=global|daily|weekly | |
| A7.3 | Validación: score plausible (tiempo × max_score_rate) | |
| **A8** | **Database** | |
| A8.1 | Tabla `scores`: id, nickname, score, created_at | |
| A8.2 | Índices para queries de ranking eficientes | |

---

## Fit Check: R × A

| Req | Requirement | Status | A |
|-----|-------------|--------|:-:|
| R0 | Hacer un Tetris 3D jugable en navegador | Core goal | ✅ |
| R1.1 | Limpiar planos horizontales completos (5x5) | Must-have | ✅ |
| R1.2 | Grid de 5x5 base, 15 niveles de altura | Must-have | ✅ |
| R1.3 | Tetrominós 2D clásicos en espacio 3D | Must-have | ✅ |
| R2.1 | Flechas para mover pieza | Must-have | ✅ |
| R2.2 | Q/E + R/F para rotación | Must-have | ✅ |
| R2.3 | Mouse drag para rotar cámara | Must-have | ✅ |
| R2.4 | X/Y/Z para snap de cámara | Must-have | ✅ |
| R2.5 | Espacio para drop rápido | Must-have | ✅ |
| R2.6 | ESC para pausar | Must-have | ✅ |
| R3.1 | Proyección isométrica | Must-have | ✅ |
| R3.2 | Fondo amarillo sólido | Must-have | ✅ |
| R3.3 | Bloques negros con borde amarillo | Must-have | ✅ |
| R3.4 | Grid de líneas finas | Must-have | ✅ |
| R3.5 | Flash blanco al limpiar | Must-have | ✅ |
| R4.1 | Puntos por altura de caída | Must-have | ✅ |
| R4.2 | Multiplicador por combos | Must-have | ✅ |
| R4.3 | Bonus multi-plano | Must-have | ✅ |
| R4.4 | Sin penalizaciones | Must-have | ✅ |
| R5.1 | Velocidad por planos limpiados | Must-have | ✅ |
| R5.2 | Curva exponencial | Must-have | ✅ |
| R5.3 | Sin tope máximo | Must-have | ✅ |
| R6.1 | Solo nickname | Must-have | ✅ |
| R6.2 | Validación básica en servidor | Must-have | ✅ |
| R6.3 | Ranking global + filtros | Must-have | ✅ |
| R6.4 | Top 5 visible durante juego | Must-have | ✅ |
| R7.1 | Landing mínima | Must-have | ✅ |
| R7.2 | Juego centrado, paneles laterales | Must-have | ✅ |
| R7.3 | Solo siguiente pieza | Must-have | ✅ |
| R7.4 | Pausa con juego oculto, max 2 min | Must-have | ✅ |
| R7.5 | Panel de ayuda toggle | Must-have | ✅ |
| R7.6 | Game over minimalista | Must-have | ✅ |
| R8.1 | Efectos ElevenLabs | Nice-to-have | — |
| R8.2 | Loop ambient | Nice-to-have | — |
| R8.3 | Presets de audio | Nice-to-have | — |
| R9.1 | Three.js puro | Must-have | ✅ |
| R9.2 | Vercel serverless | Must-have | ✅ |
| R9.3 | Supabase | Must-have | ✅ |
| R9.4 | Responsive básico | Must-have | ✅ |

**Notes:**
- R8.x (Audio) marcados como Nice-to-have para Fase 2, no evaluados en MVP

---

## Slices

Ver [BREADBOARD.md](./BREADBOARD.md) para affordances detalladas y wiring.

### Slice Summary

| # | Slice | Parts | Demo |
|---|-------|-------|------|
| V1 | Core rendering | A1.1, A3.1, A3.2, A3.3, A2.2, A2.3 | "Grid 3D visible, cámara rota con mouse y snaps X/Y/Z" |
| V2 | Piece spawning | A1.2, A1.3, A5.1 | "Tetrominó aparece arriba, preview de siguiente pieza" |
| V3 | Movement & rotation | A2.1, A1.5 | "Flechas mueven, Q/E/R/F rotan, espacio droppea" |
| V4 | Collision & placement | A1.5 | "Pieza se detiene al colisionar, bloques permanecen" |
| V5 | Plane clearing | A1.6, A3.4 | "Plano completo hace flash y desaparece" |
| V6 | Scoring & difficulty | A4.1, A4.2, A4.3, A5.1 | "Score sube, nivel aumenta, juego acelera" |
| V7 | Game flow | A5.2, A5.3, A6.3, A6.4 | "Pausa funciona, game over muestra score" |
| V8 | Ranking system | A6.5, A7.1, A7.2, A7.3, A8.1, A8.2 | "Score se guarda, ranking muestra filtros" |
| V9 | Polish | A6.1, A6.2, A6.6 | "Landing → juego → game over → ranking loop completo" |

### Slice Dependencies

```
V1 ──→ V2 ──→ V3 ──→ V4 ──→ V5
                              ↓
              V7 ←── V6 ←────┘
               ↓
              V8 ──→ V9
```

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-04-28 | Grid 5×5×15 | Balance dificultad/accesibilidad |
| 2024-04-28 | Tetrominós 2D en 3D | Familiaridad + estrategia de posicionamiento |
| 2024-04-28 | Planos horizontales | Traducción natural de "línea" a 3D |
| 2024-04-28 | Three.js puro | Control total, sin overhead de React |
| 2024-04-28 | Vercel + Supabase | Gratuito, simple, escalable |
| 2024-04-28 | Nickname por partida | Flexibilidad sin complejidad de auth |
| 2024-04-28 | MVP sin audio | Lanzar rápido, validar tracción primero |
| 2024-04-28 | Estética monocromática | Identidad visual fuerte, diferenciación |
| 2024-04-28 | Pausa oculta + 2min | Permite pausas legítimas, previene abuse |
| 2024-04-28 | Curva exponencial sin tope | Garantiza game over eventual, partidas épicas posibles |

---

## Open Questions

Ninguna. Todas las decisiones fueron tomadas en la sesión de diseño.

---

## Next Steps

1. ☐ Inicializar proyecto (Vite + Three.js)
2. ☐ Implementar V1: Core rendering
3. ☐ Iterar por slices V2-V9
4. ☐ Deploy a Vercel
5. ☐ Fase 2: Audio con ElevenLabs
