import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import TiltCard from "./ui/TiltCard";
import { services } from "../data/services";

export default function Services() {
  return (
    <section id="services" className="relative border-t border-white/[0.05] py-3 sm:py-28">
      <div className="section-shell">
        <SectionHeading
          index="06"
          title="What I can take off your plate"
          description="From a single interface component to the whole stack behind it."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={service.size === "lg" ? "sm:col-span-2 lg:col-span-2" : "lg:col-span-1"}
            >
              <TiltCard
                className={`glass-panel h-full rounded-3xl p-7 ${
                  service.size === "lg" ? "sm:p-9" : ""
                }`}
              >
                <h3
                  className={`font-display text-ink ${
                    service.size === "lg" ? "text-2xl sm:text-3xl" : "text-xl"
                  }`}
                >
                  {service.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
                  {service.description}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-ink-faint"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
