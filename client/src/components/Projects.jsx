import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import TiltCard from "./ui/TiltCard";
import { ArrowUpRightIcon, GithubIcon } from "./ui/icons";
import { projects } from "../data/projects";

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

export default function Projects() {
  return (
    <section id="projects" className="relative border-t border-white/[0.05] py-28">
      <div className="section-shell">
        <SectionHeading
          index="03"
          title="Selected work"
          description="A handful of projects that show the range — from real-time 3D to plain, dependable CRUD."
        />

        <div>
          {projects.map((project, i) => (
            <ProjectRow key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
