# THE IDALA FAMILY — React App

## Structure

```
src/
  App.jsx       ← entire app (all pages, loader, coming soon)
  styles.css    ← ALL CSS (no inline styles, no Tailwind utilities)
```

## Setup

```bash
npm create vite@latest idala-family -- --template react
cd idala-family
npm install react-router-dom
```

Then:
1. Replace `src/App.jsx` with the provided `App.jsx`
2. Replace `src/index.css` with `styles.css` (or rename it and update the import in App.jsx)
3. Delete `src/App.css`

```bash
npm run dev
```

## Routes

| Path            | Page                  |
|-----------------|----------------------|
| `/`             | Home                 |
| `/practitioners`| Practitioners        |
| `/spiritual`    | Spiritual Guidance   |
| `/astrology`    | Birth Chart          |
| `/about`        | About Diane          |
| `/coming-soon`  | Coming Soon page     |

## Features

- **Loader**: Lotus SVG + 7 orbiting chakra dots, fades out after ~2.6s
- **Language**: FR/EN toggle, persisted in localStorage, instant switch
- **Hamburger nav**: appears at ≤768px, slides down mobile drawer
- **Birth chart calculator**: real astronomical engine (Jean Meeus)
  - Requires birth time + city for Rising Sign (geocoded via Nominatim)
- **Coming Soon**: bilingual, email capture, animated chakra dots + IDALA logo

## Notes

- All CSS lives in `styles.css` — no Tailwind, no CSS modules, no inline styles
- Replace `Photo` placeholder circles with real `<img>` tags when images are ready
- Book buttons link to `#` — update hrefs/onClick to your booking system
