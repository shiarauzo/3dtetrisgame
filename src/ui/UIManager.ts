import { GameState, RankingEntry, RankingFilter } from '../types';
import { MAX_PAUSE_TIME } from '../constants';

export class UIManager {
  private elements = {
    gameView: document.getElementById('game-view')!,
    helpPanel: document.getElementById('help-panel')!,
    pauseOverlay: document.getElementById('pause-overlay')!,
    gameOver: document.getElementById('game-over')!,
    rankingView: document.getElementById('ranking-view')!,
    helpButton: document.getElementById('help-button')!,
    closeHelp: document.getElementById('close-help')!,
    continueButton: document.getElementById('continue-button')!,
    exitButton: document.getElementById('exit-button')!,
    submitScore: document.getElementById('submit-score')!,
    playAgain: document.getElementById('play-again')!,
    viewRanking: document.getElementById('view-ranking')!,
    backButton: document.getElementById('back-button')!,
    score: document.getElementById('score')!,
    level: document.getElementById('level')!,
    combo: document.getElementById('combo')!,
    finalScore: document.getElementById('final-score')!,
    rankPosition: document.getElementById('rank-position')!,
    nicknameInput: document.getElementById('nickname-input') as HTMLInputElement,
    pauseTimer: document.getElementById('pause-timer')!,
    rankingList: document.getElementById('ranking-list')!,
  };

  private callbacks = {
    onContinue: null as (() => void) | null,
    onExit: null as (() => void) | null,
    onSubmitScore: null as ((nickname: string) => void) | null,
    onPlayAgain: null as (() => void) | null,
    onViewRanking: null as ((filter: RankingFilter) => void) | null,
    onBackToMenu: null as (() => void) | null,
  };

  private pauseStartTime = 0;
  private pauseTimerInterval: number | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.elements.helpButton.addEventListener('click', () => {
      this.toggleHelp();
    });

    this.elements.closeHelp.addEventListener('click', () => {
      this.toggleHelp();
    });

    this.elements.continueButton.addEventListener('click', () => {
      if (this.callbacks.onContinue) this.callbacks.onContinue();
    });

    this.elements.exitButton.addEventListener('click', () => {
      if (this.callbacks.onExit) this.callbacks.onExit();
    });

    this.elements.submitScore.addEventListener('click', () => {
      const nickname = this.elements.nicknameInput.value.trim();
      if (nickname && this.callbacks.onSubmitScore) {
        this.callbacks.onSubmitScore(nickname);
      }
    });

    this.elements.playAgain.addEventListener('click', () => {
      if (this.callbacks.onPlayAgain) this.callbacks.onPlayAgain();
    });

    this.elements.viewRanking.addEventListener('click', () => {
      if (this.callbacks.onViewRanking) this.callbacks.onViewRanking('global');
    });

    this.elements.backButton.addEventListener('click', () => {
      if (this.callbacks.onBackToMenu) this.callbacks.onBackToMenu();
    });

    // Ranking filter tabs
    document.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const filter = (e.target as HTMLElement).getAttribute('data-filter') as RankingFilter;
        document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
        if (this.callbacks.onViewRanking) this.callbacks.onViewRanking(filter);
      });
    });

    // Enter key submits score
    this.elements.nicknameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const nickname = this.elements.nicknameInput.value.trim();
        if (nickname && this.callbacks.onSubmitScore) {
          this.callbacks.onSubmitScore(nickname);
        }
      }
    });
  }

  public showGame(): void {
    this.hideAll();
    this.elements.gameView.classList.remove('hidden');
  }

  public showPause(): void {
    this.elements.pauseOverlay.classList.remove('hidden');
    this.pauseStartTime = Date.now();
    this.startPauseTimer();
  }

  public hidePause(): void {
    this.elements.pauseOverlay.classList.add('hidden');
    this.stopPauseTimer();
  }

  public showGameOver(score: number): void {
    this.elements.gameOver.classList.remove('hidden');
    this.elements.finalScore.textContent = score.toLocaleString();
    this.elements.rankPosition.textContent = '';
    this.elements.nicknameInput.value = '';
    this.elements.nicknameInput.focus();
  }

  public showRanking(): void {
    this.hideAll();
    this.elements.rankingView.classList.remove('hidden');
  }

  private toggleHelp(): void {
    this.elements.helpPanel.classList.toggle('hidden');
  }

  private hideAll(): void {
    this.elements.gameOver.classList.add('hidden');
    this.elements.rankingView.classList.add('hidden');
    this.elements.helpPanel.classList.add('hidden');
    this.hidePause();
  }

  public updateGameStats(state: GameState): void {
    this.elements.score.textContent = state.score.toLocaleString();
    this.elements.level.textContent = state.level.toString();
    this.elements.combo.textContent = state.combo.toString();
  }

  public updateFullRanking(rankings: RankingEntry[]): void {
    this.renderRankingList(rankings, this.elements.rankingList);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private renderRankingList(rankings: RankingEntry[], container: HTMLElement): void {
    if (rankings.length === 0) {
      container.innerHTML = '<div class="ranking-entry"><span>No scores yet</span><span>—</span></div>';
      return;
    }
    container.innerHTML = rankings
      .map(
        (entry, index) => `
      <div class="ranking-entry">
        <span>${index + 1}. ${this.escapeHtml(entry.nickname)}</span>
        <span>${entry.score.toLocaleString()}</span>
      </div>
    `
      )
      .join('');
  }

  public showRankPosition(position: number): void {
    this.elements.rankPosition.textContent = `#${position}`;
  }

  private startPauseTimer(): void {
    this.pauseTimerInterval = window.setInterval(() => {
      const elapsed = Date.now() - this.pauseStartTime;
      const remaining = Math.max(0, MAX_PAUSE_TIME - elapsed);
      const seconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;

      this.elements.pauseTimer.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

      if (remaining === 0) {
        this.stopPauseTimer();
        if (this.callbacks.onExit) this.callbacks.onExit();
      }
    }, 100);
  }

  private stopPauseTimer(): void {
    if (this.pauseTimerInterval) {
      clearInterval(this.pauseTimerInterval);
      this.pauseTimerInterval = null;
    }
  }

  // Callback setters
  public onContinue(callback: () => void): void {
    this.callbacks.onContinue = callback;
  }

  public onExit(callback: () => void): void {
    this.callbacks.onExit = callback;
  }

  public onSubmitScore(callback: (nickname: string) => void): void {
    this.callbacks.onSubmitScore = callback;
  }

  public onPlayAgain(callback: () => void): void {
    this.callbacks.onPlayAgain = callback;
  }

  public onViewRanking(callback: (filter: RankingFilter) => void): void {
    this.callbacks.onViewRanking = callback;
  }

  public onBackToMenu(callback: () => void): void {
    this.callbacks.onBackToMenu = callback;
  }
}
