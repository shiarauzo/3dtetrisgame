# Stakk Quick Start Guide

Get Stakk running in 2 minutes.

## Prerequisites

- [Bun](https://bun.sh) installed (or Node.js 18+)

## Installation

```bash
# Clone or navigate to the project
cd 3dtetris

# Install dependencies
bun install

# Start dev server
bun run dev
```

Open http://localhost:3000

## First Run

1. You'll see the landing page with "STAKK" title
2. Click "Click to play" button
3. Game starts with first piece falling

## Controls

**Movement**
- Arrow keys: Move piece on X/Z plane
- Q / E: Rotate horizontal
- R / F: Rotate vertical
- Space: Hard drop

**Camera**
- Mouse drag: Rotate camera
- X / Y / Z: Snap camera to axis view

**Game**
- ESC: Pause/Resume
- ? button: Show controls

## How to Play

1. Stack pieces to complete horizontal 5x5 planes
2. Completed planes flash white and disappear
3. Blocks above fall down
4. Score increases based on:
   - Drop height (higher = more points)
   - Consecutive clears (combo multiplier)
   - Multiple planes cleared at once (bonus)
5. Game speeds up with each cleared plane
6. Game over when pieces reach the top

## Testing Different Features

### Test Scoring System
1. Start game
2. Drop a piece from max height
3. Check score increases by ~140 points (14 levels × 10)

### Test Plane Clearing
1. Build a complete 5x5 floor
2. Watch for white flash effect
3. See blocks above fall down
4. Notice score jump and combo increase

### Test Difficulty Progression
1. Clear multiple planes
2. Notice pieces falling faster
3. Level increases in right panel
4. Eventually becomes too fast to play

### Test Pause System
1. Press ESC during game
2. Game pauses, 2-minute timer appears
3. Press Continue to resume
4. Press Exit to return to menu

### Test Ranking (Development)
1. Play until game over
2. Enter a nickname
3. Click Submit Score
4. Score saves to localStorage
5. Appears in landing page Top 5

## Production Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

Open http://localhost:4173

## Troubleshooting

### Dev server won't start
```bash
# Kill existing process
pkill -f vite
# Restart
bun run dev
```

### Build errors
```bash
# Clean install
rm -rf node_modules bun.lock
bun install
bun run build
```

### Game not responding
- Check browser console for errors
- Refresh page (Cmd/Ctrl + R)
- Clear localStorage: `localStorage.clear()` in console

### Rankings not showing
- In development, uses localStorage
- Check Application > Local Storage in DevTools
- Key: `stakk_scores`

## Next Steps

- Read [README.md](./README.md) for full documentation
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to Vercel
- Read [IMPLEMENTATION.md](./IMPLEMENTATION.md) for technical details
- Check [PLANS.md](./PLANS.md) for project roadmap

## Quick Reference

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (port 3000)
bun run build        # Build for production
bun run preview      # Preview production build (port 4173)
```

## Development Tips

1. **Hot Module Replacement (HMR)** works for most changes
2. **Full reload** needed for: index.html changes, new files
3. **TypeScript strict mode** is enabled - fix type errors
4. **Three.js DevTools**: Install browser extension for debugging
5. **Camera reset**: Press Y to snap to top-down view

## Common Issues

**Q: Pieces fall too fast immediately**
A: Check BASE_FALL_SPEED in src/constants.ts (should be 1000ms)

**Q: Can't rotate pieces**
A: Make sure canvas has focus (click on it first)

**Q: Camera won't move with mouse**
A: Click and drag on the canvas, not the UI panels

**Q: Score doesn't increase**
A: Check console for errors, ensure pieces are actually dropping

**Q: Flash effect doesn't show**
A: Verify plane is completely filled (all 25 blocks)

## File Locations

- **Main game logic**: `src/engine/GameEngine.ts`
- **Rendering**: `src/renderer/ThreeRenderer.ts`
- **Controls**: `src/input/InputHandler.ts`
- **UI**: `src/ui/UIManager.ts`
- **Constants**: `src/constants.ts`
- **Piece shapes**: `src/engine/tetrominoes.ts`

Enjoy playing Stakk!
