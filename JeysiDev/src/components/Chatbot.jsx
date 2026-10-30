import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { chatbotConfig } from "../data/chatbot";
import { profile } from "../data/profile";
import { ArrowUpRightIcon, CloseIcon, FileTextIcon } from "./ui/icons";
import { parseReply } from "../data/chatActions";
import { useResume } from "../context/ResumeContext";

const MAX_INPUT = 500;
const ease = [0.22, 1, 0.36, 1];
const labelClass = "font-mono text-[11px] uppercase tracking-[0.2em]";

/** "JeysiBot" -> ["Jeysi", "Bot"] so the wordmark can be solid + outline like the hero. */
function splitName(name) {
  const m = name.match(/^(.+?)([A-Z][a-z]*)$/);
  return m ? [m[1], m[2]] : [name, ""];
}

function ResetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16" {...props}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Rounded speech bubble with an AI sparkle that twinkles every few seconds. */
function ChatIcon({ animated = false, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="26" height="26" {...props}>
      <path
        d="M7 3.5h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-6.2L7 20.5v-3a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4Z"
        strokeLinejoin="round"
      />
      <motion.path
        d="M12 6.4c.4 2.2 1.4 3.2 3.6 3.6-2.2.4-3.2 1.4-3.6 3.6-.4-2.2-1.4-3.2-3.6-3.6 2.2-.4 3.2-1.4 3.6-3.6Z"
        fill="currentColor"
        stroke="none"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={animated ? { scale: [1, 1.35, 1, 1], rotate: [0, 90, 180, 180], opacity: [1, 0.8, 1, 1] } : undefined}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 0.4, 1] }}
      />
    </svg>
  );
}

