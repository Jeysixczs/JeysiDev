import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import SectionHeading from "./ui/SectionHeading";
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "./ui/icons";
import { certificates } from "../data/certificates";

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#131A2C'/><text x='50%' y='50%' fill='#525C75' font-family='monospace' font-size='14' text-anchor='middle'>certificate</text></svg>`
  );

const COUNT = certificates.length;

/**
 * Signed "step distance" of card `i` from the front-and-center slot,
 * given the continuous scroll `position` — e.g. -2, -1, 0, 1, 2 for a
 * 5-card deck. Wrapped to the nearest representative in
 * (-COUNT/2, COUNT/2] so every card always takes the shortest path
 * to its resting spot (2 slots left, 2 slots right of front) instead
 * of a true circular arrangement, where cards past ±90° would swing
 * back in toward the center and read as "missing" side cards.
 */
function cardOffset(i, position) {
  const raw = i - position;
  return raw - COUNT * Math.round(raw / COUNT);
}

/**
 * Geometry of the coverflow stage, tuned per breakpoint. `spacing` is
 * the horizontal distance (px) between adjacent card centers, `depth`
 * is how far back (px, along -z) each step away from center pushes a
 * card, `maxAngle` is the tilt a side card settles into, and
 * `visibleRange` is how many cards deep on each side of front stay
 * visible (2 = front + 2 left + 2 right).
 */
function useStageConfig() {
  const [config, setConfig] = useState({
    cardWidth: 300,
    stageHeight: 380,
    spacing: 170,
    maxAngle: 42,
    depth: 110,
    minScale: 0.62,
    visibleRange: 2,
  });

  useEffect(() => {
    const smQuery = window.matchMedia("(min-width: 640px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");

    function update() {
      if (lgQuery.matches) {
        setConfig({
          cardWidth: 300,
          stageHeight: 410,
          spacing: 190,
          maxAngle: 42,
          depth: 120,
          minScale: 0.64,
          visibleRange: 2,
        });
      } else if (smQuery.matches) {
        setConfig({
          cardWidth: 210,
          stageHeight: 330,
          spacing: 130,
          maxAngle: 40,
          depth: 90,
          minScale: 0.6,
          visibleRange: 2,
        });
      } else {
        setConfig({
          cardWidth: 150,
          stageHeight: 260,
          spacing: 82,
          maxAngle: 34,
          depth: 60,
          minScale: 0.56,
          visibleRange: 2,
        });
      }
    }

    update();
    smQuery.addEventListener("change", update);
    lgQuery.addEventListener("change", update);
    return () => {
      smQuery.removeEventListener("change", update);
      lgQuery.removeEventListener("change", update);
    };
  }, []);

  return config;
}

