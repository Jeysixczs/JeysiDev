import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import { services } from "../data/services";

/**
 * One list for every breakpoint. Each row inverts to white on hover — it's
 * the one interactive flourish in an otherwise static section.
 */
export default function Services() {
  return (
    <section id="services" className="relative border-t border-white/10 py-20 sm:py-28 lg:py-36">
      <div className="section-shell">
        <SectionHeading
          index="06"
          label="Services"
          title="What I can take off your plate"
          description="From a single interface component to the whole stack behind it."
        />

        <ul className="border-t border-white/10">
          {services.map((service, i) => (
            <motion.li
              key={service.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 4) * 0.05 }}
              className="group -mx-4 border-b border-white/10 px-4 transition-colors duration-300 hover:bg-white sm:-mx-6 sm:px-6"
            >
              <div className="grid items-baseline gap-3 py-7 sm:grid-cols-[56px_1fr] lg:grid-cols-[56px_minmax(0,1fr)_minmax(0,1.2fr)_240px] lg:gap-10">
                <span className="font-mono text-xs text-white/40 transition-colors duration-300 group-hover:text-void/50">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="font-display text-2xl text-white transition-colors duration-300 group-hover:text-void sm:text-3xl">
                  {service.title}
                </h3>

                <p className="text-base leading-relaxed text-white/55 transition-colors duration-300 group-hover:text-void/70 sm:col-start-2 lg:col-start-auto">
                  {service.description}
                </p>

                <ul className="flex flex-wrap gap-2 sm:col-start-2 lg:col-start-auto lg:max-w-[220px] lg:justify-end">
                  {service.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/20 px-2.5 py-1 font-mono text-[11px] text-white/60 transition-colors duration-300 group-hover:border-void/30 group-hover:text-void/70"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