/* Tiny safe renderer: **bold**, "- " lists, auto-linked URLs. No raw HTML. */
function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}${i}`} className="font-medium text-white">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (/^https?:\/\//.test(p)) {
      return (
        <a
          key={`${keyPrefix}${i}`}
          href={p}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline decoration-white/30 underline-offset-4 transition-colors [overflow-wrap:anywhere] hover:decoration-white"
        >
          {p}
        </a>
      );
    }
    return p;
  });
}

function RichText({ text }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="my-3 space-y-2 first:mt-0 last:mb-0">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-3">
                  <span className="font-mono text-white/30" aria-hidden="true">
                    /
                  </span>
                  <span>{renderInline(l.replace(/^\s*[-*]\s+/, ""), `${bi}-${li}-`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="my-3 whitespace-pre-wrap first:mt-0 last:mb-0">
            {renderInline(block, `${bi}-`)}
          </p>
        );
      })}
    </>
  );
}

/** Reply text plus any action buttons the model attached via [[tags]]. */
function AssistantContent({ content, error, onAction }) {
  if (error) return <RichText text={content} />;
  const { text, actions } = parseReply(content);
  return (
    <>
      <RichText text={text} />
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((a, i) => {
            const cls = `${i === 0 ? "btn-light" : "btn-ghost"} group !px-5 !py-2.5 !text-[13px]`;
            const icon =
              a.kind === "download" || a.kind === "view-resume" ? (
                <FileTextIcon width="15" height="15" />
              ) : (
                <ArrowUpRightIcon
                  width="15"
                  height="15"
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              );
            const motionProps = {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease },
            };
            if (a.kind === "download") {
              return (
                <motion.a key={a.label} href={a.href} download={a.filename} className={cls} {...motionProps}>
                  {icon}
                  {a.label}
                </motion.a>
              );
            }
            if (a.kind === "link") {
              const external = !a.href.startsWith("mailto:");
              return (
                <motion.a
                  key={a.label}
                  href={a.href}
                  target={external ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={cls}
                  {...motionProps}
                >
                  {a.label}
                  {icon}
                </motion.a>
              );
            }
            return (
              <motion.button key={a.label} type="button" onClick={() => onAction(a)} className={cls} {...motionProps}>
                {a.kind === "view-resume" ? icon : null}
                {a.label}
                {a.kind === "scroll" ? icon : null}
              </motion.button>
            );
          })}
        </div>
      )}
    </>
  );
}

/** Mono "NAME /" label, the same voice as the hero ticker. */
function Tag({ children, className = "" }) {
  return (
    <p className={`${labelClass} mb-2 flex items-center text-white/50 ${className}`}>
      {children}
      <span className="mx-3 text-white/20">/</span>
    </p>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role, content, error?}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { openResume } = useResume();
  const reduceMotion = useReducedMotion();
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const name = chatbotConfig.assistantName;
  const [nameA, nameB] = splitName(name);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // On phones the chat is full screen, so lock the page behind it.
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 639px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** `retry` re-sends the existing last user message without adding it twice. */
  async function send(text, retry = false) {
    const content = text.trim().slice(0, MAX_INPUT);
    if (!content || loading) return;

    const base = messages.filter((m) => !m.error);
    const history = retry ? base : [...base, { role: "user", content }];
    setMessages(history);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((m) => [
        ...m,
        { role: "assistant", content: err.message || "Couldn't reach the assistant.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) send(lastUser.content, true);
  }

  function resetChat() {
    abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
    setInput("");
    inputRef.current?.focus();
  }

  function runAction(a) {
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (a.kind === "view-resume") {
      setOpen(false);
      setTimeout(openResume, 150);
    } else if (a.kind === "scroll") {
      if (mobile) setOpen(false); // full-screen on phones, so get out of the way
      setTimeout(
        () => {
          const el = document.getElementById(a.target);
          if (!el) return;
          const top = el.getBoundingClientRect().top + window.scrollY - 72 + 1;
          window.scrollTo({ top, behavior: "smooth" });
        },
        mobile ? 200 : 0
      );
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  const empty = messages.length === 0;

  return (
    <>
      {/* Launcher: the hero's btn-light pill */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.6, ease }}
            aria-label={`Chat with ${name}`}
            className="btn-light group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-[60] !h-14 !w-14 !p-0 shadow-lg shadow-black/30 sm:bottom-8 sm:right-8 sm:!h-auto sm:!w-auto sm:!px-7 sm:!py-3 sm:shadow-none"
          >
            {/* Phones: logo-only chat bubble. sm and up: the full "Ask JeysiBot" pill. */}
            {!reduceMotion && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full bg-white sm:hidden"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 1.7], opacity: [0.45, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.6, ease: "easeOut" }}
              />
            )}
            <ChatIcon
              animated={!reduceMotion}
              className="relative transition-transform duration-300 group-active:scale-90 sm:hidden"
            />
            <span className="hidden sm:inline">Ask {name}</span>
            <ArrowUpRightIcon
              width="16"
              height="16"
              className="hidden transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block"
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            role="dialog"
            aria-label={`${name} chat`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5, ease }}
            className="fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-hidden border-white/15 bg-void pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:inset-auto sm:bottom-8 sm:right-8 sm:h-[min(41rem,calc(100dvh-4rem))] sm:w-[27rem] sm:border sm:pt-0 sm:pb-0"
          >
            {/* Same backdrop as the hero: fine grid + soft spotlight */}
            <div className="hero-grid pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_38%_at_50%_22%,rgb(var(--c-fg)/var(--hero-spot)),transparent_72%)]" />

            {/* Top bar */}
            <div className="relative flex items-center justify-between px-5 pt-5">
              <p className={`${labelClass} text-white/50`}>(AI) Assistant</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetChat}
                  aria-label="Start a new conversation"
                  title="New conversation"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 hover:border-white hover:bg-white hover:text-void [touch-action:manipulation]"
                >
                  <ResetIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 hover:border-white hover:bg-white hover:text-void [touch-action:manipulation]"
                >
                  <CloseIcon width="16" height="16" />
                </button>
              </div>
            </div>

            {/* Wordmark: solid + outline, exactly like "Jeysi" / "Dev" */}
            <h2
              aria-label={name}
              className="relative select-none px-5 pb-5 pt-5 font-display text-[3.5rem] font-bold uppercase leading-[0.84] tracking-tighter sm:text-[4rem]"
            >
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8, ease }}
                className="inline-block text-white"
              >
                {nameA}
              </motion.span>
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.8, ease }}
                className="inline-block text-transparent"
                style={{ WebkitTextStroke: "1.5px rgb(var(--c-fg) / 0.9)" }}
              >
                {nameB}
              </motion.span>
            </h2>

            {/* Conversation */}
            <div
              ref={listRef}
              className="relative flex-1 overflow-y-auto overscroll-contain border-t border-white/10 px-5"
              aria-live="polite"
            >
              {empty && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.7, ease }}
                  className="py-6"
                >
                  <p className="font-display text-2xl font-medium text-white">
                    Ask anything
                    <span className="block text-white/40">about John Carlo.</span>
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-white/60">{chatbotConfig.greeting}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {chatbotConfig.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="btn-ghost !px-4 !py-2 text-left !text-[13px]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease }}
                  className="border-b border-white/10 py-5 last:border-b-0"
                >
                  {m.role === "user" ? (
                    <>
                      <Tag>You</Tag>
                      <p className="whitespace-pre-wrap font-display text-xl leading-snug text-white [overflow-wrap:anywhere]">
                        {m.content}
                      </p>
                    </>
                  ) : (
                    <>
                      <Tag className={m.error ? "!text-red-600 dark:!text-red-400" : ""}>
                        {m.error ? "Error" : name}
                      </Tag>
                      <div
                        className={`text-[15px] leading-relaxed ${
                          m.error ? "text-red-600 dark:text-red-400" : "text-white/70"
                        }`}
                      >
                        <AssistantContent content={m.content} error={m.error} onAction={runAction} />
                      </div>
                      {m.error && i === messages.length - 1 && (
                        <button type="button" onClick={retryLast} className="btn-ghost mt-4 !px-5 !py-2 !text-[13px]">
                          Try again
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="py-5" role="status">
                  <Tag>{name}</Tag>
                  <p className={`${labelClass} flex text-white/60`}>
                    Thinking
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                      >
                        .
                      </motion.span>
                    ))}
                  </p>
                </div>
              )}
            </div>

            {/* Input bar: same treatment as the ticker strip */}
            <form
              onSubmit={onSubmit}
              className="relative flex items-center gap-3 border-t border-white/10 bg-void/80 px-5 py-3 backdrop-blur-sm"
            >
              <label htmlFor="chat-input" className="sr-only">
                Your message
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_INPUT}
                autoComplete="off"
                placeholder={`Ask about ${profile.name}…`}
                className="min-w-0 flex-1 bg-transparent py-2 text-base text-white placeholder:text-white/30 focus:outline-none focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-void transition-transform duration-300 hover:scale-105 active:scale-[0.94] disabled:opacity-30 disabled:hover:scale-100 [touch-action:manipulation]"
              >
                <ArrowUpRightIcon
                  width="18"
                  height="18"
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>
            </form>

            <p className={`${labelClass} relative border-t border-white/10 px-5 py-2.5 text-[10px] text-white/40`}>
              AI can make mistakes
              <span className="mx-3 text-white/20">/</span>
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="transition-colors hover:text-white"
              >
                Contact John Carlo
              </a>
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
