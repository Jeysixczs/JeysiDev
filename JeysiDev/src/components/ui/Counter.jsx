import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

export default function Counter({ value, suffix = "", duration = 1.4 }) {
  const [display, setDisplay] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.4 });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}
