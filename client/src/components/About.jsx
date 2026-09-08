import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import Counter from "./ui/Counter";
import { profile } from "../data/profile";

export default function About() {
  return (
    <section id="about" className="relative border-t border-white/[0.05] py-3 sm:py-28">
      <div className="section-shell">
        <SectionHeading
          index="01"
          title="A developer who'd rather build the room than describe it."
        />

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[280px_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full max-w-[260px] lg:mx-0"
          >
            <div className="absolute -inset-3 rounded-3xl bg-signal-gradient opacity-20 blur-2xl" />
            <div className="glass-panel relative overflow-hidden rounded-3xl">
              <img
                src={profile.avatar}
                alt={`Portrait of ${profile.name}`}
                className="aspect-[4/5] w-full object-cover blur-[0.7px] transition-all duration-500"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </motion.div>

          <div>
            <div className="space-y-5">
              {profile.bio.map((paragraph, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="max-w-prose text-base leading-relaxed text-ink-muted sm:text-lg"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {profile.stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="border-l border-surface-line pl-4"
                >
                  <p className="font-display text-3xl font-medium text-ink sm:text-4xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
