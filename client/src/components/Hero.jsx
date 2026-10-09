import { motion } from "framer-motion";
import { iconMap, ArrowUpRightIcon } from "./ui/icons";
import { profile } from "../data/profile";
import { skills } from "../data/skills";
import { useMousePosition } from "../hooks/useMousePosition";
import { useSmoothMouse } from "../hooks/useSmoothMouse";
import { useParallax } from "../hooks/useParallax";
import { useDeviceCapability } from "../hooks/useDeviceCapability";

const ease = [0.22, 1, 0.36, 1];

// Animations stay at their `initial` state until `ready` flips (the load
// screen is covering the page), so the intro plays as the curtain lifts.
const makeFadeUp = (ready) => (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: ready ? { opacity: 1, y: 0 } : undefined,
  transition: { delay, duration: 0.7, ease },
});

function scrollTo(id) {
  return (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
}

function Socials({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {profile.socials.map((s) => {
        const Icon = iconMap[s.icon];
        if (!Icon) return null;
        return (
          <a
            key={s.label}
            href={s.href}
            aria-label={s.label}
            target={s.icon === "mail" ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-void"
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
}

/** Infinite tech ticker pinned to the bottom edge of the hero. */
function Ticker({ reduced }) {
  const row = [...skills, ...skills];
  return (
    <div className="relative z-30 mt-auto w-full overflow-hidden border-y border-white/10 bg-void/80 py-3 backdrop-blur-sm lg:absolute lg:bottom-0 lg:left-0">
      <motion.div
        className="flex w-max items-center whitespace-nowrap"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        {row.map((s, i) => (
          <span key={`${s.name}-${i}`} className="flex items-center font-mono text-xs uppercase tracking-[0.2em] text-white/50">
            {s.name}
            <span className="mx-6 text-white/20">/</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function Hero({ ready = true }) {
  const fadeUp = makeFadeUp(ready);
  const mouse = useMousePosition();
  const smoothMouse = useSmoothMouse(mouse, 0.08);
  const { isTouch, hasFinePointer, prefersReducedMotion } = useDeviceCapability();
  // Pointer type, not viewport width — width-based checks flip when the
  // page is zoomed, which would toggle mouse-parallax on/off just from
  // zooming rather than from the actual input device changing.
  const coarsePointer = isTouch || !hasFinePointer;
  const [px, py] = useParallax(smoothMouse, {
    strength: 10,
    enabled: !coarsePointer && !prefersReducedMotion,
  });

  const stat = (label) => profile.stats.find((s) => s.label.startsWith(label));
  const projectCount = stat("Shipped")?.value ?? 0;
  const yearCount = stat("Years")?.value ?? 0;

  return (
    <section id="home" className="relative flex min-h-screen flex-col overflow-hidden bg-void">
      {/* Backdrop: fine grid + a soft white spotlight behind the portrait */}
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_38%_55%_at_50%_58%,rgb(var(--c-fg)/var(--hero-spot)),transparent_72%)] max-lg:bg-[radial-gradient(ellipse_80%_32%_at_50%_42%,rgb(var(--c-fg)/var(--hero-spot)),transparent_72%)]" />

      {/* ── Oversized black & white wordmark ── */}
      <div
        className="relative z-0 px-4 pt-28 text-center lg:absolute lg:inset-x-0 lg:top-[19vh] lg:px-0 lg:pt-0"
        style={{ transform: `translate3d(${px}px, ${py * 0.6}px, 0)` }}
      >
        <h1
          aria-label={profile.name}
          className="select-none font-display text-[30vw] font-bold uppercase leading-[0.84] tracking-tighter sm:text-[26vw] lg:text-[17vw]"
        >
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, y: 40 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.2, duration: 1, ease }}
            className="block text-white lg:inline"
          >
            Jeysi
          </motion.span>
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, y: 40 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.35, duration: 1, ease }}
            className="block text-transparent lg:inline"
            style={{ WebkitTextStroke: "2px rgb(var(--c-fg) / 0.9)" }}
          >
            Dev
          </motion.span>
        </h1>
      </div>

      {/* ── Portrait (centered, anchored to the bottom edge) ── */}
      <div
        className="pointer-events-none relative z-10 -mt-[37vw] px-6 sm:-mt-[30vw] lg:absolute lg:inset-0 lg:mt-0 lg:px-0"
        style={{ transform: `translate3d(${-px * 1.5}px, ${-py * 0.8}px, 0)` }}
      >
        <motion.img
          initial={{ opacity: 0, y: 50 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.5, duration: 1.1, ease }}
          src={profile.heroImage}
          alt="Portrait of John Carlo Aquino, a.k.a. JeysiDev"
          width="432"
          height="577"
          decoding="async"
          draggable="false"
          className="mx-auto block w-[88%] max-w-[420px] hero-portrait select-none lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:mx-auto lg:h-[88vh] lg:w-auto lg:max-w-none"
        />
      </div>

      {/* ── Copy: bottom-left on desktop, below the portrait on mobile ── */}
      <div className="relative z-20 px-6 pb-8 pt-2 sm:px-8 lg:absolute lg:bottom-24 lg:left-0 lg:max-w-[360px] lg:pb-0 lg:pl-10 xl:left-[max(2.5rem,calc((100vw-72rem)/2))]">
        <motion.span
          {...fadeUp(0.9)}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 font-mono text-xs text-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
          </span>
          Open to opportunities
        </motion.span>

        <motion.h2 {...fadeUp(1)} className="font-display text-2xl font-medium text-white sm:text-3xl">
          {profile.role}
          <span className="block text-white/40">&amp; Full Stack</span>
        </motion.h2>

        <motion.p {...fadeUp(1.1)} className="mt-3 text-base leading-relaxed text-white/60">
          {profile.tagline}
        </motion.p>

        <motion.div {...fadeUp(1.2)} className="mt-6 flex flex-wrap items-center gap-3">
          <a href="#projects" className="btn-light group" onClick={scrollTo("projects")}>
            View my work
            <ArrowUpRightIcon
              width="16"
              height="16"
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
          <a href="#contact" className="btn-ghost" onClick={scrollTo("contact")}>
            Contact me
          </a>
        </motion.div>

        <motion.div {...fadeUp(1.3)} className="mt-5 lg:hidden">
          <Socials />
        </motion.div>
      </div>

      {/* ── Right rail (desktop): location, stats, socials ── */}
      <motion.div
        {...fadeUp(1.1)}
        className="absolute bottom-24 right-10 z-20 hidden max-w-[220px] flex-col items-end gap-6 text-right lg:flex xl:right-[max(2.5rem,calc((100vw-72rem)/2))]"
      >
        <p className="font-mono text-xs leading-relaxed text-white/50">
          Based in
          <br />
          <span className="text-white">{profile.location}</span>
        </p>
        <div className="flex gap-8">
          <div>
            <p className="font-display text-5xl font-medium leading-none text-white">{projectCount}+</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-white/50">Projects</p>
          </div>
          <div>
            <p className="font-display text-5xl font-medium leading-none text-white">{yearCount}+</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-white/50">Years</p>
          </div>
        </div>
        <Socials />
      </motion.div>

      <Ticker reduced={prefersReducedMotion} />
    </section>
  );
}
