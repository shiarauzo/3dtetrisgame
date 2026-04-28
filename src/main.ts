import { GameEngine } from './engine/GameEngine';
import { ThreeRenderer } from './renderer/ThreeRenderer';
import { InputHandler } from './input/InputHandler';
import { UIManager } from './ui/UIManager';
import { APIClient } from './api/client';
import { RankingFilter } from './types';

class Game {
  private engine: GameEngine;
  private renderer: ThreeRenderer;
  private inputHandler: InputHandler;
  private uiManager: UIManager;
  private apiClient: APIClient;
  private animationFrameId: number | null = null;
  private lastTime = 0;

  constructor() {
    // Get canvas elements
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const nextPieceCanvas = document.getElementById('next-piece-canvas') as HTMLCanvasElement;

    // Set canvas sizes
    canvas.width = 800;
    canvas.height = 600;
    nextPieceCanvas.width = 150;
    nextPieceCanvas.height = 150;

    // Initialize systems
    this.engine = new GameEngine();
    this.renderer = new ThreeRenderer(canvas, nextPieceCanvas);
    this.inputHandler = new InputHandler(this.engine, this.renderer, canvas);
    this.uiManager = new UIManager();
    this.apiClient = new APIClient();

    // Setup UI callbacks
    this.setupUICallbacks();

    // Setup input callbacks
    this.inputHandler.onPause(() => this.handlePause());

    // Show landing page and load top rankings
    this.showLanding();

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private setupUICallbacks(): void {
    this.uiManager.onPlayClick(() => this.startGame());
    this.uiManager.onContinue(() => this.resumeGame());
    this.uiManager.onExit(() => this.exitToMenu());
    this.uiManager.onPlayAgain(() => this.startGame());
    this.uiManager.onSubmitScore((nickname) => this.submitScore(nickname));
    this.uiManager.onViewRanking((filter) => this.viewRanking(filter));
    this.uiManager.onBackToMenu(() => this.showLanding());
  }

  private async showLanding(): Promise<void> {
    this.uiManager.showLanding();
    this.stopGameLoop();

    // Load top rankings
    const topRankings = await this.apiClient.getTopRankings(5);
    this.uiManager.updateRankingPreview(topRankings);
  }

  private startGame(): void {
    this.engine.reset();
    this.uiManager.showGame();
    this.startGameLoop();

    // Load top rankings for sidebar
    this.apiClient.getTopRankings(5).then((rankings) => {
      this.uiManager.updateRankingPreview(rankings);
    });
  }

  private handlePause(): void {
    const state = this.engine.getState();
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

  private exitToMenu(): void {
    this.engine.setPause(false);
    this.showLanding();
  }

  private async submitScore(nickname: string): Promise<void> {
    const state = this.engine.getState();
    await this.apiClient.submitScore(nickname, state.score);

    // Calculate rank position
    const rankings = await this.apiClient.getRankings('global');
    const position = rankings.findIndex((r) => r.score === state.score && r.nickname === nickname) + 1;
    this.uiManager.showRankPosition(position);
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

    // Update UI
    this.uiManager.updateGameStats(state);

    // Render
    this.renderer.renderPlacedBlocks(state.placedBlocks);
    this.renderer.renderCurrentPiece(state.currentPiece);
    this.renderer.renderNextPiece(state.nextPiece);
    this.renderer.render();

    // Check for game over
    if (state.isGameOver) {
      this.stopGameLoop();
      this.uiManager.showGameOver(state.score);
    }
  }

  private handleResize(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const container = document.getElementById('game-canvas-container');
    if (container) {
      const width = Math.min(800, container.clientWidth - 40);
      const height = Math.min(600, container.clientHeight - 40);
      canvas.width = width;
      canvas.height = height;
      this.renderer.handleResize(width, height);
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
