import { profile } from "../data/profile";

const NAV = [
  ["about", "About"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["certificates", "Certificates"],
  ["services", "Services"],
  ["contact", "Contact"],
];

function go(id) {
  return (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-void pt-16 sm:pt-20">
      <div className="section-shell grid gap-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="max-w-xs font-display text-2xl leading-snug text-white">
            Open to freelance and full-time work.
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="mt-4 inline-block font-mono text-sm text-white/60 underline underline-offset-4 transition-colors hover:text-white"
          >
            {profile.email}
          </a>
        </div>

        <nav aria-label="Footer">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Sections</p>
          <ul className="mt-4 space-y-2">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={go(id)}
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Elsewhere</p>
          <ul className="mt-4 space-y-2">
            {profile.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target={s.icon === "mail" ? undefined : "_blank"}
                  rel="noreferrer"
                  className="text-sm text-white/70 transition-colors hover:text-white"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Oversized outline wordmark, bleeding off the bottom edge */}
      <div
        aria-hidden="true"
        className="mt-14 select-none whitespace-nowrap text-center font-display text-[19vw] font-bold uppercase leading-[0.78] tracking-tighter"
        style={{ color: "transparent", WebkitTextStroke: "1.5px rgb(var(--c-fg) / 0.22)" }}
      >
        {profile.name}
      </div>

      <div className="relative border-t border-white/10 bg-void">
        <div className="section-shell flex flex-col items-center justify-between gap-3 py-6 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {profile.name} &mdash; Designed &amp; developed from scratch
          </p>
          <a
            href="#home"
            onClick={go("home")}
            className="transition-colors hover:text-white"
          >
            Back to top &uarr;
          </a>
        </div>
      </div>
    </footer>
  );
}
