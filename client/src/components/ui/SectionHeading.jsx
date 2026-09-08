import { motion } from "framer-motion";

/**
 * `index` is a two-digit section marker (e.g. "02") — used because the
 * site sections genuinely are a numbered sequence a visitor scrolls through,
 * not decoration.
 */
export default function SectionHeading({ index, title, description, align = "left" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-14 flex flex-col gap-4 ${align === "center" ? "items-center text-center" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-cyan">{index}</span>
        <span className="h-px w-10 bg-surface-line" />
      </div>
      <h2 className="max-w-2xl font-display text-3xl font-medium text-ink sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-lg text-base text-ink-muted">{description}</p>
      )}
    </motion.div>
  );
}
