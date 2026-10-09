import { motion } from "framer-motion";

/**
 * Editorial section header: a mono "(01) LABEL ———" rule above a large
 * display title. `index` is a two-digit marker because the sections really
 * are a numbered sequence a visitor scrolls through, not decoration.
 */
export default function SectionHeading({ index, label, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 sm:mb-16"
    >
      <div
        className={`flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-white/50`}
      >
        <span>({index})</span>
        <span>{label}</span>
        <span className={`h-px flex-1 bg-white/15`} />
      </div>
      <h2
        className={`mt-8 max-w-4xl font-display text-4xl font-medium leading-[1.05] sm:text-6xl text-white`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-6 max-w-lg text-base sm:text-lg text-white/55`}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
