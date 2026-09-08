# JeysiDev Portfolio — Server

Minimal Express API. Currently a single job: receive and relay contact-form
submissions safely.

## Setup

```bash
npm install
cp .env.example .env
npm run dev      # auto-restarts on file changes (Node's built-in --watch)
```

Runs at http://localhost:5000 by default.

## Endpoints

- `GET /api/health` — uptime check.
- `POST /api/contact` — body `{ name, email, message }`.
  - Server-side validation (name/email/message required, email format,
    message length).
  - Rate-limited to 5 requests / 15 minutes per IP.
  - Hidden `company` field is a honeypot; bots that fill it get a fake
    success response instead of an error, without a real send.
  - If `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` are set, sends an email via
    Nodemailer. Otherwise, logs the submission to the console — handy for
    local development before you've wired up a mail provider.

## Environment variables

See `.env.example`. Never commit a real `.env` file — secrets stay out of
the frontend bundle entirely because all of this lives server-side.

## Deploying (Render / Railway / Fly.io)

1. Push this repo to GitHub.
2. Create a new Node web service, root directory `server`.
3. Build command: `npm install`, start command: `npm start`.
4. Add the environment variables from `.env.example` in the platform's
   dashboard (never in code).
5. Set `CLIENT_ORIGIN` to your deployed frontend's URL so CORS allows it.
6. Update the frontend's `VITE_API_URL` to this service's public URL.
