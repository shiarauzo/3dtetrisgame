# PLANS.md - Stakk: 3D Tetris Game

## Purpose / Big Picture

**Stakk** es un videojuego web de Tetris 3D con estética isométrica minimalista. El jugador apila tetrominós clásicos en un espacio tridimensional y debe completar planos horizontales para eliminarlos y sumar puntos.

### User Benefits
- Experiencia de Tetris fresca con mecánicas 3D
- Competencia global mediante ranking público sin necesidad de login
- Estética distintiva (monocromático amarillo/negro) que diferencia de clones existentes
- Acceso inmediato desde el navegador

### Expected User-Visible Behavior
- Landing page mínima con nombre, "Click para jugar", y preview del ranking
- Juego 3D isométrico con controles de teclado y cámara rotable
- Vista de próxima pieza y top 5 del ranking durante el juego
- Sistema de puntos por altura de caída, combos y multi-plano
- Pantalla de game over con score, posición en ranking, y opciones de reintentar o ver ranking completo

---

## Initial Requirements & Scope

### High-Level Requirements
- Juego funcional de Tetris 3D en navegador
- Sistema de ranking global persistente
- Estética isométrica monocromática
- Controles intuitivos para 3D

### Key Features (MVP)

| Feature | Descripción |
|---------|-------------|
| Core gameplay | Grid 5x5x15, tetrominós 2D en espacio 3D, limpiar planos horizontales |
| Controles | Flechas (mover), Q/E+R/F (rotar pieza), Mouse+X/Y/Z (cámara), Espacio (drop) |
| Puntuación | Por altura de caída + combos consecutivos + bonus multi-plano |
| Dificultad | Velocidad aumenta por planos limpiados, curva exponencial, sin tope |
| Ranking | Global con filtros diario/semanal, nickname por partida, validación en servidor |
| UI | Landing mínima, juego centrado, paneles laterales, top 5 visible |
| Pausa | ESC, juego oculto, máximo 2 min antes de game over |

### In-Scope (MVP)
- [x] Definición de mecánicas de juego
- [x] Definición de controles
- [x] Definición de sistema de puntos
- [x] Definición de UI/UX
- [x] Definición de stack tecnológico
- [ ] Implementación del juego con Three.js
- [ ] Backend serverless en Vercel
- [ ] Base de datos en Supabase
- [ ] Sistema de ranking
- [ ] Deploy en stakk.vercel.app

### Out-of-Scope (Fase 2+)
- Efectos de audio con ElevenLabs
- Música ambient con presets
- Desafío diario (mismas piezas para todos)
- Controles táctiles mejorados para mobile
- Compartir en redes sociales
- Stats detallados e historial por jugador

---

## Milestones & Deliverables

### Milestone 1: Core Game Engine
**Objetivo:** Juego funcional sin backend

- [ ] Setup proyecto Three.js + Vite
- [ ] Renderizado isométrico del grid 5x5
- [ ] Sistema de piezas (7 tetrominós clásicos)
- [ ] Física de caída y colisiones
- [ ] Controles de movimiento (flechas)
- [ ] Rotación de piezas (Q/E + R/F)
- [ ] Rotación de cámara (mouse drag + X/Y/Z snaps)
- [ ] Drop rápido (espacio)
- [ ] Detección y limpieza de planos completos
- [ ] Efecto flash blanco al limpiar
- [ ] Condición de game over

**Acceptance Criteria:**
- Se puede jugar una partida completa offline
- Controles responden correctamente
- Planos se limpian al completarse
- Game over cuando las piezas llegan arriba

### Milestone 2: Scoring & Difficulty
**Objetivo:** Sistema de progresión funcional

- [ ] Puntos por altura de caída
- [ ] Multiplicador por combos consecutivos
- [ ] Bonus por multi-plano (2+ planos de un golpe)
- [ ] Display de puntuación en tiempo real
- [ ] Sistema de niveles por planos limpiados
- [ ] Curva de velocidad exponencial
- [ ] Sin tope de velocidad

**Acceptance Criteria:**
- Puntuación refleja correctamente las acciones
- El juego acelera notablemente con el progreso
- Eventualmente la velocidad hace el juego imposible

### Milestone 3: UI & Polish
**Objetivo:** Experiencia completa de usuario

