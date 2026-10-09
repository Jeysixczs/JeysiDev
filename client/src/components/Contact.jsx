import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import { profile } from "../data/profile";
import { iconMap, ArrowUpRightIcon } from "./ui/icons";

// Web3Forms access keys are meant to be public (they only route mail to your
// inbox), so it is safe in client code. Override with VITE_WEB3FORMS_KEY if you like.
const WEB3FORMS_KEY =
  import.meta.env.VITE_WEB3FORMS_KEY || "b2243d3e-1568-44c4-a71c-226c6c2657ff";
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

// If VITE_API_URL is set (e.g. https://your-api.onrender.com) the form posts to
// your own Express server (/api/contact). If not, it sends via Web3Forms directly.
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const initialForm = { name: "", email: "", message: "", company: "" };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!form.email.trim()) {
    errors.email = "Enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.message.trim()) {
    errors.message = "Add a short message.";
  } else if (form.message.trim().length < 10) {
    errors.message = "Message should be at least 10 characters.";
  }
  return errors;
}

const fieldClass =
  "w-full rounded-none border-0 border-b border-white/30 bg-transparent py-3 text-lg text-white placeholder:text-white/30 transition-colors focus:border-white focus-visible:outline-none";
const labelClass = "block font-mono text-[11px] uppercase tracking-[0.2em] text-white/60";
const errorClass = "mt-2 font-mono text-xs text-red-600 dark:text-red-400";

/** Theme-aware: uses the same tokens as every other section so it follows light/dark. */
export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [serverMessage, setServerMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("sending");
    setServerMessage("");

    // Honeypot: real visitors never see/fill "company". Pretend it worked.
    if (form.company) {
      setStatus("success");
      setServerMessage("Message sent — I'll get back to you soon.");
      setForm(initialForm);
      return;
    }

    try {
      const clean = {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      };

      const res = API_URL
        ? await fetch(`${API_URL}/api/contact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...clean, company: form.company }),
          })
        : await fetch(WEB3FORMS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject: `New portfolio message from ${clean.name}`,
              from_name: "JeysiDev Portfolio",
              ...clean,
            }),
          });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || (!API_URL && !data.success)) {
        setStatus("error");
        setServerMessage(data.message || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setServerMessage(data.message || "Message sent — I'll get back to you soon.");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setServerMessage("Couldn't send your message. Check your connection and try again.");
    }
  }

  return (
    <section id="contact" className="relative bg-surface py-20 text-white sm:py-28 lg:py-36">
      <div className="section-shell">
        <SectionHeading
          index="07"
          label="Contact"
          title="Let's build something worth a second look."
          description="Have a project in mind, or just want to talk shop? My inbox is open."
        />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <div>
            <a
              href={`mailto:${profile.email}`}
              className="group inline-flex items-start gap-3 font-display text-xl font-medium leading-tight text-white [overflow-wrap:anywhere] focus-visible:outline-white sm:text-2xl lg:text-[1.6rem]"
            >
              <span className="border-b-2 border-white/20 transition-colors group-hover:border-white">
                {profile.email}
              </span>
              <ArrowUpRightIcon
                width={22}
                height={22}
                className="mt-1 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </a>

            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-white/60">
              Based in {profile.location}
            </p>

            <ul className="mt-12 border-t border-white/15">
              {profile.socials.map((social) => {
                const Icon = iconMap[social.icon];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target={social.icon === "mail" ? undefined : "_blank"}
                      rel="noreferrer"
                      className="group flex items-center justify-between border-b border-white/15 px-0 py-4 hover:px-3 text-white transition-all duration-300 hover:bg-white hover:text-void focus-visible:outline-white [touch-action:manipulation]"
                    >
                      <span className="flex items-center gap-3 font-display text-lg">
                        {Icon && <Icon />}
                        {social.label}
                      </span>
                      <ArrowUpRightIcon
                        width={18}
                        height={18}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Honeypot field — hidden from real visitors, catches basic bots */}
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="space-y-8">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="Ada Lovelace"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className={errorClass}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="ada@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className={errorClass}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className={labelClass}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  className={`${fieldClass} resize-none`}
                  placeholder="Tell me a bit about the project..."
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                {errors.message && (
                  <p id="message-error" className={errorClass}>
                    {errors.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="group mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-display text-sm font-medium text-void transition-transform duration-300 hover:scale-[1.02] focus-visible:outline-white active:scale-[0.97] disabled:opacity-60 [touch-action:manipulation]"
            >
              {status === "sending" ? "Sending..." : "Send message"}
              {status !== "sending" && (
                <ArrowUpRightIcon
                  width={16}
                  height={16}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              )}
            </button>

            {status === "success" && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 border border-white/30 bg-white/5 px-4 py-3 text-sm text-white"
                role="status"
              >
                {serverMessage}
              </motion.p>
            )}
            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                role="alert"
              >
                {serverMessage}
              </motion.p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
