# Future Fitness — Strava Club Tracker

## Setup Instructions

### 1. Deploy to GitHub Pages

1. Create a new GitHub repository called `future-fitness`
2. Upload `index.html` and `callback.html` to the root of the repo
3. Go to **Settings → Pages** and set source to **main branch / root**
4. Your site will be live at `https://YOUR-USERNAME.github.io/future-fitness/`

### 2. Update the redirect URI

In `index.html`, find this line and replace `YOUR-USERNAME` with your GitHub username:

```
redirect_uri=https://YOUR-USERNAME.github.io/future-fitness/callback.html
```

### 3. Register the redirect URI with Strava

Go to https://www.strava.com/settings/api and add the full callback URL to the **Authorization Callback Domain** field:

```
YOUR-USERNAME.github.io
```

### 4. Share the link with members

Send all club members to:
```
https://YOUR-USERNAME.github.io/future-fitness/
```

They click "Connect with Strava", authorize, and are shown a code. They copy that code and send it to you.

### 5. Exchange codes for tokens (as admin)

For each member's code, run this in your terminal (replace the values):

```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=216766 \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=MEMBERS_CODE \
  -d grant_type=authorization_code
```

Save the `access_token`, `refresh_token`, and `athlete.id` returned for each member.

---

## What's Next

Once you have tokens for your members, you can:
- Pull their activities via the Strava API
- Build automated weekly/monthly leaderboards
- Generate shareable reports for the club

Ask Claude to help you build the next step!
