import { GESTURE_CONFIG } from '../constants';
import { DualHandState, HandLandmark } from '../types';

interface LeftHandResult {
  handDetected: boolean;
  zoneX: number;
  zoneZ: number;
  isGrabbing: boolean;
}

interface RightHandResult {
  handDetected: boolean;
  palmX: number;
}

export class GestureOverlay {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement | null = null;
  private isVisible = false;

  // Cached state
  private leftHandDetected = false;
  private rightHandDetected = false;
  private currentZoneX = 2;
  private currentZoneZ = 2;
  private leftHandGrabbing = false;
  // Right hand palm X position (reserved for future use)
  private leftHandLandmarks: HandLandmark[] | null = null;
  private rightHandLandmarks: HandLandmark[] | null = null;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'gesture-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 4.5rem;
      right: 1.5rem;
      width: ${GESTURE_CONFIG.PREVIEW_WIDTH}px;
      height: ${GESTURE_CONFIG.PREVIEW_HEIGHT}px;
      background: rgba(26, 26, 26, 0.9);
      z-index: 100;
      display: none;
      border-radius: 4px;
      overflow: hidden;
    `;

    // Create canvas for overlay
    this.canvas = document.createElement('canvas');
    this.canvas.width = GESTURE_CONFIG.PREVIEW_WIDTH;
    this.canvas.height = GESTURE_CONFIG.PREVIEW_HEIGHT;
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;

    this.container.appendChild(this.canvas);
    document.body.appendChild(this.container);

    this.ctx = this.canvas.getContext('2d')!;
  }

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  show(): void {
    this.isVisible = true;
    this.container.style.display = 'block';
    this.render();
  }

  hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  update(
    dualHandState: DualHandState,
    leftResult: LeftHandResult,
    rightResult: RightHandResult
  ): void {
    this.leftHandDetected = leftResult.handDetected;
    this.rightHandDetected = rightResult.handDetected;
    this.currentZoneX = leftResult.zoneX;
    this.currentZoneZ = leftResult.zoneZ;
    this.leftHandGrabbing = leftResult.isGrabbing;
    // rightResult.palmX available for future visual feedback
    this.leftHandLandmarks = dualHandState.leftHand?.landmarks ?? null;
    this.rightHandLandmarks = dualHandState.rightHand?.landmarks ?? null;

    if (this.isVisible) {
      this.render();
    }
  }

  private render(): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw video (mirrored)
    if (this.videoElement && this.videoElement.readyState >= 2) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(this.videoElement, -width, 0, width, height);
      ctx.restore();
    }

    // Draw zone grid
    ctx.strokeStyle = 'rgba(245, 240, 230, 0.3)';
    ctx.lineWidth = 1;

    // Vertical lines
    const zoneWidth = width / GESTURE_CONFIG.HORIZONTAL_ZONES;
    for (let i = 1; i < GESTURE_CONFIG.HORIZONTAL_ZONES; i++) {
      ctx.beginPath();
      ctx.moveTo(i * zoneWidth, 0);
      ctx.lineTo(i * zoneWidth, height);
      ctx.stroke();
    }

    // Horizontal lines
    const zoneHeight = height / GESTURE_CONFIG.VERTICAL_ZONES;
    for (let i = 1; i < GESTURE_CONFIG.VERTICAL_ZONES; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * zoneHeight);
      ctx.lineTo(width, i * zoneHeight);
      ctx.stroke();
    }

    // Highlight current zone (for left hand)
    if (this.leftHandDetected) {
      ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'; // Blue for left hand
      ctx.fillRect(
        this.currentZoneX * zoneWidth,
        this.currentZoneZ * zoneHeight,
        zoneWidth,
        zoneHeight
      );
    }

    // Draw left hand landmarks (blue theme - piece control)
    if (this.leftHandLandmarks && this.leftHandDetected) {
      this.drawHandLandmarks(this.leftHandLandmarks, '#6496ff', this.leftHandGrabbing);
    }

    // Draw right hand landmarks (purple theme - camera control)
    if (this.rightHandLandmarks && this.rightHandDetected) {
      this.drawHandLandmarks(this.rightHandLandmarks, '#a855f7', false);
    }

    // Draw status indicators (top right corner)
    this.drawStatusIndicators();

    // Draw grab indicator for left hand (bottom left)
    if (this.leftHandDetected) {
      this.drawGrabIndicator();
    }
  }

  private drawHandLandmarks(landmarks: HandLandmark[], color: string, isGrabbing: boolean): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;

    // Draw palm center (landmark 9)
    const palmCenter = landmarks[9];
    const screenX = (1 - palmCenter.x) * width; // Mirrored
    const screenY = palmCenter.y * height;

    // Palm center - larger with grab state indicator
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
    ctx.fillStyle = isGrabbing ? 'rgba(255, 165, 0, 0.9)' : color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw other landmarks as smaller dots
    ctx.fillStyle = color + '99'; // Add transparency
    for (let i = 0; i < landmarks.length; i++) {
      if (i === 9) continue; // Skip palm center
      const lm = landmarks[i];
      const x = (1 - lm.x) * width;
      const y = lm.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connect landmarks for hand skeleton
    ctx.strokeStyle = color + '66'; // More transparent
    ctx.lineWidth = 1;

    // Define finger connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],     // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],     // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17], // Palm connections
    ];

    for (const [start, end] of connections) {
      const startLm = landmarks[start];
      const endLm = landmarks[end];
      ctx.beginPath();
      ctx.moveTo((1 - startLm.x) * width, startLm.y * height);
      ctx.lineTo((1 - endLm.x) * width, endLm.y * height);
      ctx.stroke();
    }
  }

  private drawStatusIndicators(): void {
    const { ctx, canvas } = this;
    const width = canvas.width;

    // Left hand indicator (top right, first)
    ctx.beginPath();
    ctx.arc(width - 28, 12, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.leftHandDetected ? '#6496ff' : '#4a4a4a';
    ctx.fill();

    // Right hand indicator (top right, second)
    ctx.beginPath();
    ctx.arc(width - 12, 12, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.rightHandDetected ? '#a855f7' : '#4a4a4a';
    ctx.fill();

    // Labels
    ctx.font = '8px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('L', width - 28, 24);
    ctx.fillText('R', width - 12, 24);
  }

  private drawGrabIndicator(): void {
    const { ctx } = this;

    // Draw grab status indicator (bottom left)
    const indicatorX = 16;
    const indicatorY = this.canvas.height - 16;
    const radius = 10;

    // Outer ring
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner fill based on grab state
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.leftHandGrabbing ? '#ffa500' : '#4ade80'; // Orange if grabbing, green if open
    ctx.fill();

    // Icon (fist or open hand)
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.leftHandGrabbing ? '✊' : '✋', indicatorX, indicatorY);
  }

  destroy(): void {
    this.container.remove();
  }
}
