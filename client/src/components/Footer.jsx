import { profile } from "../data/profile";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-8">
      <div className="section-shell flex flex-col items-center justify-between gap-3 text-sm text-ink-faint sm:flex-row">
        <p>
          © {new Date().getFullYear()} {profile.name}. Built with React &amp; Three.js.
        </p>
        <p>Designed &amp; developed from scratch — no template.</p>
      </div>
    </footer>
  );
}
