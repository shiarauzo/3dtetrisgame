import { GestureCommand, CameraRotationCommand, HandData } from '../types';
import { GESTURE_CONFIG, GRID_WIDTH, GRID_DEPTH } from '../constants';

export class GestureInterpreter {
  // Left hand state (piece movement)
  private currentZoneX: number = Math.floor(GESTURE_CONFIG.HORIZONTAL_ZONES / 2);
  private currentZoneZ: number = Math.floor(GESTURE_CONFIG.VERTICAL_ZONES / 2);
  private lastMoveTime: number = 0;
  private confirmBuffer: { zoneX: number; zoneZ: number }[] = [];

  // Right hand state (camera rotation)
  private lastRightHandX: number | null = null;

  // Callbacks
  private onCommandCallback: ((command: GestureCommand) => void) | null = null;
  private onCameraRotateCallback: ((command: CameraRotationCommand) => void) | null = null;

  processLeftHand(handData: HandData | null): { handDetected: boolean; zoneX: number; zoneZ: number; isGrabbing: boolean } {
    if (!handData) {
      this.confirmBuffer = [];
      return {
        handDetected: false,
        zoneX: this.currentZoneX,
        zoneZ: this.currentZoneZ,
        isGrabbing: false,
      };
    }

    const landmarks = handData.landmarks;

    // Use landmark 9 (MIDDLE_FINGER_MCP) - center of palm, most stable
    const palmCenter = landmarks[9];

    // Calculate zone from palm position (x is mirrored for selfie view)
    const zoneX = Math.floor((1 - palmCenter.x) * GESTURE_CONFIG.HORIZONTAL_ZONES);
    const zoneZ = Math.floor(palmCenter.y * GESTURE_CONFIG.VERTICAL_ZONES);

    // Clamp to valid range
    const clampedZoneX = Math.max(0, Math.min(GRID_WIDTH - 1, zoneX));
    const clampedZoneZ = Math.max(0, Math.min(GRID_DEPTH - 1, zoneZ));

    // Add to confirmation buffer
    this.confirmBuffer.push({ zoneX: clampedZoneX, zoneZ: clampedZoneZ });

    // Keep only recent frames
    if (this.confirmBuffer.length > GESTURE_CONFIG.FRAMES_TO_CONFIRM) {
      this.confirmBuffer.shift();
    }

    // Check if we have consistent readings
    if (this.confirmBuffer.length >= GESTURE_CONFIG.FRAMES_TO_CONFIRM) {
      const allSameX = this.confirmBuffer.every(z => z.zoneX === clampedZoneX);
      const allSameZ = this.confirmBuffer.every(z => z.zoneZ === clampedZoneZ);

      if (allSameX && allSameZ) {
        this.tryMove(clampedZoneX, clampedZoneZ);
      }
    }

    return {
      handDetected: true,
      zoneX: clampedZoneX,
      zoneZ: clampedZoneZ,
      isGrabbing: handData.isGrabbing,
    };
  }

  processRightHand(handData: HandData | null): { handDetected: boolean; palmX: number } {
    if (!handData) {
      this.lastRightHandX = null;
      return { handDetected: false, palmX: 0.5 };
    }

    const landmarks = handData.landmarks;
    const palmCenter = landmarks[9];

    // Mirrored x position for selfie view
    const currentX = 1 - palmCenter.x;

    // Calculate horizontal movement delta
    if (this.lastRightHandX !== null) {
      const deltaX = currentX - this.lastRightHandX;

      // Only trigger rotation if movement is significant
      if (Math.abs(deltaX) > 0.01) {
        const rotationDelta = deltaX * GESTURE_CONFIG.CAMERA_ROTATION_SENSITIVITY;
        this.onCameraRotateCallback?.({
          type: 'rotate_camera',
          deltaX: rotationDelta,
        });
      }
    }

    this.lastRightHandX = currentX;

    return {
      handDetected: true,
      palmX: currentX,
    };
  }

  private tryMove(newZoneX: number, newZoneZ: number): void {
    const now = performance.now();

    // Check cooldown
    if (now - this.lastMoveTime < GESTURE_CONFIG.MOVE_COOLDOWN) {
      return;
    }

    // Determine horizontal movement
    if (newZoneX !== this.currentZoneX) {
      const direction = newZoneX > this.currentZoneX ? 'right' : 'left';
      this.onCommandCallback?.({ type: 'move', direction });
      this.currentZoneX = newZoneX;
      this.lastMoveTime = now;
    }

    // Determine vertical movement (forward/backward)
    if (newZoneZ !== this.currentZoneZ) {
      const direction = newZoneZ > this.currentZoneZ ? 'backward' : 'forward';
      this.onCommandCallback?.({ type: 'move', direction });
      this.currentZoneZ = newZoneZ;
      this.lastMoveTime = now;
    }
  }

  onCommand(callback: (command: GestureCommand) => void): void {
    this.onCommandCallback = callback;
  }

  onCameraRotate(callback: (command: CameraRotationCommand) => void): void {
    this.onCameraRotateCallback = callback;
  }

  reset(): void {
    this.currentZoneX = Math.floor(GESTURE_CONFIG.HORIZONTAL_ZONES / 2);
    this.currentZoneZ = Math.floor(GESTURE_CONFIG.VERTICAL_ZONES / 2);
    this.confirmBuffer = [];
    this.lastRightHandX = null;
  }
}
