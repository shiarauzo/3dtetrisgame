# Deployment Guide for Stakk

This guide walks you through deploying Stakk to Vercel with Supabase backend.

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- Supabase account (free tier is sufficient)

## Step 1: Setup Supabase

1. Go to https://supabase.com and create a new project
2. Wait for the project to be provisioned (takes ~2 minutes)
3. Go to the SQL Editor and run this migration:

```sql
-- Create scores table
create table scores (
  id uuid default gen_random_uuid() primary key,
  nickname text not null,
  score integer not null,
  created_at timestamp with time zone default now()
);

-- Create indexes for efficient queries
create index scores_score_idx on scores(score desc);
create index scores_created_at_idx on scores(created_at desc);

-- Enable Row Level Security (RLS)
alter table scores enable row level security;

-- Create policy to allow anyone to read scores
create policy "Anyone can read scores"
  on scores for select
  to anon
  using (true);

-- Create policy to allow anyone to insert scores
create policy "Anyone can insert scores"
  on scores for insert
  to anon
  with check (true);
```

4. Go to Project Settings > API
5. Copy the following values:
   - Project URL (under "Project URL")
   - `anon` / `public` key (under "Project API keys")

## Step 2: Push to GitHub

1. Create a new repository on GitHub (e.g., `stakk`)
2. Push your local repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/stakk.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `bun run build` (or `npm run build`)
   - **Output Directory**: `dist`
   - **Install Command**: `bun install` (or `npm install`)

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add the following:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - Make sure to add them for all environments (Production, Preview, Development)

6. Click "Deploy"

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to Settings > Domains
2. Add your custom domain (e.g., `stakk.vercel.app` or your own domain)
3. Follow the DNS configuration instructions

## Step 5: Test the Deployment

1. Visit your deployed site
2. Play a game and submit a score
3. Check that the score appears in the rankings
4. Verify the daily/weekly filters work correctly

## Troubleshooting

### Scores not saving

- Check Vercel Logs (Deployments > Your deployment > Runtime Logs)
- Verify environment variables are set correctly
- Check Supabase logs (Logs & Analytics)
- Ensure RLS policies are set up correctly

### API endpoints not working

- Verify `vercel.json` is in the repository root
- Check that API files are in the `api/` directory
- Ensure TypeScript files are being built correctly

### Build failures

- Check that all dependencies are listed in `package.json`
- Verify Node version compatibility (use Node 18+)
- Check build logs for specific error messages

## Monitoring

- **Vercel Analytics**: Enable in Project Settings > Analytics
- **Supabase Logs**: Monitor in Logs & Analytics section
- **Error Tracking**: Consider adding Sentry for production error tracking

## Performance Optimization

1. **Caching**: Vercel automatically caches static assets
2. **CDN**: Assets are served from Vercel's global CDN
3. **Compression**: Enable gzip/brotli in Vercel settings
4. **Database**: Monitor Supabase query performance

## Scaling Considerations

- **Free Tier Limits**:
  - Vercel: 100 GB bandwidth, 6000 build minutes per month
  - Supabase: 500 MB database, 2 GB bandwidth per month

- **Upgrade Path**:
  - If you exceed limits, both platforms offer affordable paid tiers
  - Database indexes are already optimized for ranking queries

## Security Notes

- API keys are exposed client-side (anon key only)
- RLS policies protect the database from unauthorized modifications
- Score validation happens server-side to prevent cheating
- Consider rate limiting for production use (e.g., Upstash Redis)

## Updates and Maintenance

To update the game:

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically deploys on push to main branch

To rollback:

1. Go to Vercel Dashboard > Deployments
2. Find the previous working deployment
3. Click "Promote to Production"

## Support

If you encounter issues:

1. Check Vercel and Supabase documentation
2. Review runtime logs in both platforms
3. Open an issue on GitHub
4. Contact support for your hosting platforms
