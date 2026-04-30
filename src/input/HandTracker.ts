import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandLandmark, HandData, DualHandState, Handedness } from '../types';
import { GESTURE_CONFIG } from '../constants';

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isRunning = false;
  private lastDetectionTime = 0;
  private onHandsCallback: ((hands: DualHandState) => void) | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Create video element for webcam
      this.videoElement = document.createElement('video');
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.setAttribute('autoplay', '');
      this.videoElement.style.display = 'none';
      document.body.appendChild(this.videoElement);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      // Initialize MediaPipe HandLandmarker
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2, // Detect both hands
        minHandDetectionConfidence: GESTURE_CONFIG.MIN_CONFIDENCE,
        minHandPresenceConfidence: GESTURE_CONFIG.MIN_CONFIDENCE,
        minTrackingConfidence: GESTURE_CONFIG.MIN_CONFIDENCE,
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize hand tracking:', error);
      return false;
    }
  }

  start(): void {
    if (!this.handLandmarker || !this.videoElement) return;
    this.isRunning = true;
    this.detectLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  destroy(): void {
    this.stop();

    if (this.videoElement) {
      const stream = this.videoElement.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      this.videoElement.remove();
      this.videoElement = null;
    }

    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }

  private isGrabbing(landmarks: HandLandmark[]): boolean {
    // Landmarks: 4=thumb tip, 8=index tip, 12=middle tip, 16=ring tip, 20=pinky tip
    // Landmark 9 = MIDDLE_FINGER_MCP (palm center)
    const palm = landmarks[9];
    const fingerTipIndices = [4, 8, 12, 16, 20];

    const avgDistance = fingerTipIndices.reduce((sum, idx) => {
      const tip = landmarks[idx];
      return sum + Math.hypot(tip.x - palm.x, tip.y - palm.y);
    }, 0) / fingerTipIndices.length;

    return avgDistance < GESTURE_CONFIG.GRAB_THRESHOLD;
  }

  private detectLoop(): void {
    if (!this.isRunning || !this.handLandmarker || !this.videoElement) return;

    const now = performance.now();
    const frameInterval = 1000 / GESTURE_CONFIG.DETECTION_FPS;

    if (now - this.lastDetectionTime >= frameInterval) {
      this.lastDetectionTime = now;

      if (this.videoElement.readyState >= 2) {
        const results: HandLandmarkerResult = this.handLandmarker.detectForVideo(
          this.videoElement,
          now
        );

        const dualHandState: DualHandState = {
          leftHand: null,
          rightHand: null,
        };

        if (results.landmarks && results.handedness) {
          for (let i = 0; i < results.landmarks.length; i++) {
            const landmarks = results.landmarks[i].map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
            }));

            // MediaPipe handedness: "Left" or "Right" (from camera's perspective)
            // In selfie/mirrored view, this is flipped
            const handednessCategory = results.handedness[i][0].categoryName as Handedness;
            const isGrabbing = this.isGrabbing(landmarks);

            const handData: HandData = {
              landmarks,
              handedness: handednessCategory,
              isGrabbing,
            };

            // Note: MediaPipe labels from camera perspective, not mirrored
            // So "Left" from camera = user's right hand in selfie view
            // We flip it here to match user's perspective
            if (handednessCategory === 'Left') {
              dualHandState.rightHand = handData;
            } else {
              dualHandState.leftHand = handData;
            }
          }
        }

        this.onHandsCallback?.(dualHandState);
      }
    }

    requestAnimationFrame(() => this.detectLoop());
  }

  onHands(callback: (hands: DualHandState) => void): void {
    this.onHandsCallback = callback;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }
}
