# Stakk - 3D Tetris

A minimal 3D Tetris game with isometric aesthetics and global rankings.

![Stakk Screenshot](./screenshot.png)
*Screenshot placeholder - coming soon*

## About

Stakk is a web-based 3D Tetris game featuring:
- Classic tetromino gameplay in a 5x5x15 3D grid
- Horizontal plane clearing mechanics
- Isometric camera with mouse rotation controls
- Progressive difficulty with exponential speed curve
- Global rankings with daily/weekly filters
- No login required - just play

## How to Play

### Controls

| Action | Keys |
|--------|------|
| Move piece | Arrow keys |
| Rotate horizontal | Q / E |
| Rotate vertical | R / F |
| Hard drop | Space |
| Rotate camera | Mouse drag |
| Snap camera X axis | X |
| Snap camera Y axis | Y |
| Snap camera Z axis | Z |
| Pause | ESC |

### Scoring

- **Drop points**: Height of drop × 10
- **Combo multiplier**: Consecutive plane clears multiply your score
- **Multi-plane bonus**: Clear multiple planes at once for (planes² × 100) bonus
- **No penalties**: Focus on stacking high and clearing planes

### Strategy

- Complete horizontal 5x5 planes to clear them and earn points
- Stack pieces strategically to maximize drop height
- Chain plane clears to build up combo multipliers
- The game speeds up with each plane cleared - there's no speed cap

## Tech Stack

- **Frontend**: Vite + TypeScript + Three.js
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Local Development

### Prerequisites

- [Bun](https://bun.sh) v1.3+ or Node.js 18+
- (Optional) Supabase account for rankings

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stakk.git
cd stakk
```

2. Install dependencies:
```bash
bun install
```

3. (Optional) Configure Supabase:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

If you skip this step, the game will use localStorage for rankings in development.

4. Run the development server:
```bash
bun run dev
```

5. Open http://localhost:3000

### Build for Production

```bash
bun run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
bun run preview
```

## Supabase Setup

If you want to enable persistent rankings:

1. Create a new Supabase project at https://supabase.com
2. Run this SQL in the SQL Editor:

```sql
create table scores (
  id uuid default gen_random_uuid() primary key,
  nickname text not null,
  score integer not null,
  created_at timestamp with time zone default now()
);

create index scores_score_idx on scores(score desc);
create index scores_created_at_idx on scores(created_at desc);
```

3. Get your project URL and anon key from Project Settings > API
4. Add them to your Vercel environment variables or local `.env`

## Deployment

This project is configured for Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
4. Deploy

## Project Structure

```
stakk/
├── api/                    # Vercel serverless functions
│   ├── submit-score.ts    # POST score submission
│   └── rankings.ts        # GET rankings with filters
├── src/
│   ├── engine/            # Game logic
│   │   ├── GameEngine.ts  # Core game state & mechanics
│   │   └── tetrominoes.ts # Piece definitions
│   ├── renderer/          # Three.js rendering
│   │   └── ThreeRenderer.ts
│   ├── input/             # Input handling
│   │   └── InputHandler.ts
│   ├── ui/                # UI management
│   │   └── UIManager.ts
│   ├── api/               # API client
│   │   └── client.ts
│   ├── types.ts           # TypeScript types
│   ├── constants.ts       # Game constants
│   └── main.ts            # Entry point
├── index.html             # HTML with embedded styles
├── vite.config.ts         # Vite configuration
└── vercel.json            # Vercel configuration
```

## License

MIT

## Support the Project

If you enjoy Stakk, consider supporting development:

[Buy me a coffee](https://ko-fi.com/shiaradesign)
