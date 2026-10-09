import { useMemo } from "react";
import SectionHeading from "./ui/SectionHeading";
import VelocityRow from "./ui/VelocityRow";
import { useDeviceCapability } from "../hooks/useDeviceCapability";
import { skills } from "../data/skills";

// Alternating rows scroll in opposite directions, and alternate between
// solid and outlined type, so the section reads as stacked lanes of
// poster typography rather than a flat strip of chips.
const ROW_COUNT = 3;
const BASE_SPEED = 1.2; // %/sec of one copy, constant — unaffected by scrolling

function SkillWord({ skill, outline }) {
  return (
    <span className="flex flex-none items-start gap-3 pr-10 sm:pr-16">
      <span
        className="font-display text-6xl font-bold uppercase leading-[1.05] tracking-tighter sm:text-8xl"
        style={
          outline
            ? { color: "transparent", WebkitTextStroke: "1.5px rgb(var(--c-fg) / 0.7)" }
            : { color: "rgb(var(--c-fg))" }
        }
      >
        {skill.name}
      </span>
      <sup className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 sm:mt-5">
        {skill.category}
      </sup>
    </span>
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
    <section id="skills" className="relative overflow-hidden border-t border-white/10 py-20 sm:py-28 lg:py-36">
      <div className="section-shell">
        <SectionHeading
          index="02"
          label="Skills"
          title="Tools I reach for"
          description="The languages, frameworks, and tools I use day to day."
        />
      </div>

      <div
        className="flex flex-col gap-2 sm:gap-4"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        {rows.map((row, i) => (
          <VelocityRow
            key={i}
            baseVelocity={i % 2 === 0 ? -BASE_SPEED : BASE_SPEED}
            paused={prefersReducedMotion}
          >
            {row.map((skill) => (
              <SkillWord key={skill.name} skill={skill} outline={i % 2 === 1} />
            ))}
          </VelocityRow>
        ))}
      </div>
    </section>
  );
}