- [ ] Landing page mínima (nombre + click to play + ranking preview)
- [ ] Panel lateral izquierdo (próxima pieza)
- [ ] Panel lateral derecho (score + top 5)
- [ ] Estética amarillo sólido (#FFD700)
- [ ] Bloques negros con borde amarillo
- [ ] Grid con líneas finas
- [ ] Pantalla de game over minimalista
- [ ] Input de nickname
- [ ] Botón "?" con panel de controles
- [ ] Sistema de pausa (ESC, ocultar juego, max 2 min)
- [ ] Responsive básico para mobile

**Acceptance Criteria:**
- UI matches imagen de referencia
- Todos los elementos de información visibles
- Pausa funciona con restricciones anti-abuse

### Milestone 4: Backend & Ranking
**Objetivo:** Persistencia y competencia

- [ ] Setup Supabase (tabla de scores)
- [ ] API serverless en Vercel (submit score, get rankings)
- [ ] Validación básica de scores en servidor
- [ ] Ranking global
- [ ] Filtro diario
- [ ] Filtro semanal
- [ ] Mostrar top 5 durante juego
- [ ] Mostrar ranking completo post-game
- [ ] Mostrar posición del jugador

**Acceptance Criteria:**
- Scores persisten entre sesiones
- Validación rechaza scores imposibles
- Filtros temporales funcionan correctamente

### Milestone 5: Deploy & Launch
**Objetivo:** Disponible públicamente

- [ ] Configurar dominio stakk.vercel.app
- [ ] Optimización de bundle
- [ ] Testing cross-browser (Chrome, Firefox, Safari)
- [ ] Meta tags para SEO básico
- [ ] Favicon
- [ ] Error handling robusto

**Acceptance Criteria:**
- Sitio accesible públicamente
- Funciona en navegadores principales
- Performance aceptable (60 FPS target)

---

## Progress

### Current Status: Planning Complete

- [x] 2024-04-28: Sesión de diseño "grill me" completada
- [x] 2024-04-28: PLANS.md creado
- [ ] Milestone 1: Core Game Engine
- [ ] Milestone 2: Scoring & Difficulty
- [ ] Milestone 3: UI & Polish
- [ ] Milestone 4: Backend & Ranking
- [ ] Milestone 5: Deploy & Launch

---

## Surprises & Discoveries

*Esta sección se actualizará durante el desarrollo.*

| Fecha | Descubrimiento | Impacto |
|-------|---------------|---------|
| - | - | - |

---

## Decision Log

| Fecha | Decisión | Razonamiento |
|-------|----------|--------------|
| 2024-04-28 | Grid 5x5 con 15 niveles | Balance entre dificultad y accesibilidad |
| 2024-04-28 | Tetrominós 2D en espacio 3D | Familiaridad del Tetris clásico + estrategia de posicionamiento 3D |
| 2024-04-28 | Limpiar planos horizontales completos | Traducción natural de "línea" a 3D |
| 2024-04-28 | Three.js puro (sin React) | Mayor control, menos abstracción |
| 2024-04-28 | Vercel + Supabase | Stack simple, gratuito para empezar, fácil de escalar |
| 2024-04-28 | Nickname por partida (no persistente) | Flexibilidad para el usuario, simplicidad de implementación |
| 2024-04-28 | MVP sin audio | Lanzar rápido, validar tracción, iterar con audio en fase 2 |
| 2024-04-28 | Estética monocromática amarillo/negro | Identidad visual fuerte, diferenciación de competidores |
| 2024-04-28 | Pausa con juego oculto + max 2 min | Permite pausas legítimas, previene abuse estratégico |

---

## Outcomes & Retrospectives

*Esta sección se actualizará al completar cada milestone.*

### Milestone 1: Core Game Engine
- **Status:** Pendiente
- **Results:** -
- **Lessons:** -

### Milestone 2: Scoring & Difficulty
- **Status:** Pendiente
- **Results:** -
- **Lessons:** -

### Milestone 3: UI & Polish
- **Status:** Pendiente
- **Results:** -
- **Lessons:** -

### Milestone 4: Backend & Ranking
- **Status:** Pendiente
- **Results:** -
- **Lessons:** -

### Milestone 5: Deploy & Launch
- **Status:** Pendiente
- **Results:** -
- **Lessons:** -

---

## Technical Specifications

### Stack
- **Frontend:** Three.js (vanilla), Vite
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Vercel (stakk.vercel.app)

### Controls Reference
| Acción | Tecla |
|--------|-------|
| Mover pieza | Flechas |
| Rotar horizontal | Q / E |
| Rotar vertical | R / F |
| Drop rápido | Espacio |
| Rotar cámara | Mouse drag |
| Snap cámara eje X | X |
| Snap cámara eje Y | Y |
| Snap cámara eje Z | Z |
| Pausa | ESC |
| Ayuda | ? |

### Color Palette
- **Background:** #FFD700 (amarillo sólido)
- **Blocks:** #000000 (negro) con borde amarillo
- **Grid lines:** Líneas finas oscuras
- **Clear effect:** Flash blanco

### Scoring Formula
```
base_points = drop_height * 10
combo_multiplier = consecutive_clears
multi_plane_bonus = planes_cleared ^ 2 * 100

total = base_points * combo_multiplier + multi_plane_bonus
```

### Difficulty Curve
```
speed = base_speed * (1.1 ^ planes_cleared)
// Sin tope máximo - eventualmente imposible
```
