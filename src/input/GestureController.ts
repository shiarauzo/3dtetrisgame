import { HandTracker } from './HandTracker';
import { GestureInterpreter } from './GestureInterpreter';
import { GestureOverlay } from '../ui/GestureOverlay';
import { GameEngine } from '../engine/GameEngine';
import { ThreeRenderer } from '../renderer/ThreeRenderer';

export class GestureController {
  private handTracker: HandTracker;
  private interpreter: GestureInterpreter;
  private overlay: GestureOverlay;
  private engine: GameEngine;
  private renderer: ThreeRenderer;
  private isActive = false;
  private isInitialized = false;
  private onToggleCallback: ((isActive: boolean) => void) | null = null;

  constructor(engine: GameEngine, renderer: ThreeRenderer) {
    this.engine = engine;
    this.renderer = renderer;
    this.handTracker = new HandTracker();
    this.interpreter = new GestureInterpreter();
    this.overlay = new GestureOverlay();

    // Connect interpreter commands to engine (left hand -> piece movement)
    this.interpreter.onCommand((command) => {
      if (command.type === 'move') {
        this.engine.movePiece(command.direction);
      }
    });

    // Connect camera rotation (right hand -> camera)
    this.interpreter.onCameraRotate((command) => {
      if (command.type === 'rotate_camera') {
        this.renderer.rotateCamera(command.deltaX, 0);
      }
    });

    // Handle dual hand input from tracker
    this.handTracker.onHands((dualHandState) => {
      // Process left hand for piece movement
      const leftResult = this.interpreter.processLeftHand(dualHandState.leftHand);

      // Process right hand for camera rotation
      const rightResult = this.interpreter.processRightHand(dualHandState.rightHand);

      // Update overlay with both hands
      this.overlay.update(dualHandState, leftResult, rightResult);
    });
  }

  async toggle(): Promise<boolean> {
    if (this.isActive) {
      this.deactivate();
      return false;
    } else {
      const success = await this.activate();
      return success;
    }
  }

  private async activate(): Promise<boolean> {
    if (!this.isInitialized) {
      const success = await this.handTracker.initialize();
      if (!success) {
        console.error('Failed to initialize hand tracking');
        return false;
      }
      this.isInitialized = true;

      // Set up video element for overlay
      const video = this.handTracker.getVideoElement();
      if (video) {
        this.overlay.setVideoElement(video);
      }
    }

    this.handTracker.start();
    this.overlay.show();
    this.interpreter.reset();
    this.isActive = true;
    this.onToggleCallback?.(true);
    return true;
  }

  private deactivate(): void {
    this.handTracker.stop();
    this.overlay.hide();
    this.isActive = false;
    this.onToggleCallback?.(false);
  }

  isGestureActive(): boolean {
    return this.isActive;
  }

  onToggle(callback: (isActive: boolean) => void): void {
    this.onToggleCallback = callback;
  }

  destroy(): void {
    this.handTracker.destroy();
    this.overlay.destroy();
  }
}
