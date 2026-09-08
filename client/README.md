# JeysiDev Portfolio — Client

React + Vite frontend, 3D scenes via React Three Fiber / drei, animation via Framer Motion.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Runs at http://localhost:5173. Set `VITE_API_URL` in `.env` if the backend
isn't running on the default `http://localhost:5000`.

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

## Personalizing content

Edit the files in `src/data/` — see the root `README.md` for a full table.
Replace `public/avatar.jpg`, `public/resume.pdf`, and the images referenced
in `src/data/projects.js` under `public/projects/`.

## Deploying (Vercel)

1. Push this repo to GitHub.
2. Import the project in Vercel, set the root directory to `client`.
3. Build command: `npm run build`, output directory: `dist`.
4. Add an environment variable `VITE_API_URL` pointing at your deployed backend.

## Deploying (Netlify)

1. Base directory: `client`, build command: `npm run build`, publish directory: `client/dist`.
2. Add `VITE_API_URL` under Site settings → Environment variables.

## Performance notes

- The 3D hero scene and skills visualization are lazy-loaded (`React.lazy` +
  `Suspense`) so they don't block the initial text render.
- `useDeviceCapability` detects small viewports / low core counts and reduces
  particle count, disables one floating shape, and swaps the 3D skills orbit
  for a plain card grid on mobile.
- `prefers-reduced-motion` disables camera parallax and pointer-based tilt.
