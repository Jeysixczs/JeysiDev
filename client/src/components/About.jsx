import { motion } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import Counter from "./ui/Counter";
import { profile } from "../data/profile";

// Counts come straight from the public folder: drop a new image into
// public/projects or public/certificates and the tile updates on rebuild.
// (Non-eager glob: only the file list is read, nothing is bundled.)
const countFiles = (files) => Object.keys(files).filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f)).length;
const projectCount = countFiles(import.meta.glob("/public/projects/*"));
const certificateCount = countFiles(import.meta.glob("/public/certificates/*"));

const liveValues = {
  "Shipped projects": projectCount,
  "Certifications earned": certificateCount,
};

export default function About() {
  const [lead, ...rest] = profile.bio;
  const stats = profile.stats.map((s) => ({ ...s, value: liveValues[s.label] ?? s.value }));

  return (
    <section id="about" className="relative border-t border-white/10 py-20 sm:py-28 lg:py-36">
      <div className="section-shell">
        <SectionHeading
          index="01"
          label="About"
          title="A developer who'd rather build the room than describe it."
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-20">
          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[300px] self-start lg:sticky lg:top-28 lg:mx-0 lg:max-w-none"
          >
            {/* Offset hairline frame behind the photo */}
            <div className="absolute inset-0 translate-x-3 translate-y-3 border border-white/25" aria-hidden="true" />
            <img
              src={profile.avatar}
              alt={`Portrait of ${profile.name}`}
              className="relative aspect-[4/5] w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <figcaption className="relative mt-6 flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
              <span>John Carlo Aquino</span>
              <span>PH</span>
            </figcaption>
          </motion.figure>

          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="font-display text-2xl leading-snug text-white sm:text-3xl"
            >
              {lead}
            </motion.p>

            <div className="mt-8 space-y-5">
              {rest.map((paragraph, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                  className="max-w-prose text-base leading-relaxed text-white/55 sm:text-lg"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <div className="mt-16 grid grid-cols-2 border-l border-t border-white/10 sm:grid-cols-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="border-b border-r border-white/10 p-5 sm:p-6"
                >
                  <p className="font-display text-5xl font-medium leading-none text-white">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase leading-snug tracking-wide text-white/50">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
