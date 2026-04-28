import { GameEngine } from '../engine/GameEngine';
import { ThreeRenderer } from '../renderer/ThreeRenderer';

export class InputHandler {
  private engine: GameEngine;
  private renderer: ThreeRenderer;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private onPauseCallback: (() => void) | null = null;

  constructor(
    engine: GameEngine,
    renderer: ThreeRenderer,
    canvas: HTMLCanvasElement
  ) {
    this.engine = engine;
    this.renderer = renderer;

    this.setupKeyboardListeners();
    this.setupMouseListeners(canvas);
  }

  private setupKeyboardListeners(): void {
    document.addEventListener('keydown', (e) => {
      const state = this.engine.getState();
      if (state.isGameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.engine.movePiece('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.engine.movePiece('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.engine.movePiece('forward');
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.engine.movePiece('backward');
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          this.engine.rotatePiece('y', -1);
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          this.engine.rotatePiece('y', 1);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          this.engine.rotatePiece('x', -1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this.engine.rotatePiece('x', 1);
          break;
        case ' ':
          e.preventDefault();
          this.engine.hardDrop();
          break;
        case 'x':
        case 'X':
          e.preventDefault();
          this.renderer.snapCameraToAxis('x');
          break;
        case 'y':
        case 'Y':
          e.preventDefault();
          this.renderer.snapCameraToAxis('y');
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          this.renderer.snapCameraToAxis('z');
          break;
        case 'Escape':
          e.preventDefault();
          if (this.onPauseCallback) {
            this.onPauseCallback();
          }
          break;
      }
    });
  }

  private setupMouseListeners(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      this.renderer.rotateCamera(deltaX, deltaY);

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    // Zoom with mouse wheel
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? 1 : -1;
      this.renderer.zoom(zoomDelta);
    }, { passive: false });
  }

  public onPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }
}
