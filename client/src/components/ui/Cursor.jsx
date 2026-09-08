import { useEffect, useRef, useState } from "react";
import { useMousePosition } from "../../hooks/useMousePosition";

/**
 * Elegant, minimal custom cursor for capable desktop pointers.
 * - A small dot tracks the raw pointer instantly.
 * - An outer ring trails behind with a short lerp for a bit of weight.
 * - State ("default" | "view" | "drag" | "hover") comes from two
 *   sources: DOM elements tagged data-cursor="view"/"drag" (detected
 *   via event delegation) and window "cursor-state" CustomEvents
 *   dispatched by the R3F scenes when the pointer is over a 3D object.
 *
 * Position updates happen in a rAF loop that writes directly to DOM
 * style, not React state, so hundreds of mousemoves per second never
 * trigger a re-render.
 */
export default function Cursor() {
  const mouse = useMousePosition();
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const ringPos = useRef({ x: 0, y: 0 });
  const [cursorState, setCursorState] = useState("default");

  useEffect(() => {
    document.documentElement.classList.add("custom-cursor-active");
    return () => document.documentElement.classList.remove("custom-cursor-active");
  }, []);

  useEffect(() => {
    function toClientX(x) {
      return ((x + 1) / 2) * window.innerWidth;
    }
    function toClientY(y) {
      return ((1 - y) / 2) * window.innerHeight;
    }

    let frame;
    function tick() {
      const targetX = toClientX(mouse.current.x);
      const targetY = toClientY(mouse.current.y);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }

      ringPos.current.x += (targetX - ringPos.current.x) * 0.18;
      ringPos.current.y += (targetY - ringPos.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mouse]);

  useEffect(() => {
    function onCursorState(e) {
      setCursorState(e.detail || "default");
    }

    function onPointerOver(e) {
      const target = e.target.closest?.("[data-cursor]");
      if (target) setCursorState(target.getAttribute("data-cursor"));
    }
    function onPointerOut(e) {
      const target = e.target.closest?.("[data-cursor]");
      if (target) setCursorState("default");
    }

    window.addEventListener("cursor-state", onCursorState);
    document.addEventListener("mouseover", onPointerOver);
    document.addEventListener("mouseout", onPointerOut);
    return () => {
      window.removeEventListener("cursor-state", onCursorState);
      document.removeEventListener("mouseover", onPointerOver);
      document.removeEventListener("mouseout", onPointerOut);
    };
  }, []);

  const ringSize = cursorState === "default" ? 32 : cursorState === "drag" ? 52 : 46;
  const ringLabel =
    cursorState === "view" ? "View" : cursorState === "drag" ? "Drag" : "";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-cyan transition-opacity duration-150"
        style={{ opacity: cursorState === "drag" ? 0 : 1 }}
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 flex items-center justify-center rounded-full border transition-[width,height,border-color,background-color] duration-200 ease-out"
        style={{
          width: ringSize,
          height: ringSize,
          borderColor: cursorState === "default" ? "rgba(232,236,244,0.35)" : "rgba(61,218,215,0.7)",
          backgroundColor:
            cursorState === "default" ? "transparent" : "rgba(61,218,215,0.08)",
        }}
      >
        {ringLabel && (
          <span className="font-mono text-[9px] uppercase tracking-wide text-cyan">
            {ringLabel}
          </span>
        )}
      </div>
    </div>
  );
}
