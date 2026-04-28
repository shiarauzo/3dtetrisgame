import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filter = 'global', limit = '100' } = req.query;

    // If Supabase is not configured, return empty array
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, returning empty rankings');
      return res.status(200).json([]);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('scores')
      .select('id, nickname, score, created_at')
      .order('score', { ascending: false })
      .limit(parseInt(limit as string, 10));

    // Apply time filter
    if (filter === 'daily') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', oneDayAgo);
    } else if (filter === 'weekly') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', oneWeekAgo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch rankings' });
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
