import { GameEngine } from './engine/GameEngine';
import { ThreeRenderer } from './renderer/ThreeRenderer';
import { InputHandler } from './input/InputHandler';
import { GestureController } from './input/GestureController';
import { UIManager } from './ui/UIManager';
import { APIClient } from './api/client';
import { RankingFilter } from './types';

class Game {
  private engine: GameEngine;
  private renderer: ThreeRenderer;
  private inputHandler: InputHandler;
  private gestureController: GestureController;
  private uiManager: UIManager;
  private apiClient: APIClient;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private canvas: HTMLCanvasElement;

  constructor() {
    // Get canvas elements
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const nextPieceCanvas = document.getElementById('next-piece-canvas') as HTMLCanvasElement;
    const axisGizmoCanvas = document.getElementById('axis-gizmo') as HTMLCanvasElement;

    // Set canvas to fullscreen
    this.resizeCanvas();

    // Initialize systems
    this.engine = new GameEngine();
    this.renderer = new ThreeRenderer(this.canvas, nextPieceCanvas, axisGizmoCanvas);
    this.inputHandler = new InputHandler(this.engine, this.renderer, this.canvas);
    this.gestureController = new GestureController(this.engine, this.renderer);
    this.uiManager = new UIManager();
    this.apiClient = new APIClient();

    // Setup UI callbacks
    this.setupUICallbacks();

    // Setup input callbacks
    this.inputHandler.onPause(() => this.handlePause());
    this.inputHandler.onGestureToggle(() => this.handleGestureToggle());

    // Setup gesture button
    this.setupGestureButton();

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());

    // Start game immediately
    this.startGame();
  }

  private setupUICallbacks(): void {
    this.uiManager.onContinue(() => this.resumeGame());
    this.uiManager.onExit(() => this.restartGame());
    this.uiManager.onPlayAgain(() => this.startGame());
    this.uiManager.onSubmitScore((nickname) => this.submitScore(nickname));
    this.uiManager.onViewRanking((filter) => this.viewRanking(filter));
    this.uiManager.onBackToMenu(() => this.startGame());
    this.uiManager.onHelpToggle((isOpen) => this.engine.setPause(isOpen));
  }

  private startGame(): void {
    this.engine.reset();
    this.uiManager.showGame();
    this.startGameLoop();
  }

  private restartGame(): void {
    this.engine.setPause(false);
    this.uiManager.hidePause();
    this.startGame();
  }

  private handlePause(): void {
    const state = this.engine.getState();
    if (state.isGameOver) return;

    if (state.isPaused) {
      this.resumeGame();
    } else {
      this.engine.togglePause();
      this.uiManager.showPause();
    }
  }

  private resumeGame(): void {
    this.engine.setPause(false);
    this.uiManager.hidePause();
  }

  private async submitScore(nickname: string): Promise<void> {
    const state = this.engine.getState();
    await this.apiClient.submitScore(nickname, state.score);

    // Calculate rank position
    const rankings = await this.apiClient.getRankings('global');
    const position = rankings.findIndex((r) => r.score === state.score && r.nickname === nickname) + 1;
    this.uiManager.showRankPosition(position || rankings.length + 1);
  }

  private async viewRanking(filter: RankingFilter): Promise<void> {
    this.uiManager.showRanking();
    const rankings = await this.apiClient.getRankings(filter);
    this.uiManager.updateFullRanking(rankings);
  }

  private startGameLoop(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private stopGameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop(currentTime: number): void {
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const state = this.engine.getState();

    // Update game state
    this.engine.update(deltaTime);

    // Check for cleared planes and show flash effect
    const clearedPlanes = this.engine.getClearedPlanes();
    clearedPlanes.forEach((planeY) => {
      this.renderer.showFlashEffect(planeY);
    });

    // Update UI
    this.uiManager.updateGameStats(state);

    // Render with smooth falling
    const visualYOffset = this.engine.getVisualYOffset();
    const dropY = this.engine.getDropY();
    this.renderer.renderPlacedBlocks(state.placedBlocks);
    this.renderer.renderGhostPiece(state.currentPiece, dropY);
    this.renderer.renderCurrentPiece(state.currentPiece, visualYOffset);
    this.renderer.renderNextPiece(state.nextPiece);
    this.renderer.render();

    // Check for game over
    if (state.isGameOver) {
      this.stopGameLoop();
      this.uiManager.showGameOver(state.score);
    }
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private handleResize(): void {
    this.resizeCanvas();
    this.renderer.handleResize(this.canvas.width, this.canvas.height);
  }

  private async handleGestureToggle(): Promise<void> {
    const state = this.engine.getState();
    if (state.isGameOver || state.isPaused) return;

    const isActive = await this.gestureController.toggle();
    this.updateGestureButton(isActive);
  }

  private setupGestureButton(): void {
    const gestureButton = document.getElementById('gesture-button');
    if (gestureButton) {
      gestureButton.addEventListener('click', () => this.handleGestureToggle());
    }

    // Update button when gesture state changes externally
    this.gestureController.onToggle((isActive) => {
      this.updateGestureButton(isActive);
    });
  }

  private updateGestureButton(isActive: boolean): void {
    const gestureButton = document.getElementById('gesture-button');
    if (gestureButton) {
      gestureButton.classList.toggle('active', isActive);
      gestureButton.setAttribute('aria-pressed', String(isActive));
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