function CertificateFace({ certificate, activeStrength }) {
  return (
    <div className="relative h-full w-full">
      <div className="glass-panel-static flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10">
        <div className="aspect-[4/3] w-full overflow-hidden bg-surface-raised">
          <img
            src={certificate.image}
            alt=""
            className="h-full w-full object-cover"
            // No lazy-loading here: with loading="lazy" the browser
            // decides visibility from the element's *transformed*
            // bounding box, and this card is constantly spinning through
            // rotateY/translateZ — so mid-arc it can look "off-screen"
            // to the intersection check and get its image paused/resumed,
            // which reads as a blink on the side cards specifically.
            decoding="async"
            draggable={false}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 font-display text-sm leading-snug text-ink">
            {certificate.title}
          </h3>
          <p className="line-clamp-1 text-xs text-ink-muted">{certificate.issuer}</p>
          <span className="mt-auto pt-1 font-mono text-[11px] text-ink-faint">
            {certificate.date}
          </span>
        </div>
      </div>
      {/* Cyan glow overlay, crossfaded in/out with `activeStrength` rather
          than snapped on/off, so it stays in sync with the card's slide
          instead of jumping to the next card ahead of the animation. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan/40 shadow-glow"
        style={{ opacity: activeStrength }}
      />
    </div>
  );
}

function Card3D({ certificate, i, position, config, isFront, onFrontClick, onSideClick }) {
  const offset = useTransform(position, (latest) => cardOffset(i, latest));
  const absOffset = useTransform(offset, Math.abs);

  // Straight coverflow layout: each step left/right moves a full
  // `spacing` further out, so the front card always has exactly two
  // full slots visible on each side (for a 5-card deck) instead of a
  // circular arrangement where the far cards swing back toward center.
  const x = useTransform(offset, (o) => `calc(-50% + ${o * config.spacing}px)`);
  const z = useTransform(absOffset, (a) => -Math.min(a, config.visibleRange + 1) * config.depth);
  // Tilt ramps in over the first step, then holds steady for cards
  // further out — they just get smaller and sit further back instead
  // of tilting more.
  const rotateY = useTransform(offset, (o) => -Math.sign(o) * Math.min(Math.abs(o), 1) * config.maxAngle);
  const scale = useTransform(absOffset, (a) => {
    const t = Math.min(a / (config.visibleRange + 0.5), 1); // 0 at front, 1 at the edge of the visible range
    return 1 - (1 - config.minScale) * t;
  });
  // Cards past the visible range fade out (and stop intercepting
  // clicks/drag) over the last half-step, so growing the deck beyond
  // 5 certificates doesn't clutter the stage.
  const opacity = useTransform(absOffset, (a) =>
    Math.max(0, Math.min(1, config.visibleRange + 0.5 - a))
  );
  const pointerEvents = useTransform(absOffset, (a) => (a <= config.visibleRange + 0.5 ? "auto" : "none"));
  // Front-most card (closest to the viewer) always renders on top; the
  // `+ i` tiebreaker keeps ordering deterministic if two cards are ever
  // at the exact same depth, instead of it jittering frame to frame.
  const zIndex = useTransform(absOffset, (a) => Math.round((100 - a) * 10) + i);
  // Fully on at the front slot, fading out over the first quarter-step
  // as it slides off-center — tracks the physical slide instead of
  // toggling the instant `index` changes.
  const activeStrength = useTransform(offset, (o) => Math.max(1 - Math.abs(o) / 0.25, 0));

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        width: config.cardWidth,
        y: "-50%",
        x,
        z,
        rotateY,
        scale,
        opacity,
        zIndex,
        pointerEvents,
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <button
        type="button"
        data-cursor="view"
        onClick={() => (isFront ? onFrontClick() : onSideClick())}
        className="block h-full w-full text-left [touch-action:manipulation]"
      >
        <CertificateFace certificate={certificate} activeStrength={activeStrength} />
      </button>
    </motion.div>
  );
}

function CertificateViewer({ certificate, onClose, onPrev, onNext, hasMultiple }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-void/90 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 text-ink-muted transition-colors hover:text-ink sm:right-8 sm:top-8"
      >
        <CloseIcon />
      </button>

      {hasMultiple && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous certificate"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink sm:left-6"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next certificate"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink sm:right-6"
          >
            <ChevronRightIcon />
          </button>
        </>
      )}

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-raised"
      >
        <img
          src={certificate.image}
          alt={`${certificate.title} certificate`}
          className="max-h-[65vh] w-full object-contain"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />
        <div className="p-5">
          <h3 className="font-display text-lg text-ink">{certificate.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {certificate.issuer} &middot; {certificate.date}
          </p>
          {certificate.credentialUrl && (
            <a
              href={certificate.credentialUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-cyan hover:underline"
            >
              Verify credential
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Certificates() {
  const config = useStageConfig();

  // `index` is an unbounded integer — it just keeps counting up or down
  // as you spin past the end. The actual front card is always
  // ((index % COUNT) + COUNT) % COUNT, so the stack loops forever in
  // either direction with no start or end.
  const [index, setIndex] = useState(0);
  const position = useMotionValue(0);
  const dragStartRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const controls = animate(position, index, { type: "spring", stiffness: 260, damping: 30 });
    return () => controls.stop();
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const frontSlot = ((index % COUNT) + COUNT) % COUNT;

  function step(delta) {
    setIndex((i) => i + delta);
  }

  function goToSlot(slot) {
    // Shortest path around the loop to the requested card, rather than
    // always spinning forward.
    let delta = ((slot - frontSlot) % COUNT + COUNT) % COUNT;
    if (delta > COUNT / 2) delta -= COUNT;
    setIndex((i) => i + delta);
  }

  function handlePanStart() {
    setIsDragging(true);
    dragStartRef.current = position.get();
  }

  function handlePan(_, info) {
    position.set(dragStartRef.current - info.offset.x / config.spacing);
  }

  function handlePanEnd() {
    setIndex(Math.round(position.get()));
    setIsDragging(false);
  }

  const [openSlot, setOpenSlot] = useState(null);
  const isOpen = openSlot !== null;

  const canSlide = COUNT > 1;

  // Auto-advance every 3s. Pauses while the user is dragging or the
  // viewer modal is open, and restarts fresh 3s from any manual
  // navigation (index change) so it doesn't fight the user's input.
  useEffect(() => {
    if (!canSlide || isOpen || isDragging) return;
    const id = setInterval(() => {
      setIndex((i) => i + 1);
    }, 3000);
    return () => clearInterval(id);
  }, [canSlide, isOpen, isDragging, index]);

  function close() {
    setOpenSlot(null);
  }
  function prevInViewer() {
    setOpenSlot((s) => (s - 1 + COUNT) % COUNT);
  }
  function nextInViewer() {
    setOpenSlot((s) => (s + 1) % COUNT);
  }


  return (
    <section id="certificates" className="relative border-t border-white/[0.05] py-3 sm:py-28">
      <div className="section-shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            index="05"
            title="Certificates"
            description="Drag to spin through the stack in 3D — it loops forever. Tap the front card for a closer look."
          />

          {canSlide && (
            <div className="mb-14 hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous certificate"
                className="rounded-full border border-white/10 p-2 text-ink-muted transition-colors duration-200 hover:border-cyan/40 hover:text-cyan"
              >
                <ChevronLeftIcon width={16} height={16} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next certificate"
                className="rounded-full border border-white/10 p-2 text-ink-muted transition-colors duration-200 hover:border-cyan/40 hover:text-cyan"
              >
                <ChevronRightIcon width={16} height={16} />
              </button>
            </div>
          )}
        </div>

        <motion.div
          className="relative mx-auto max-w-full"
          style={{
            height: config.stageHeight,
            perspective: 1400,
            touchAction: "pan-y",
          }}
          onPanStart={canSlide ? handlePanStart : undefined}
          onPan={canSlide ? handlePan : undefined}
          onPanEnd={canSlide ? handlePanEnd : undefined}
        >
          {certificates.map((certificate, i) => (
            <Card3D
              key={certificate.id}
              certificate={certificate}
              i={i}
              position={position}
              config={config}
              isFront={i === frontSlot}
              onFrontClick={() => setOpenSlot(i)}
              onSideClick={() => goToSlot(i)}
            />
          ))}
        </motion.div>

        {canSlide && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {certificates.map((certificate, i) => (
              <button
                key={certificate.id}
                type="button"
                onClick={() => goToSlot(i)}
                aria-label={`Go to certificate ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 [touch-action:manipulation] ${
                  i === frontSlot ? "w-6 bg-cyan" : "w-1.5 bg-white/15 hover:bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <CertificateViewer
            certificate={certificates[openSlot]}
            onClose={close}
            onPrev={prevInViewer}
            onNext={nextInViewer}
            hasMultiple={COUNT > 1}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
