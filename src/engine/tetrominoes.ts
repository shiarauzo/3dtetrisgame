import { TetrominoType, Position } from '../types';

// Define tetromino shapes as relative positions
// All pieces are 2D (flat) but positioned in 3D space
export const TETROMINO_SHAPES: Record<TetrominoType, Position[]> = {
  [TetrominoType.I]: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  ],
  [TetrominoType.O]: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
  ],
  [TetrominoType.T]: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
  ],
  [TetrominoType.S]: [
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
  ],
  [TetrominoType.Z]: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
  ],
  [TetrominoType.J]: [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
  ],
  [TetrominoType.L]: [
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
  ],
};

export function getRandomTetrominoType(): TetrominoType {
  const types = Object.values(TetrominoType);
  return types[Math.floor(Math.random() * types.length)];
}
