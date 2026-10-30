// Action buttons the chatbot can attach to a reply.
//
// The AI never writes URLs. It only writes a tag like [[resume]] on the last
// line of its reply; the chat UI strips the tag and renders the matching
// buttons below. Anything not in this registry is dropped, so the model can't
// invent links. Used by both the server (prompt) and the browser (parsing).

import { profile } from "./profile.js";
import { projects } from "./projects.js";

const MAX_BUTTONS = 5;
const TAG_RE = /\[\[\s*([a-z]+)(?::\s*([\w-]+))?\s*\]\]/gi;

function social(icon, label) {
  const s = profile.socials.find((x) => x.icon === icon);
  return s ? [{ kind: "link", label, href: s.href }] : [];
}

function projectButtons(id) {
  const p = projects.find((x) => x.id.toLowerCase() === String(id || "").toLowerCase());
  if (!p) return [];
  const out = [];
  if (p.demo) out.push({ kind: "link", label: `${p.title} live demo`, href: p.demo });
  if (p.github) out.push({ kind: "link", label: `${p.title} on GitHub`, href: p.github });
  return out;
}

const registry = {
  resume: () => [
    { kind: "download", label: "Download resume", href: profile.resumeUrl, filename: profile.resumeFileName },
    { kind: "view-resume", label: "View resume" },
  ],
  contact: () => [{ kind: "scroll", label: "Open contact form", target: "contact" }],
  email: () => [{ kind: "link", label: "Email John Carlo", href: `mailto:${profile.email}` }],
  projects: () => [{ kind: "scroll", label: "See all projects", target: "projects" }],
  github: () => social("github", "GitHub profile"),
  linkedin: () => social("linkedin", "LinkedIn profile"),
  project: projectButtons,
};

/** Split a raw model reply into display text + button descriptors. */
export function parseReply(raw) {
  const actions = [];
  const seen = new Set();

  const text = String(raw || "")
    .replace(TAG_RE, (_, name, arg) => {
      const key = `${name}:${arg || ""}`.toLowerCase();
      const build = registry[name.toLowerCase()];
      if (build && !seen.has(key)) {
        seen.add(key);
        actions.push(...build(arg));
      }
      return "";
    })
    .replace(/\[\[[^\]]*$/, "") // half-written tag at the very end
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    text: text || (actions.length ? "Here you go:" : ""),
    actions: actions.slice(0, MAX_BUTTONS),
  };
}

/** Prompt section that teaches the model which tags exist. */
export const actionsPrompt = [
  "## Action buttons",
  "The chat can show clickable buttons under your reply. To show them, put tags on their own final line, after your text. Tags are removed from what the visitor sees.",
  "Available tags (use only these, exactly as written):",
  "- [[resume]]  shows 'Download resume' and 'View resume' buttons. Use whenever the visitor asks for his resume, CV, or a downloadable profile.",
  "- [[contact]]  scrolls to the contact form. Use when they want to hire him, message him, or ask about availability.",
  "- [[email]]  opens an email to him.",
  "- [[projects]]  scrolls to the projects section.",
  `- [[project:ID]]  shows live demo and GitHub buttons for one project. IDs: ${projects.map((p) => p.id).join(", ")}.`,
  "- [[github]] and [[linkedin]]  link to his profiles.",
  "Rules for buttons:",
  "- Still write a helpful text answer. For a resume request, give a brief 2-3 sentence summary, then add [[resume]].",
  "- Use at most 3 tags per reply, only when a button genuinely helps. Don't add buttons to every message.",
  "- Never write URLs for the resume and never mention the tag syntax. You may say 'the buttons below'.",
].join("\n");
