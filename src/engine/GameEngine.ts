import {
  GameState,
  Piece,
  Position,
  TetrominoType,
  Rotation,
  Block,
} from '../types';
import {
  GRID_WIDTH,
  GRID_DEPTH,
  GRID_HEIGHT,
  BASE_FALL_SPEED,
  DIFFICULTY_MULTIPLIER,
  DROP_POINTS_MULTIPLIER,
  PLANE_BONUS_MULTIPLIER,
} from '../constants';
import { TETROMINO_SHAPES, getRandomTetrominoType } from './tetrominoes';

export class GameEngine {
  private state: GameState;
  private lastFallTime: number = 0;
  private dropStartY: number = 0;
  private recentlyClearedPlanes: number[] = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const grid: (boolean | null)[][][] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      grid[x] = [];
      for (let y = 0; y < GRID_HEIGHT; y++) {
        grid[x][y] = [];
        for (let z = 0; z < GRID_DEPTH; z++) {
          grid[x][y][z] = null;
        }
      }
    }

    return {
      grid,
      score: 0,
      level: 1,
      combo: 0,
      currentPiece: null,
      nextPiece: null,
      placedBlocks: [],
      isPaused: false,
      isGameOver: false,
      fallSpeed: BASE_FALL_SPEED,
      planesCleared: 0,
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.lastFallTime = 0;
    this.spawnPiece();
  }

  private createPiece(type: TetrominoType): Piece {
    const shape = TETROMINO_SHAPES[type];
    const blocks: Block[] = shape.map((pos) => ({
      position: { ...pos },
    }));

    return {
      type,
      blocks,
      position: { x: 1, y: GRID_HEIGHT - 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
    };
  }

  public spawnPiece(): void {
    if (!this.state.nextPiece) {
      this.state.nextPiece = this.createPiece(getRandomTetrominoType());
    }

    this.state.currentPiece = this.state.nextPiece;
    this.state.nextPiece = this.createPiece(getRandomTetrominoType());
    this.dropStartY = this.state.currentPiece.position.y;

    // Check if spawn position is blocked
    if (this.checkCollision(this.state.currentPiece, this.state.currentPiece.position)) {
      this.state.isGameOver = true;
    }
  }

  public update(deltaTime: number): void {
    if (this.state.isPaused || this.state.isGameOver || !this.state.currentPiece) {
      return;
    }

    this.lastFallTime += deltaTime;

    if (this.lastFallTime >= this.state.fallSpeed) {
      this.lastFallTime = 0;
      this.moveDown();
    }
  }

  private moveDown(): void {
    if (!this.state.currentPiece) return;

    const newPosition = {
      ...this.state.currentPiece.position,
      y: this.state.currentPiece.position.y - 1,
    };

    if (this.checkCollision(this.state.currentPiece, newPosition)) {
      this.placePiece();
    } else {
      this.state.currentPiece.position = newPosition;
    }
  }

  public movePiece(direction: 'left' | 'right' | 'forward' | 'backward'): boolean {
    if (!this.state.currentPiece) return false;

    const newPosition = { ...this.state.currentPiece.position };

    switch (direction) {
      case 'left':
        newPosition.x -= 1;
        break;
      case 'right':
        newPosition.x += 1;
        break;
      case 'forward':
        newPosition.z -= 1;
        break;
      case 'backward':
        newPosition.z += 1;
        break;
    }

    if (!this.checkCollision(this.state.currentPiece, newPosition)) {
      this.state.currentPiece.position = newPosition;
      return true;
    }

    return false;
  }

  public rotatePiece(axis: 'x' | 'y' | 'z', direction: 1 | -1): boolean {
    if (!this.state.currentPiece) return false;

    const rotatedPiece = this.getRotatedPiece(this.state.currentPiece, axis, direction);

    if (!this.checkCollision(rotatedPiece, rotatedPiece.position)) {
      this.state.currentPiece = rotatedPiece;
      return true;
    }

    return false;
  }

  private getRotatedPiece(piece: Piece, axis: 'x' | 'y' | 'z', direction: 1 | -1): Piece {
    const angle = (Math.PI / 2) * direction;
    const rotatedBlocks: Block[] = piece.blocks.map((block) => {
      let pos = { ...block.position };

      switch (axis) {
        case 'y': // Horizontal rotation (around Y axis)
          const newX = Math.round(pos.x * Math.cos(angle) - pos.z * Math.sin(angle));
          const newZ = Math.round(pos.x * Math.sin(angle) + pos.z * Math.cos(angle));
          pos = { x: newX, y: pos.y, z: newZ };
          break;
        case 'x': // Rotation around X axis
          const newY1 = Math.round(pos.y * Math.cos(angle) - pos.z * Math.sin(angle));
          const newZ1 = Math.round(pos.y * Math.sin(angle) + pos.z * Math.cos(angle));
          pos = { x: pos.x, y: newY1, z: newZ1 };
          break;
        case 'z': // Rotation around Z axis
          const newX2 = Math.round(pos.x * Math.cos(angle) - pos.y * Math.sin(angle));
          const newY2 = Math.round(pos.x * Math.sin(angle) + pos.y * Math.cos(angle));
          pos = { x: newX2, y: newY2, z: pos.z };
          break;
      }

      return { position: pos };
    });

    return {
      ...piece,
      blocks: rotatedBlocks,
    };
  }

  public hardDrop(): void {
    if (!this.state.currentPiece) return;

    let dropDistance = 0;
    while (!this.checkCollision(this.state.currentPiece, {
      ...this.state.currentPiece.position,
      y: this.state.currentPiece.position.y - 1,
    })) {
      this.state.currentPiece.position.y -= 1;
      dropDistance++;
    }

    this.placePiece();
  }

  private checkCollision(piece: Piece, position: Position): boolean {
    for (const block of piece.blocks) {
      const worldX = position.x + block.position.x;
      const worldY = position.y + block.position.y;
      const worldZ = position.z + block.position.z;

      // Check bounds
      if (
        worldX < 0 ||
        worldX >= GRID_WIDTH ||
        worldY < 0 ||
        worldY >= GRID_HEIGHT ||
        worldZ < 0 ||
        worldZ >= GRID_DEPTH
      ) {
        return true;
      }

      // Check collision with placed blocks
      if (this.state.grid[worldX][worldY][worldZ]) {
        return true;
      }
    }

    return false;
  }

  private placePiece(): void {
    if (!this.state.currentPiece) return;

    // Calculate drop score
    const dropHeight = this.dropStartY - this.state.currentPiece.position.y;
    const dropScore = dropHeight * DROP_POINTS_MULTIPLIER;

    // Add blocks to grid
    const newBlocks: Position[] = [];
    this.state.currentPiece.blocks.forEach((block) => {
      const worldX = this.state.currentPiece!.position.x + block.position.x;
      const worldY = this.state.currentPiece!.position.y + block.position.y;
      const worldZ = this.state.currentPiece!.position.z + block.position.z;

      this.state.grid[worldX][worldY][worldZ] = true;
      newBlocks.push({ x: worldX, y: worldY, z: worldZ });
    });

    this.state.placedBlocks.push(...newBlocks);

    // Check for complete planes
    const clearedPlanes = this.checkAndClearPlanes();

    // Store for flash effect
    this.recentlyClearedPlanes = clearedPlanes;

    // Calculate total score
    if (clearedPlanes.length > 0) {
      this.state.combo += 1;
      const comboMultiplier = this.state.combo;
      const planeBonus = Math.pow(clearedPlanes.length, 2) * PLANE_BONUS_MULTIPLIER;
      this.state.score += dropScore * comboMultiplier + planeBonus;

      // Update difficulty
      this.state.planesCleared += clearedPlanes.length;
      this.state.level = this.state.planesCleared + 1;
      this.state.fallSpeed = BASE_FALL_SPEED / Math.pow(DIFFICULTY_MULTIPLIER, this.state.planesCleared);
    } else {
      this.state.combo = 0;
      this.state.score += dropScore;
    }

    // Spawn next piece
    this.spawnPiece();
  }

  private checkAndClearPlanes(): number[] {
    const clearedPlanes: number[] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      let isComplete = true;

      for (let x = 0; x < GRID_WIDTH; x++) {
        for (let z = 0; z < GRID_DEPTH; z++) {
          if (!this.state.grid[x][y][z]) {
            isComplete = false;
            break;
          }
        }
        if (!isComplete) break;
      }

      if (isComplete) {
        clearedPlanes.push(y);
      }
    }

    // Clear the planes
    if (clearedPlanes.length > 0) {
      clearedPlanes.forEach((planeY) => {
        // Clear the plane
        for (let x = 0; x < GRID_WIDTH; x++) {
          for (let z = 0; z < GRID_DEPTH; z++) {
            this.state.grid[x][planeY][z] = null;
          }
        }

        // Drop blocks above
        for (let y = planeY + 1; y < GRID_HEIGHT; y++) {
          for (let x = 0; x < GRID_WIDTH; x++) {
            for (let z = 0; z < GRID_DEPTH; z++) {
              this.state.grid[x][y - 1][z] = this.state.grid[x][y][z];
              this.state.grid[x][y][z] = null;
            }
          }
        }
      });

      // Update placed blocks list
      this.state.placedBlocks = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
          for (let z = 0; z < GRID_DEPTH; z++) {
            if (this.state.grid[x][y][z]) {
              this.state.placedBlocks.push({ x, y, z });
            }
          }
        }
      }
    }

    return clearedPlanes;
  }

  public getClearedPlanes(): number[] {
    const planes = this.recentlyClearedPlanes;
    this.recentlyClearedPlanes = [];
    return planes;
  }

  public togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
  }

  public setPause(paused: boolean): void {
    this.state.isPaused = paused;
  }
}
