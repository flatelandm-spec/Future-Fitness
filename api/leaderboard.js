const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  try {
    // Fetch members with their activities via Supabase nested select
    const membersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/members?select=athlete_id,name,profile_photo,activities(strava_id,date,distance_m,moving_time_s,elevation_m,type)&order=created_at.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!membersRes.ok) {
      throw new Error(`Supabase error: ${await membersRes.text()}`);
    }

    const members = await membersRes.json();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.json(members);
  } catch (err) {
    console.error('Leaderboard API error:', err);
    res.status(500).json({ error: err.message });
  }
};
