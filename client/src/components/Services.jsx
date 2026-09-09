import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import TiltCard from "./ui/TiltCard";
import { services } from "../data/services";

function ServiceCard({ service }) {
  return (
    <TiltCard
      className={`glass-panel h-full rounded-3xl p-6 ${
        service.size === "lg" ? "sm:p-9" : "sm:p-7"
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
  );
}

export default function Services() {
  return (
    <section id="services" className="relative border-t border-white/[0.05] py-3 sm:py-28">
      <div className="section-shell">
        <SectionHeading
          index="06"
          title="What I can take off your plate"
          description="From a single interface component to the whole stack behind it."
        />

        {/* Phone: swipeable, snap-scrolling carousel — one card front and
           center at a time, instead of a stacked or paired grid. */}
        <div className="relative -mx-6 sm:hidden">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="w-[82%] flex-shrink-0 snap-center first:ml-0"
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-void to-transparent" />
        </div>

        {/* Tablet & up: original bento grid */}
        <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={service.size === "lg" ? "sm:col-span-2 lg:col-span-2" : "lg:col-span-1"}
            >
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
