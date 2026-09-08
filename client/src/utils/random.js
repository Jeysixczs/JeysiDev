/**
 * Deterministic pseudo-random generator (mulberry32). Given the same
 * seed it always returns the same sequence, so "randomized" object
 * placement/speeds stay stable across re-renders and reloads instead of
 * reshuffling every time Math.random() would be called.
 */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convenience: seeded float in [min, max). */
export function seededRange(rng, min, max) {
  return min + rng() * (max - min);
}
