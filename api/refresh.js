const { fetchAndSaveActivities, ensureFreshToken } = require('../lib/strava');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  try {
    // Fetch all members
    const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/members?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    const members = await membersRes.json();
    if (!Array.isArray(members)) {
      return res.status(500).json({ error: 'Failed to fetch members' });
    }

    // Fetch activities from the last 5 days (4-day cron + 1 day overlap for safety)
    const after = Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60;
    const results = [];

    for (const member of members) {
      try {
        const accessToken = await ensureFreshToken(member);
        await fetchAndSaveActivities(member.athlete_id, accessToken, after);
        results.push({ athlete_id: member.athlete_id, name: member.name, status: 'ok' });
      } catch (err) {
        console.error(`Refresh failed for athlete ${member.athlete_id}:`, err.message);
        results.push({ athlete_id: member.athlete_id, name: member.name, status: 'error', message: err.message });
      }
    }

    res.json({ refreshed_at: new Date().toISOString(), members: results });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: err.message });
  }
};
