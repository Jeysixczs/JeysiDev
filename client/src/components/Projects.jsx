import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import TiltCard from "./ui/TiltCard";
import { ArrowUpRightIcon, GithubIcon, ChevronLeftIcon, ChevronRightIcon } from "./ui/icons";
import { projects } from "../data/projects";

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250'><rect width='100%' height='100%' fill='#131A2C'/><text x='50%' y='50%' fill='#525C75' font-family='monospace' font-size='14' text-anchor='middle'>preview</text></svg>`
  );

function ProjectRow({ project, index }) {
  const reversed = index % 2 === 1;
  const number = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={`grid grid-cols-1 items-center gap-8 py-14 first:pt-0 sm:gap-10 lg:grid-cols-2 lg:gap-16 ${
        index !== 0 ? "border-t border-white/[0.05]" : ""
      }`}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, x: reversed ? 40 : -40 },
          visible: { opacity: 1, x: 0 },
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={reversed ? "lg:order-2" : "lg:order-1"}
      >
        <TiltCard className="glass-panel h-full rounded-3xl p-3">
          <div className="overflow-hidden rounded-2xl bg-surface-raised">
            <img
              src={project.image}
              alt={`${project.title} preview`}
              className="aspect-[16/10] w-full object-cover transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  "data:image/svg+xml;utf8," +
                  encodeURIComponent(
                    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250'><rect width='100%' height='100%' fill='#131A2C'/><text x='50%' y='50%' fill='#525C75' font-family='monospace' font-size='14' text-anchor='middle'>preview</text></svg>`
                  );
              }}
            />
          </div>
        </TiltCard>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, x: reversed ? -40 : 40 },
          visible: { opacity: 1, x: 0 },
        }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className={reversed ? "lg:order-1" : "lg:order-2"}
      >
        <span className="eyebrow-index">{number}</span>
        <h3 className="mt-3 font-display text-2xl text-ink sm:text-3xl">{project.title}</h3>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-muted">
          {project.description}
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <li
              key={t}
              className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-ink-faint"
            >
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-center gap-5">
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            data-cursor="view"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-cyan"
          >
            <GithubIcon width={16} height={16} /> Code
          </a>
          <a
            href={project.demo}
            target="_blank"
            rel="noreferrer"
            data-cursor="view"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-cyan"
          >
            Live demo <ArrowUpRightIcon />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Mobile-only "peek" carousel: full-bleed, swipeable project cards with an
 * oversized ghost index number as the card's signature motif (a blown-up
 * take on the `.eyebrow-index` mark used everywhere else on the site).
 * The next card always peeks in at the edge as a swipe affordance, and an
 * IntersectionObserver (rather than measuring scroll offsets by hand)
 * tracks which card is centered so the dots below stay in sync however
 * wide the viewport ends up being.
 */
function MobileProjectCard({ project, index, cardRef }) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={cardRef}
      data-index={index}
      className="w-[62%] shrink-0 snap-center first:ml-6 last:mr-6 sm:w-[46%] sm:first:ml-8 sm:last:mr-8"
    >
      <TiltCard className="glass-panel relative flex h-full flex-col overflow-hidden rounded-2xl">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 right-2 select-none font-display text-[3.25rem] leading-none text-white/[0.06]"
        >
          {number}
        </span>

        <div className="overflow-hidden bg-surface-raised">
          <img
            src={project.image}
            alt={`${project.title} preview`}
            className="aspect-[16/11] w-full object-cover"
            loading="lazy"
            draggable={false}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
          />
        </div>

        <div className="relative flex flex-1 flex-col p-3.5">
          <span className="eyebrow-index text-[10px]">{number}</span>
          <h3 className="mt-1.5 font-display text-sm leading-snug text-ink">{project.title}</h3>
          <p className="mt-1.5 flex-1 line-clamp-3 text-xs leading-relaxed text-ink-muted">
            {project.description}
          </p>

          <ul className="mt-3 flex flex-wrap gap-1">
            {project.tech.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-ink-faint"
              >
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-3.5 border-t border-white/[0.05] pt-3">
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              data-cursor="view"
              className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-cyan"
            >
              <GithubIcon width={13} height={13} /> Code
            </a>
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                data-cursor="view"
                className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-cyan"
              >
                Live demo <ArrowUpRightIcon width={12} height={12} />
              </a>
            )}
          </div>
        </div>
      </TiltCard>
    </div>
  );
}

function ProjectCarousel() {
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const [active, setActive] = useState(0);
  const count = projects.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActive(Number(entry.target.dataset.index));
          }
        });
      },
      { root: track, threshold: [0.6] }
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function goTo(i) {
    const el = cardRefs.current[i];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function step(delta) {
    goTo(Math.min(count - 1, Math.max(0, active + delta)));
  }

  return (
    <div className="lg:hidden">
      <div
        ref={trackRef}
        className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-8 [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project, i) => (
          <MobileProjectCard
            key={project.id}
            project={project}
            index={i}
            cardRef={(el) => (cardRefs.current[i] = el)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={active === 0}
          aria-label="Previous project"
          className="rounded-full border border-white/10 p-2 text-ink-muted transition-colors duration-200 hover:border-cyan/40 hover:text-cyan disabled:opacity-30 [touch-action:manipulation]"
        >
          <ChevronLeftIcon width={16} height={16} />
        </button>

        <div className="flex items-center gap-2">
          {projects.map((project, i) => (
            <button
              key={project.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to project ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 [touch-action:manipulation] ${
                i === active ? "w-6 bg-cyan" : "w-1.5 bg-white/15 hover:bg-white/30"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={active === count - 1}
          aria-label="Next project"
          className="rounded-full border border-white/10 p-2 text-ink-muted transition-colors duration-200 hover:border-cyan/40 hover:text-cyan disabled:opacity-30 [touch-action:manipulation]"
        >
          <ChevronRightIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="relative border-t border-white/[0.05] py-3 sm:py-28">
      <div className="section-shell">
        <SectionHeading
          index="03"
          title="Projects"
          description="A handful of projects that show the range — from real-time 3D to plain, dependable CRUD."
        />

        <ProjectCarousel />

        <div className="hidden lg:block">
          {projects.map((project, i) => (
            <ProjectRow key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
