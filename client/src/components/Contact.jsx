import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import { profile } from "../data/profile";
import { iconMap } from "./ui/icons";
import { useDeviceCapability } from "../hooks/useDeviceCapability";

const Orb = lazy(() => import("./backgrounds/Orb"));

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export default function Contact() {
  const { prefersReducedMotion, isLowPower, hasFinePointer } = useDeviceCapability();
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

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setServerMessage(data.message || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setServerMessage(data.message || "Message sent — I'll get back to you soon.");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setServerMessage("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <section id="contact" className="relative border-t border-white/[0.05] py-28">
      <div className="section-shell">
        <SectionHeading
          index="07"
          title="Let's build something worth a second look."
          description="Have a project in mind, or just want to talk shop? My inbox is open."
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
          <div>
            <div className="h-[280px] w-full sm:h-[360px]" data-cursor="hover">
              <Suspense fallback={null}>
                <Orb
                  hue={0}
                  hoverIntensity={0.35}
                  rotateOnHover
                  forceHoverState={!hasFinePointer}
                  lowPower={isLowPower}
                  paused={prefersReducedMotion}
                />
              </Suspense>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              {profile.socials.map((social) => {
                const Icon = iconMap[social.icon];
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target={social.icon === "mail" ? undefined : "_blank"}
                    rel="noreferrer"
                    data-cursor="view"
                    whileTap={{ scale: 0.92 }}
                    className="glass-panel flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-ink-muted transition-colors hover:text-cyan [touch-action:manipulation]"
                  >
                    {Icon && <Icon />}
                    {social.label}
                  </motion.a>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="glass-panel rounded-3xl p-7 sm:p-9">
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

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm text-ink-muted">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-ink placeholder:text-ink-faint focus:border-cyan/60"
                  placeholder="Ada Lovelace"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1.5 text-xs text-amber">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm text-ink-muted">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-ink placeholder:text-ink-faint focus:border-cyan/60"
                  placeholder="ada@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-amber">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm text-ink-muted">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-ink placeholder:text-ink-faint focus:border-cyan/60"
                  placeholder="Tell me a bit about the project..."
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="mt-1.5 text-xs text-amber">
                    {errors.message}
                  </p>
                )}
              </div>
            </div>

            <button type="submit" disabled={status === "sending"} className="btn-primary mt-6 w-full disabled:opacity-60">
              {status === "sending" ? "Sending..." : "Send message"}
            </button>

            {status === "success" && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-cyan"
                role="status"
              >
                {serverMessage}
              </motion.p>
            )}
            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-amber"
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
