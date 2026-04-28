export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Block {
  position: Position;
}

export interface Piece {
  type: TetrominoType;
  blocks: Block[];
  position: Position;
  rotation: Rotation;
}

export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

export interface GameState {
  grid: (boolean | null)[][][]; // 5x5x15
  score: number;
  level: number;
  combo: number;
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  placedBlocks: Position[];
  isPaused: boolean;
  isGameOver: boolean;
  fallSpeed: number;
  planesCleared: number;
}

export interface RankingEntry {
  id: string;
  nickname: string;
  score: number;
  created_at: string;
}

export type RankingFilter = 'global' | 'daily' | 'weekly';
