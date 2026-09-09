import { useMemo, useState, forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import TiltCard from "./ui/TiltCard";
import { skills } from "../data/skills";

// hex + "r,g,b" pair per category — hex feeds inline styles (dot, border
// glow), the rgb triplet feeds TiltCard's cursor-follow spotlight. Both are
// applied via inline style rather than Tailwind classes, since the color is
// data-driven and dynamic class names would get dropped by Tailwind's
// production purge.
const CATEGORY_META = {
  Language: { hex: "#3DDAD7", rgb: "61,218,215" },
  Frontend: { hex: "#8B6BFF", rgb: "139,107,255" },
  Backend: { hex: "#FFB347", rgb: "255,179,71" },
  "3D / Graphics": { hex: "#3DDAD7", rgb: "61,218,215" },
  Tooling: { hex: "#8B6BFF", rgb: "139,107,255" },
  Database: { hex: "#FFB347", rgb: "255,179,71" },
};
const DEFAULT_META = { hex: "#3DDAD7", rgb: "61,218,215" };

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: index * 0.03 },
  }),
  // No y offset and no stagger delay here — filtered-out cards should just
  // fade quickly where they already sit, while the surviving cards snap
  // into their new compact grid position at the same time (mode="popLayout"
  // on the parent AnimatePresence is what drives that instant realign).
  exit: { opacity: 0, transition: { duration: 0.15, delay: 0 } },
};

// Purely decorative bento rhythm: every 5th surviving card (by position in
// the currently-filtered list, not a fixed index into the full dataset)
// spans two columns on wider screens so the grid doesn't read as a flat,
// uniform sheet of chips. Re-evaluated against `i` on every filter change,
// so which tiles are "wide" shifts naturally as the list re-sorts.
function isWideSlot(i) {
  return i % 5 === 2;
}

const SkillCard = forwardRef(function SkillCard({ skill, index, wide }, ref) {
  const meta = CATEGORY_META[skill.category] || DEFAULT_META;
  const monogram = skill.name.replace(/[^A-Za-z0-9+#]/g, "").slice(0, 2).toUpperCase();

  return (
    <motion.div
      ref={ref}
      layout
      custom={index}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={wide ? "sm:col-span-2" : undefined}
    >
      <TiltCard spotlightColor={meta.rgb} className="h-full">
        <motion.div
          initial={{ borderColor: "rgba(255,255,255,0.06)" }}
          whileHover={{
            borderColor: `${meta.hex}66`,
            boxShadow: `0 16px 40px -20px ${meta.hex}66`,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="glass-panel-static relative h-full overflow-hidden rounded-2xl border p-5"
        >
          {/* Oversized initials sitting low-contrast in the corner — a
              typographic bento accent instead of a per-skill icon set,
              since the project has no icon library for these tools. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-3 -right-2 select-none font-display text-6xl font-medium text-white/[0.04] transition-colors duration-300 group-hover:text-white/[0.07]"
          >
            {monogram}
          </span>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-base text-ink">{skill.name}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                {skill.category}
              </p>
            </div>
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: meta.hex, boxShadow: `0 0 10px ${meta.hex}` }}
              aria-hidden="true"
            />
          </div>

          <p className="relative mt-3 text-xs leading-relaxed text-ink-muted">{skill.note}</p>
        </motion.div>
      </TiltCard>
    </motion.div>
  );
});

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
    <section id="skills" className="relative border-t border-white/[0.05] py-3 sm:py-28">
      <div className="section-shell">
        <SectionHeading
          index="02"
          title="Tools I reach for"
          description="Filter by category to see where I go deep versus where I'm just comfortable."
        />

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => {
            const count =
              category === "All" ? skills.length : skills.filter((s) => s.category === category).length;
            const active = activeCategory === category;
            return (
              <motion.button
                key={category}
                whileTap={{ scale: 0.92 }}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-xs transition-colors duration-200 [touch-action:manipulation] ${
                  active
                    ? "border-cyan/60 bg-cyan/10 text-cyan"
                    : "border-white/10 text-ink-muted hover:border-white/25 hover:text-ink"
                }`}
              >
                {category}
                <span className={active ? "text-cyan/60" : "text-ink-faint"}>{count}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.div layout className="relative grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((skill, i) => (
              <SkillCard key={skill.name} skill={skill} index={i} wide={isWideSlot(i)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
