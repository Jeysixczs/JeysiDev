import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import { experience } from "../data/experience";

export default function Experience() {
  return (
    <section id="experience" className="relative border-t border-white/10 py-20 sm:py-28 lg:py-36">
      <div className="section-shell">
        <SectionHeading
          index="04"
          label="Experience"
          title="How I got here"
          description="Work and education, newest first."
        />

        <ul className="border-t border-white/10">
          {experience.map((item, i) => {
            const org = item.org ?? item.school;
            const sub = item.degree && item.degree !== item.title ? item.degree : null;
            return (
              <motion.li
                key={`${item.title}-${item.period}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group grid gap-4 border-b border-white/10 py-8 transition-colors duration-300 hover:bg-white/[0.03] sm:py-10 lg:grid-cols-[220px_1fr_1.1fr] lg:gap-10"
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50 lg:pt-2">
                  {item.period}
                </p>

                <div>
                  <h3 className="font-display text-2xl text-white sm:text-3xl">{item.title}</h3>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wide text-white/50">
                    <span className="text-white">{org}</span>
                    {sub && <span>{sub}</span>}
                    {item.type === "education" && (
                      <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px]">
                        Education
                      </span>
                    )}
                  </p>
                </div>

                <p className="max-w-prose text-base leading-relaxed text-white/55">{item.description}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
