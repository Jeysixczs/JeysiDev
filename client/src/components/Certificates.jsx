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
 * Shortest signed distance from a continuous position to card slot `i` on
 * a circle of size COUNT — e.g. with 6 cards, slot 0 is only +1 away from
 * position 5, not -5 away. This is what makes the carousel loop instead
 * of stopping at the first/last card.
 */
function circularOffset(i, position) {
  const raw = i - position;
  return raw - COUNT * Math.round(raw / COUNT);
}

/**
 * Geometry of the 3D stage, tuned per breakpoint. `spacing` is the
 * horizontal distance (px) between adjacent card centers, `depth` is how
 * far back (px, along -z) each step away from center pushes a card, and
 * `maxAngle` is the full tilt a side card settles into.
 */
function useStageConfig() {
  const [config, setConfig] = useState({
    cardWidth: 300,
    stageHeight: 380,
    spacing: 190,
    maxAngle: 42,
    depth: 150,
    visibleRange: 3,
  });

  useEffect(() => {
    const smQuery = window.matchMedia("(min-width: 640px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");

    function update() {
      if (lgQuery.matches) {
        setConfig({
          cardWidth: 300,
          stageHeight: 380,
          spacing: 190,
          maxAngle: 42,
          depth: 150,
          visibleRange: 3,
        });
      } else if (smQuery.matches) {
        setConfig({
          cardWidth: 250,
          stageHeight: 330,
          spacing: 150,
          maxAngle: 40,
          depth: 120,
          visibleRange: 2,
        });
      } else {
        setConfig({
          cardWidth: 208,
          stageHeight: 290,
          spacing: 108,
          maxAngle: 34,
          depth: 90,
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

function CertificateFace({ certificate, active }) {
  return (
    <div
      className={`glass-panel-static flex h-full w-full flex-col overflow-hidden rounded-2xl border transition-colors duration-300 ${
        active ? "border-cyan/40 shadow-glow" : "border-white/10"
      }`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-surface-raised">
        <img
          src={certificate.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
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
  );
}

function Card3D({ certificate, i, position, config, isFront, onFrontClick, onSideClick }) {
  const offset = useTransform(position, (latest) => circularOffset(i, latest));
  const x = useTransform(offset, (o) => `calc(-50% + ${o * config.spacing}px)`);
  const z = useTransform(offset, (o) => -Math.min(Math.abs(o), 3) * config.depth);
  const rotateY = useTransform(offset, (o) => {
    const direction = o > 0 ? -1 : o < 0 ? 1 : 0;
    return direction * Math.min(Math.abs(o), 1) * config.maxAngle;
  });
  const scale = useTransform(offset, (o) => Math.max(1 - Math.min(Math.abs(o), 3) * 0.14, 0.58));
  const opacity = useTransform(offset, (o) => {
    const fadeRange = config.visibleRange + 1;
    return Math.max(1 - Math.abs(o) / fadeRange, 0);
  });
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));

  const farAway = Math.abs(circularOffset(i, position.get())) > config.visibleRange + 1;

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
        pointerEvents: farAway ? "none" : "auto",
        transformStyle: "preserve-3d",
      }}
    >
      <button
        type="button"
        data-cursor="view"
        onClick={() => (isFront ? onFrontClick() : onSideClick())}
        className="block h-full w-full text-left [touch-action:manipulation]"
      >
        <CertificateFace certificate={certificate} active={isFront} />
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
    dragStartRef.current = position.get();
  }

  function handlePan(_, info) {
    position.set(dragStartRef.current - info.offset.x / config.spacing);
  }

  function handlePanEnd() {
    setIndex(Math.round(position.get()));
  }

  const [openSlot, setOpenSlot] = useState(null);
  const isOpen = openSlot !== null;

  function close() {
    setOpenSlot(null);
  }
  function prevInViewer() {
    setOpenSlot((s) => (s - 1 + COUNT) % COUNT);
  }
  function nextInViewer() {
    setOpenSlot((s) => (s + 1) % COUNT);
  }

  const canSlide = COUNT > 1;

  return (
    <section id="certificates" className="relative border-t border-white/[0.05] py-28">
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
