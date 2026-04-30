// Grid dimensions
export const GRID_WIDTH = 5;
export const GRID_DEPTH = 5;
export const GRID_HEIGHT = 15;

// Colors
export const BG_COLOR = 0xF5F0E6; // Cream
export const BLOCK_COLOR = 0x1a1a1a; // Near black
export const EDGE_COLOR = 0xF5F0E6; // Cream (matching background)
export const GRID_LINE_COLOR = 0xCCC5B8; // Subtle gray
export const FLASH_COLOR = 0xFFFFFF; // White

// Game settings
export const BASE_FALL_SPEED = 1000; // ms
export const DIFFICULTY_MULTIPLIER = 1.1;
export const DROP_POINTS_MULTIPLIER = 10;
export const PLANE_BONUS_MULTIPLIER = 100;

// Camera settings
export const CAMERA_DISTANCE = 20;
export const CAMERA_FOV = 75;

// Pause settings
export const MAX_PAUSE_TIME = 120000; // 2 minutes in ms

// Gesture control settings
export const GESTURE_CONFIG = {
  MOVE_COOLDOWN: 200,        // 200ms between movements
  FRAMES_TO_CONFIRM: 3,      // 3 consecutive frames to confirm
  MIN_CONFIDENCE: 0.7,       // 70% minimum hand detection confidence
  DETECTION_FPS: 15,         // Detection rate
  PREVIEW_WIDTH: 160,        // Webcam preview width
  PREVIEW_HEIGHT: 120,       // Webcam preview height
  HORIZONTAL_ZONES: 5,       // Number of horizontal zones (matches GRID_WIDTH)
  VERTICAL_ZONES: 5,         // Number of vertical zones (matches GRID_DEPTH)
  GRAB_THRESHOLD: 0.12,      // Distance threshold for closed fist detection
  CAMERA_ROTATION_SENSITIVITY: 150, // Sensitivity for camera rotation with right hand
};
