import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import TiltCard from "./ui/TiltCard";
import { skills } from "../data/skills";

const CATEGORY_COLORS = {
  Language: "#3DDAD7",
  Frontend: "#8B6BFF",
  Backend: "#FFB347",
  "3D / Graphics": "#3DDAD7",
  Tooling: "#8B6BFF",
  Database: "#FFB347",
};

function SkillCard({ skill, index }) {
  const color = CATEGORY_COLORS[skill.category] || "#3DDAD7";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
    >
      <TiltCard className="glass-panel-static h-full rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base text-ink">{skill.name}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              {skill.category}
            </p>
          </div>
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            aria-hidden="true"
          />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-muted">{skill.note}</p>
      </TiltCard>
    </motion.div>
  );
}

export default function Skills() {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(skills.map((skill) => skill.category)))],
    []
  );
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? skills
        : skills.filter((skill) => skill.category === activeCategory),
    [activeCategory]
  );

  return (
    <section id="skills" className="relative border-t border-white/[0.05] py-28">
      <div className="section-shell">
        <SectionHeading
          index="02"
          title="Tools I reach for"
          description="Filter by category to see where I go deep versus where I'm just comfortable."
        />

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors duration-200 [touch-action:manipulation] ${
                activeCategory === category
                  ? "border-cyan/60 bg-cyan/10 text-cyan"
                  : "border-white/10 text-ink-muted hover:border-white/25 hover:text-ink"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((skill, i) => (
              <SkillCard key={skill.name} skill={skill} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
