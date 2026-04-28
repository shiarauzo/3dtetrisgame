import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nickname, score } = req.body;

    // Validate input
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid nickname' });
    }

    if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    // Basic validation: scores should be plausible
    // Assuming max score rate of ~1000 points per second, max realistic score ~100k
    if (score > 100000) {
      return res.status(400).json({ error: 'Score too high to be valid' });
    }

    // If Supabase is not configured, return success without saving
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, skipping score save');
      return res.status(200).json({ success: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert score
    const { error } = await supabase.from('scores').insert({
      nickname: nickname.trim().slice(0, 20), // Limit nickname length
      score,
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting score:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
