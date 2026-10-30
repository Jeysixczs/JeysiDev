import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import { ArrowUpRightIcon, GithubIcon, ChevronLeftIcon, ChevronRightIcon } from "./ui/icons";
import { projects } from "../data/projects";

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250'><rect width='100%' height='100%' fill='#808aa0' fill-opacity='.15'/><text x='50%' y='50%' fill='#808aa0' font-family='monospace' font-size='14' text-anchor='middle'>preview</text></svg>`
  );

const outline = { color: "transparent", WebkitTextStroke: "1.5px rgb(var(--c-fg) / 0.55)" };

function ProjectRow({ project, index }) {
  const reversed = index % 2 === 1;
  const number = String(index + 1).padStart(2, "0");

  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="group grid grid-cols-1 items-stretch gap-10 border-t border-white/10 py-14 lg:grid-cols-12 lg:gap-14"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`lg:col-span-7 ${reversed ? "lg:order-2" : ""}`}
      >
        <div className="relative overflow-hidden border border-white/10 bg-surface">
          <img
            src={project.image}
            alt={`${project.title} preview`}
            className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
          />
        </div>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={`flex flex-col justify-between gap-8 lg:col-span-5 ${reversed ? "lg:order-1" : ""}`}
      >
        <span
          aria-hidden="true"
          className="font-display text-8xl font-bold leading-none tracking-tighter xl:text-9xl"
          style={outline}
        >
          {number}
        </span>

        <div>
          <h3 className="font-display text-3xl text-white sm:text-4xl">{project.title}</h3>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">{project.description}</p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/20 px-3 py-1 font-mono text-[11px] text-white/60"
              >
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noreferrer" className="btn-light !px-5 !py-2.5">
                Live demo <ArrowUpRightIcon width={16} height={16} />
              </a>
            )}
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer" className="btn-ghost !px-5 !py-2.5">
                <GithubIcon width={16} height={16} /> Code
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}

/**
 * Mobile-only "peek" carousel: full-bleed, swipeable project cards with an
 * oversized outlined index number. The next card always peeks in at the
 * edge as a swipe affordance, and an IntersectionObserver (rather than
 * measuring scroll offsets by hand) tracks which card is centered so the
 * dots below stay in sync however wide the viewport ends up being.
 */
function MobileProjectCard({ project, index, cardRef }) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={cardRef}
      data-index={index}
      className="w-[72%] shrink-0 snap-center first:ml-6 last:mr-6 sm:w-[46%] sm:first:ml-8 sm:last:mr-8"
    >
      <article className="relative flex h-full flex-col overflow-hidden border border-white/10 bg-white/[0.02]">
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

        <div className="relative flex flex-1 flex-col p-4">
          <span
            aria-hidden="true"
            className="absolute right-3 top-2 select-none font-display text-5xl font-bold leading-none"
            style={outline}
          >
            {number}
          </span>
          <h3 className="mt-8 pr-12 font-display text-lg leading-snug text-white">{project.title}</h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-white/55">
            {project.description}
          </p>

          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.tech.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/20 px-2 py-0.5 font-mono text-[10px] text-white/60"
              >
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3 text-sm">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-white/60 transition-colors hover:text-white"
              >
                <GithubIcon width={14} height={14} /> Code
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-white transition-opacity hover:opacity-70"
              >
                Live demo <ArrowUpRightIcon width={13} height={13} />
              </a>
            )}
          </div>
        </div>
      </article>
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
          className="rounded-full border border-white/20 p-2 text-white/70 transition-colors duration-200 hover:border-white hover:text-white disabled:opacity-30 [touch-action:manipulation]"
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
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={active === count - 1}
          aria-label="Next project"
          className="rounded-full border border-white/20 p-2 text-white/70 transition-colors duration-200 hover:border-white hover:text-white disabled:opacity-30 [touch-action:manipulation]"
        >
          <ChevronRightIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="relative border-t border-white/10 py-20 sm:py-28 lg:py-36">
      <div className="section-shell">
        <SectionHeading
          index="03"
          label="Projects"
          title="Selected work"
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
