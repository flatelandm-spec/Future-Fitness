const { fetchAndSaveActivities } = require('../lib/strava');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect('/leaderboard.html?error=access_denied');
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID || '216766',
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const token = await tokenRes.json();
    if (!token.access_token) {
      console.error('Token exchange failed:', token);
      return res.redirect('/leaderboard.html?error=token_failed');
    }

    const { access_token, refresh_token, expires_at, athlete } = token;

    // 2. Upsert member in Supabase
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/members`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        athlete_id: athlete.id,
        name: `${athlete.firstname} ${athlete.lastname}`.trim(),
        access_token,
        refresh_token,
        token_expires_at: expires_at,
        profile_photo: athlete.profile_medium || athlete.profile || null,
      }),
    });

    if (!upsertRes.ok) {
      console.error('Supabase member upsert failed:', await upsertRes.text());
      return res.redirect('/leaderboard.html?error=db_failed');
    }

    // 3. Fetch and save all activities (up to 1000 most recent)
    await fetchAndSaveActivities(athlete.id, access_token);

    res.redirect('/leaderboard.html?joined=1');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/leaderboard.html?error=server_error');
  }
};
