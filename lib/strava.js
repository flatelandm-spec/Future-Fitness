const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

/**
 * Fetch all activities from Strava and upsert into Supabase.
 * Pass `after` (Unix timestamp) to only fetch activities after that time.
 */
async function fetchAndSaveActivities(athleteId, accessToken, after = null) {
  let page = 1;
  let allRows = [];
  const maxPages = after ? 2 : 5; // on refresh fetch fewer pages

  while (page <= maxPages) {
    let url = `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}`;
    if (after) url += `&after=${after}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const activities = await res.json();
    if (!Array.isArray(activities) || activities.length === 0) break;

    const rows = activities.map((a) => ({
      strava_id: a.id,
      athlete_id: athleteId,
      date: a.start_date_local.split('T')[0],
      distance_m: a.distance || 0,
      moving_time_s: a.moving_time || 0,
      elevation_m: a.total_elevation_gain || 0,
      type: a.sport_type || a.type || 'Other',
    }));

    allRows = allRows.concat(rows);
    if (activities.length < 200) break;
    page++;
  }

  if (allRows.length === 0) return;

  // Upsert in batches of 500
  for (let i = 0; i < allRows.length; i += 500) {
    const batch = allRows.slice(i, i + 500);
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/activities`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });
    if (!upsertRes.ok) {
      console.error('Activity upsert failed:', await upsertRes.text());
    }
  }
}

/**
 * Refresh a Strava access token and update the member record in Supabase.
 * Returns the new access_token.
 */
async function ensureFreshToken(member) {
  const now = Math.floor(Date.now() / 1000);
  if (member.token_expires_at > now + 300) {
    return member.access_token; // still valid
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID || '216766',
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: member.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed for athlete ${member.athlete_id}`);

  await fetch(`${SUPABASE_URL}/rest/v1/members?athlete_id=eq.${member.athlete_id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expires_at: data.expires_at,
    }),
  });

  return data.access_token;
}

module.exports = { fetchAndSaveActivities, ensureFreshToken };
