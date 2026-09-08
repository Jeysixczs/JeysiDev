import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import { experience } from "../data/experience";

export default function Experience() {
  return (
    <section id="experience" className="relative border-t border-white/[0.05] py-28">
      <div className="section-shell">
        <SectionHeading
          index="04"
          title="How I got here"
          description="Work and education, in order — the rail on the left fills in as you scroll."
        />

        <div className="relative">
          <div className="absolute bottom-0 left-[7px] top-2 w-px bg-surface-line sm:left-[9px]" />
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ originY: 0 }}
            className="absolute bottom-0 left-[7px] top-2 w-px bg-signal-gradient sm:left-[9px]"
          />

          <ul className="space-y-12">
            {experience.map((item, i) => (
              <motion.li
                key={`${item.title}-${item.period}`}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="relative pl-8 sm:pl-10"
              >
                <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-cyan bg-void sm:h-[19px] sm:w-[19px]" />

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-display text-lg text-ink sm:text-xl">{item.title}</h3>
                  <span className="text-sm text-cyan">{item.org}</span>
                  <span className="font-mono text-xs text-ink-faint">{item.period}</span>
                  {item.type === "education" && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-ink-faint">
                      Education
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-muted sm:text-base">
                  {item.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
