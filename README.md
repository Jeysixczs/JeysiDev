# JeysiDev — 3D Interactive Portfolio

A premium, interactive 3D developer portfolio built with React, React Three Fiber, and Express.
Design concept: **"Signal in the Dark"** — a quiet void punctuated by circuitry-cyan and nebula-violet
light, with your work presented as constellations of connected nodes rather than generic cards.

```
jeysidev-portfolio/
├── client/          React + Vite + React Three Fiber frontend
└── server/          Express backend (contact form API)
```

See `client/README.md` and `server/README.md` for setup details, or follow the
Quick Start below to run everything locally.

## Quick Start

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # fill in email / recipient config
npm run dev             # http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env    # set VITE_API_URL if backend isn't on :5000
npm run dev              # http://localhost:5173
```

Open http://localhost:5173 — the site talks to the API at the URL in `VITE_API_URL`
(defaults to `http://localhost:5000`).

## Replacing placeholder content

All personal content lives in one of these files — edit these and the whole site updates:

| What                                   | File                                      |
|-----------------------------------------|--------------------------------------------|
| Name, tagline, bio, stats, social links | `client/src/data/profile.js`                |
| Skills / tech stack                     | `client/src/data/skills.js`                 |
| Projects                                | `client/src/data/projects.js`               |
| Experience & education timeline         | `client/src/data/experience.js`             |
| Services offered                        | `client/src/data/services.js`               |
| Profile photo                           | `client/public/avatar.jpg` (swap the file)  |
| Project thumbnails                      | `client/public/projects/*.jpg`              |
| Contact form recipient / email creds    | `server/.env`                               |

## Deployment

See the "Deploying" section in `client/README.md` (Vercel/Netlify) and
`server/README.md` (Render/Railway/Fly.io), including the environment
variables each platform needs.
