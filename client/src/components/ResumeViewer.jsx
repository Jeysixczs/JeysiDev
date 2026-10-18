import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { profile } from "../data/profile";
import {
  CloseIcon,
  DownloadIcon,
  ArrowUpRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./ui/icons";

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];
const MAX_PAGE_WIDTH = 820; // css px at 100% zoom, so it doesn't balloon on wide screens
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen resume viewer.
 *
 * Why pdf.js instead of an <iframe>/<object>: mobile browsers (iOS Safari
 * and most Android browsers) don't render embedded PDFs inline — you get
 * a blank box or only page 1. Drawing the pages onto canvases works the
 * same everywhere. pdf.js is imported dynamically, so none of it is
 * downloaded until someone actually opens the viewer.
 */
export default function ResumeViewer({ onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const scrollRef = useRef(null);
  const canvasRefs = useRef([]);

  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [zoomIndex, setZoomIndex] = useState(1);
  const [width, setWidth] = useState(0);
  const [linksByPage, setLinksByPage] = useState({});

  const zoom = ZOOM_STEPS[zoomIndex];

  // ── Modal behaviour: Esc to close, lock page scroll, trap + restore focus ──
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  // ── Load the PDF (pdf.js is code-split and only fetched here) ──
  useEffect(() => {
    let cancelled = false;
    let loadingTask;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        loadingTask = pdfjs.getDocument({ url: profile.resumeUrl });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setDoc(pdf);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, []);

  // ── Track the available width so pages fit the panel (and re-fit on rotate/resize) ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const styles = getComputedStyle(el);
      const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      setWidth(Math.min(el.clientWidth - padding, MAX_PAGE_WIDTH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Draw every page whenever the doc, panel width or zoom changes ──
  useEffect(() => {
    if (!doc || width <= 0) return;
    let cancelled = false;
    const renderTasks = [];

    (async () => {
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        if (cancelled) return;
        const canvas = canvasRefs.current[n - 1];
        if (!canvas) continue;

        const cssScale = (width * zoom) / page.getViewport({ scale: 1 }).width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: cssScale * dpr });
        const cssViewport = page.getViewport({ scale: cssScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;

        const task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
        renderTasks.push(task);
        try {
          await task.promise;
        } catch (err) {
          if (err?.name === "RenderingCancelledException") return;
          throw err;
        }
        if (cancelled) return;

        // Canvas pixels aren't clickable, so lay transparent anchors over
        // any link annotations from the PDF (email, GitHub, live demos…).
        const annotations = await page.getAnnotations();
        if (cancelled) return;
        const links = annotations
          .filter((a) => a.subtype === "Link" && a.url)
          .map((a) => {
            const [x1, y1, x2, y2] = cssViewport.convertToViewportRectangle(a.rect);
            return {
              url: a.url,
              left: Math.min(x1, x2),
              top: Math.min(y1, y2),
              width: Math.abs(x2 - x1),
              height: Math.abs(y2 - y1),
            };
          });
        setLinksByPage((prev) => ({ ...prev, [n]: links }));
      }
    })().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      renderTasks.forEach((t) => t.cancel());
    };
  }, [doc, width, zoom]);

  const zoomOut = useCallback(() => setZoomIndex((i) => Math.max(0, i - 1)), []);
  const zoomIn = useCallback(() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1)), []);

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white hover:bg-white hover:text-void disabled:pointer-events-none disabled:opacity-30 [touch-action:manipulation]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[90] flex items-stretch justify-center bg-void/90 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${profile.name} résumé`}
        initial={{ scale: 0.97, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-4xl flex-col overflow-hidden border-white/15 bg-surface sm:h-[92vh] sm:border"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Résumé</p>
            <p className="truncate font-display text-base text-white">
              John Carlo Aquino
              {doc && doc.numPages > 1 && (
                <span className="ml-2 font-mono text-xs text-white/40">{doc.numPages} pages</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={zoomOut}
                disabled={status !== "ready" || zoomIndex === 0}
                aria-label="Zoom out"
                className={iconBtn}
              >
                <ZoomOutIcon />
              </button>
              <span className="w-11 text-center font-mono text-xs tabular-nums text-white/50">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={status !== "ready" || zoomIndex === ZOOM_STEPS.length - 1}
                aria-label="Zoom in"
                className={iconBtn}
              >
                <ZoomInIcon />
              </button>
              <span className="mx-1 h-5 w-px bg-white/15" aria-hidden="true" />
            </div>

            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in a new tab"
              title="Open in a new tab"
              className={iconBtn}
            >
              <ArrowUpRightIcon width="18" height="18" />
            </a>
            <a
              href={profile.resumeUrl}
              download={profile.resumeFileName}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-3.5 font-display text-sm font-medium text-void transition-transform duration-300 hover:scale-[1.03] active:scale-[0.94] sm:px-5 [touch-action:manipulation]"
            >
              <DownloadIcon width="16" height="16" />
              <span className="hidden sm:inline">Download</span>
              <span className="sr-only sm:hidden">Download résumé</span>
            </a>
            <button ref={closeRef} onClick={onClose} aria-label="Close résumé" className={iconBtn}>
              <CloseIcon width="18" height="18" />
            </button>
          </div>
        </div>

        {/* Pages */}
        <div
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-auto bg-surface-raised p-3 sm:p-6"
        >
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center" role="status">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                Loading résumé…
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
              <p className="font-display text-lg text-white">Couldn&rsquo;t preview the résumé here.</p>
              <p className="text-sm text-white/60">
                You can still open or download the PDF directly.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  Open PDF
                </a>
                <a href={profile.resumeUrl} download={profile.resumeFileName} className="btn-light">
                  Download
                </a>
              </div>
            </div>
          )}

          {doc && (
            <div className="mx-auto flex w-fit flex-col gap-4">
              {Array.from({ length: doc.numPages }, (_, i) => (
                <div key={i} className="relative bg-white shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[i] = el;
                    }}
                    className="block"
                    aria-label={`Résumé page ${i + 1} of ${doc.numPages}`}
                  />
                  {(linksByPage[i + 1] || []).map((l, k) => (
                    <a
                      key={k}
                      href={l.url}
                      target={l.url.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      aria-label={l.url}
                      className="absolute"
                      style={{ left: l.left, top: l.top, width: l.width, height: l.height }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
