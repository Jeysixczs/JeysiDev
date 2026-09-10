import { useMemo } from "react";
import SectionHeading from "./ui/SectionHeading";
import VelocityRow from "./ui/VelocityRow";
import { useDeviceCapability } from "../hooks/useDeviceCapability";
import { skills } from "../data/skills";

// hex feeds the little category dot on each chip.
const CATEGORY_META = {
  Language: { hex: "#3DDAD7" },
  Frontend: { hex: "#8B6BFF" },
  Backend: { hex: "#FFB347" },
  "3D / Graphics": { hex: "#3DDAD7" },
  Tooling: { hex: "#8B6BFF" },
  Database: { hex: "#FFB347" },
};
const DEFAULT_META = { hex: "#3DDAD7" };

// How many marquee rows to lay the skills into. Alternating rows scroll
// in opposite resting directions (row 0 left, row 1 right, row 2 left,
// ...) so the section reads as a stack of counter-moving lanes rather
// than one flat strip.
const ROW_COUNT = 4 ;
const BASE_SPEED = 1; // px/sec, constant — unaffected by scrolling

function SkillChip({ skill }) {
  const meta = CATEGORY_META[skill.category] || DEFAULT_META;
  return (
    <div className="glass-panel-static mx-2 flex flex-none items-center gap-2.5 rounded-full border px-5 py-2.5">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: meta.hex, boxShadow: `0 0 8px ${meta.hex}` }}
        aria-hidden="true"
      />
      <span className="font-display text-sm text-ink">{skill.name}</span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        {skill.category}
      </span>
    </div>
  );
}

export default function Skills() {
  const { prefersReducedMotion } = useDeviceCapability();

  // Round-robin the full list into rows so each lane stays evenly
  // populated rather than chunked into contiguous blocks.
  const rows = useMemo(() => {
    const buckets = Array.from({ length: ROW_COUNT }, () => []);
    skills.forEach((skill, i) => buckets[i % ROW_COUNT].push(skill));
    return buckets.filter((row) => row.length > 0);
  }, []);

  return (
    <section id="skills" className="relative border-t border-white/[0.05] py-3 sm:py-28">
      <div className="section-shell">
        <SectionHeading
          index="02"
          title="Tools I reach for"
          description="The languages, frameworks, and tools I use day to day."
        />

        <div
          className="-mx-6 flex flex-col gap-4 sm:-mx-8 lg:-mx-10"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          {rows.map((row, i) => (
            <VelocityRow
              key={i}
              baseVelocity={i % 2 === 0 ? -BASE_SPEED : BASE_SPEED}
              paused={prefersReducedMotion}
            >
              {row.map((skill) => (
                <SkillChip key={skill.name} skill={skill} />
              ))}
            </VelocityRow>
          ))}
        </div>
      </div>
    </section>
  );
}
