import { RankingEntry, RankingFilter } from '../types';

export class APIClient {
  private baseURL: string;
  private useLocalStorage: boolean;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
    // Use localStorage in development, API in production
    this.useLocalStorage = !baseURL || baseURL === '';
  }

  public async submitScore(nickname: string, score: number): Promise<void> {
    if (this.useLocalStorage) {
      // localStorage fallback for development
      const scores = this.getLocalScores();
      scores.push({
        id: Date.now().toString(),
        nickname,
        score,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('stakk_scores', JSON.stringify(scores));
      return;
    }

    // Production API call
    const response = await fetch(`${this.baseURL}/api/submit-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, score }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit score');
    }
  }

  public async getRankings(filter: RankingFilter = 'global'): Promise<RankingEntry[]> {
    if (this.useLocalStorage) {
      // localStorage fallback for development
      const scores = this.getLocalScores();
      const now = new Date();
      let filtered = scores;

      if (filter === 'daily') {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filtered = scores.filter((s) => new Date(s.created_at) > oneDayAgo);
      } else if (filter === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = scores.filter((s) => new Date(s.created_at) > oneWeekAgo);
      }

      return filtered.sort((a, b) => b.score - a.score);
    }

    // Production API call
    const response = await fetch(`${this.baseURL}/api/rankings?filter=${filter}`);
    if (!response.ok) {
      throw new Error('Failed to fetch rankings');
    }

    return response.json();
  }

  public async getTopRankings(limit = 5): Promise<RankingEntry[]> {
    const rankings = await this.getRankings('global');
    return rankings.slice(0, limit);
  }

  private getLocalScores(): RankingEntry[] {
    const stored = localStorage.getItem('stakk_scores');
    return stored ? JSON.parse(stored) : [];
  }
}
