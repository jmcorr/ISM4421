# FAU Owls Weather

A weather app themed around Florida Atlantic University (Boca Raton), built with plain HTML/CSS/JS and the free [Open-Meteo](https://open-meteo.com) API — no sign-up, no login, no API key.

## Features

- Defaults to Boca Raton, FL (FAU's home city) on load
- Search any city worldwide (via Open-Meteo's geocoding API)
- "My Location" button using browser geolocation
- Current conditions: temperature, feels-like, humidity, wind, sunrise/sunset, rain chance
- 12-hour hourly strip and 7-day forecast
- Fahrenheit / Celsius toggle
- FAU-themed design: official FAU Blue (`#003366`) and FAU Red (`#CC0000`), with a custom Owls badge logo (`assets/fau-owl-badge.svg`)
- Zero build step, zero dependencies, zero API keys — safe to deploy publicly as-is

## Project Structure

```
index.html    Markup
style.css     FAU-themed styling
script.js     Weather/geocoding logic (Open-Meteo)
assets/       Badge logo + favicon (SVG)
netlify.toml  Netlify deploy config
```

## Run Locally

No build step needed. Either:

- Open `index.html` directly in a browser, or
- Serve it locally, e.g.:
  ```bash
  npx serve .
  # or
  python3 -m http.server 8000
  ```

## Deploy to Netlify

**Option A — Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy          # preview
netlify deploy --prod   # go live
```

**Option B — Netlify Dashboard (Git-connected, recommended)**
1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Netlify: **Add new site → Import an existing project → GitHub** → select this repo.
3. Build settings are already set via `netlify.toml`:
   - Build command: *(none needed)*
   - Publish directory: `.`
4. Click **Deploy site**. Every push to this branch will auto-deploy.

**Option C — Drag and drop**
Zip/drag the project folder (containing `index.html`, `style.css`, `script.js`, `assets/`, `netlify.toml`) onto [app.netlify.com/drop](https://app.netlify.com/drop).

No environment variables or secrets are required — Open-Meteo needs no key.

## About the Logo

`assets/fau-owl-badge.svg` is an original badge illustration using FAU's official brand colors, not the university's official trademarked Owlsley artwork. If you have the official FAU logo file and want to use it instead, drop it in as `assets/fau-owl-badge.svg` (or update the `<img>` `src` in `index.html` to point at your file, e.g. `assets/fau-logo.png`).

## Data & Attribution

Weather and geocoding data provided by [Open-Meteo.com](https://open-meteo.com), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Free for non-commercial use up to 10,000 requests/day, no API key required. Attribution is kept in the app footer per the license terms — please don't remove it.
