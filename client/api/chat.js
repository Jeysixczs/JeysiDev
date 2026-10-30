// Vercel serverless function: POST /api/chat
// The Gemini API key lives ONLY here (process.env.GEMINI_API_KEY), never in the browser.

import { profile } from "../src/data/profile.js";
import { projects } from "../src/data/projects.js";
import { skills } from "../src/data/skills.js";
import { experience } from "../src/data/experience.js";
import { services } from "../src/data/services.js";
import { certificates } from "../src/data/certificates.js";
import { chatbotConfig } from "../src/data/chatbot.js";
import { actionsPrompt } from "../src/data/chatActions.js";

// Tried in order. If one hits its daily/minute quota (429) or is unavailable,
// the next is used. Free-tier quotas are counted per model, so a fallback
// roughly doubles the free daily allowance. Override with GEMINI_MODELS="a,b".
const MODELS = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const API_REVISION = "2026-05-20";

const MAX_MESSAGES = 12; // last N turns sent to Gemini
const MAX_CHARS = 800; // per user message
const RATE_LIMIT = 20; // requests per IP per 10 minutes (best effort, per instance)
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

/** Build the system prompt from the same data files the website renders. */
function buildSystemPrompt() {
  const lines = [];
  lines.push(
    `You are ${chatbotConfig.assistantName}, the AI assistant on the portfolio website of ${profile.name} (John Carlo Aquino).`,
    "Your job is to help visitors (recruiters, clients, collaborators) learn about him.",
    "",
    "## Rules",
    ...chatbotConfig.rules.map((r) => `- ${r}`),
    "",
    "## About",
    `Name: John Carlo Aquino, online as ${profile.name}`,
    `Role: ${profile.role}`,
    `Location: ${profile.location}`,
    `Tagline: ${profile.tagline}`,
    ...profile.bio,
    `Email: ${profile.email}`,
    "Resume: available through the [[resume]] button (do not print its URL).",
    ...profile.socials.map((s) => `${s.label}: ${s.href}`),
    "",
    "",
    actionsPrompt,
    "",
    "## Stats",
    ...profile.stats.map((s) => `${s.label}: ${s.value}${s.suffix}`),
    "",
    "## Skills",
    ...skills.map((s) => `- ${s.name} (${s.category}): ${s.note}`),
    "",
    "## Projects",
    ...projects.map(
      (p) =>
        `- ${p.title}: ${p.description} Tech: ${p.tech.join(", ")}.` +
        (p.github ? ` GitHub: ${p.github}.` : "") +
        (p.demo ? ` Live demo: ${p.demo}.` : "")
    ),
    "",
    "## Experience & Education",
    ...experience.map(
      (e) =>
        `- [${e.type}] ${e.period}: ${e.title}` +
        (e.school ? ` at ${e.school}` : e.org ? ` at ${e.org}` : "") +
        (e.degree && e.degree !== e.title ? ` (${e.degree})` : "") +
        `. ${e.description}`
    ),
    "",
    "## Services he offers",
    ...services.map((s) => `- ${s.title}: ${s.description} (${s.tags.join(", ")})`),
    "",
    "## Certificates",
    ...certificates.map(
      (c) => `- ${c.title}, issued by ${c.issuer} (${c.date})` + (c.credentialUrl ? ` Verify: ${c.credentialUrl}` : "")
    ),
    "",
    "## Extra facts",
    ...chatbotConfig.extraFacts.map((f) => `- ${f}`)
  );
  return lines.join("\n");
}

const SYSTEM_PROMPT = buildSystemPrompt();

function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve(typeof req.body === "string" ? safeParse(req.body) : req.body);
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 50_000) req.destroy();
    });
    req.on("end", () => resolve(safeParse(data)));
    req.on("error", () => resolve(null));
  });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return arr.length > RATE_LIMIT;
}

/** Pull the text out of an Interactions API response. */
function extractText(data) {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;
  const out = [];
  for (const step of data?.steps || []) {
    if (step.type !== "model_output") continue;
    for (const c of step.content || []) {
      if (c.type === "text" && c.text) out.push(c.text);
    }
  }
  return out.join("").trim();
}

/** Work out which quota a Google 429 refers to, from its error body. */
function classify429(detail) {
  const d = String(detail || "");
  const retry = Number((d.match(/retryDelay"?\s*:\s*"?(\d+)/i) || [])[1]) || null;
  if (/limit:\s*0\b/i.test(d)) return { kind: "zero", retry };
  if (/PerDay|per day|daily/i.test(d)) return { kind: "day", retry };
  if (/PerMinute|per minute/i.test(d)) return { kind: "minute", retry };
  return { kind: "unknown", retry };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 500, { error: "Chat isn't configured yet (missing GEMINI_API_KEY)." });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (rateLimited(ip)) {
    return send(res, 429, { error: "You're sending messages too fast. Please try again in a few minutes." });
  }

  const body = await readBody(req);
  const incoming = Array.isArray(body?.messages) ? body.messages : null;
  if (!incoming || incoming.length === 0) {
    return send(res, 400, { error: "No messages provided." });
  }

  // Sanitize: only user/assistant roles, plain strings, bounded size, must end on a user turn.
  const clean = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content)
    .slice(-MAX_MESSAGES);

  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== "user") {
    return send(res, 400, { error: "Last message must be from the user." });
  }

  // Stateless history in the Interactions API's step format.
  const input = clean.map((m) => ({
    type: m.role === "user" ? "user_input" : "model_output",
    content: [{ type: "text", text: m.content }],
  }));

  const call = (model, withThinking) =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": API_REVISION,
      },
      body: JSON.stringify({
        model,
        system_instruction: SYSTEM_PROMPT,
        input,
        store: false,
        generation_config: withThinking ? { temperature: 0.6, thinking_level: "low" } : { temperature: 0.6 },
      }),
    });

  try {
    const quota = []; // one entry per model that answered 429

    for (const model of MODELS) {
      let upstream = await call(model, true);
      // Some models reject thinking_level; retry the same model without it.
      if (upstream.status === 400) upstream = await call(model, false);

      if (upstream.ok) {
        const reply = extractText(await upstream.json());
        if (reply) return send(res, 200, { reply });
        continue; // empty answer: try the next model
      }

      const detail = await upstream.text().catch(() => "");
      console.error(`Gemini error [${model}]`, upstream.status, detail.slice(0, 500));
      if (upstream.status === 429) quota.push(classify429(detail));
      // 429 / 5xx / 404 -> try the next model; other errors won't be fixed by another model
      if (![429, 404, 500, 502, 503, 504].includes(upstream.status)) break;
    }

    if (quota.length) {
      const kinds = quota.map((q) => q.kind);
      const wait = Math.max(...quota.map((q) => q.retry || 0));
      let error;
      if (kinds.every((k) => k === "minute")) {
        error = `The assistant is getting a lot of questions right now. Please try again in ${wait ? `${wait} seconds` : "a minute"}.`;
      } else if (kinds.includes("day")) {
        error = "The assistant has reached its daily limit. Please try again tomorrow, or use the contact form to reach John Carlo directly.";
      } else if (kinds.includes("zero")) {
        error = "The assistant isn't available right now. Please use the contact form to reach John Carlo directly.";
      } else {
        error = "The assistant is busy right now. Please try again in a few minutes.";
      }
      console.error("Gemini quota summary:", kinds.join(", "));
      return send(res, 429, { error });
    }
    return send(res, 502, { error: "The assistant had a problem. Please try again." });
  } catch (err) {
    console.error("Chat handler failed", err);
    return send(res, 500, { error: "Something went wrong. Please try again." });
  }
}
