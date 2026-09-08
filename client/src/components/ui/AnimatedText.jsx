import { motion } from "framer-motion";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.1 },
  },
};

const word = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Splits text into words and reveals them with a rising mask animation.
 * Intended for the hero headline — a single orchestrated load moment
 * rather than a scroll effect repeated on every element.
 */
export default function AnimatedText({ text, as: Tag = "h1", className = "" }) {
  const words = text.split(" ");

  return (
    <Tag className={className}>
      <motion.span
        variants={container}
        initial="hidden"
        animate="visible"
        className="inline"
        aria-label={text}
      >
        {words.map((w, i) => (
          <span key={i} className="mr-[0.28em] inline-block overflow-hidden align-bottom">
            <motion.span variants={word} className="inline-block" aria-hidden="true">
              {w}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
