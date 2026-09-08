import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";

/**
 * Aurora — a full-viewport, reactbits.dev-style animated aurora background.
 *
 * A tiny WebGL (OGL) fragment shader drifts a few noise-driven light
 * ribbons across the canvas and blends them through `colorStops`, the
 * same look and prop shape as reactbits.dev's Aurora background
 * (https://reactbits.dev), re-implemented here to match this project's
 * palette and to respect its device-capability / reduced-motion hooks
 * instead of always running at full tilt.
 *
 * Props:
 * - colorStops: [start, mid, end] hex colors for the gradient ribbons
 * - amplitude:  how tall/energetic the ribbons are (default 1.0)
 * - blend:      overall glow intensity, 0–1 (default 0.55)
 * - speed:      time multiplier for the drift (default 1.0)
 * - paused:     when true, renders one static frame and stops the RAF loop
 */

const VERTEX_SHADER = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAmplitude;
  uniform float uBlend;
  uniform vec2 uResolution;
  uniform vec3 uColorStops[3];

  varying vec2 vUv;

  // 2D simplex noise (Ashima Arts / Stefan Gustavson) — standard, widely
  // reused utility function for generating organic drift.
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec3 stopsGradient(float t) {
    t = clamp(t, 0.0, 1.0);
    if (t < 0.5) {
      return mix(uColorStops[0], uColorStops[1], t * 2.0);
    }
    return mix(uColorStops[1], uColorStops[2], (t - 0.5) * 2.0);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    float ribbons = 0.0;
    float colorMix = uv.y;

    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float freq = 1.4 + fi * 0.55;
      float n = snoise(vec2(uv.x * freq * aspect * 0.28, uTime * 0.045 + fi * 12.9));
      float baseline = 0.72 - fi * 0.16;
      float band = baseline + n * uAmplitude * 0.22;
      float dist = abs(uv.y - band);
      float ribbon = smoothstep(0.22, 0.0, dist) * (0.62 - fi * 0.12);
      ribbons += ribbon;
      colorMix += n * 0.12;
    }

    vec3 color = stopsGradient(colorMix);
    float glow = clamp(ribbons, 0.0, 1.0) * uBlend;

    float vignette = smoothstep(1.15, 0.15, length(uv - vec2(0.5, 0.42)) * 1.3);
    float alpha = glow * vignette;

    gl_FragColor = vec4(color * (0.6 + glow), alpha);
  }
`;

export default function Aurora({
  colorStops = ["#3DDAD7", "#8B6BFF", "#3DDAD7"],
  amplitude = 1.0,
  blend = 0.55,
  speed = 1.0,
  paused = false,
  className = "",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) });
    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uBlend: { value: blend },
        uResolution: { value: [1, 1] },
        uColorStops: {
          value: colorStops.map((hex) => {
            const { r, g, b } = new Color(hex);
            return [r, g, b];
          }),
        },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const width = container.offsetWidth || 1;
      const height = container.offsetHeight || 1;
      // Re-read devicePixelRatio on every resize, not just at mount —
      // browser zoom changes the CSS pixel size of the container (which
      // ResizeObserver picks up) but the *actual* devicePixelRatio moves
      // in the opposite direction. Using the stale dpr captured at mount
      // meant zooming out kept multiplying a growing width by a now too
      // high dpr, ballooning the real WebGL backing-buffer resolution
      // (and the fragment-shader cost) well past what zoom level needed.
      renderer.dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let rafId;
    let elapsed = 0;
    let lastTimestamp = performance.now();

    function frame(timestamp) {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      elapsed += delta * speed;
      program.uniforms.uTime.value = elapsed;
      renderer.render({ scene: mesh });
      if (!paused) rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    // Render one extra static frame when paused so reduced-motion users
    // still see the aurora, just not animating.
    if (paused) renderer.render({ scene: mesh });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      const loseContext = gl.getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    };
    // colorStops/amplitude/blend/speed intentionally read once per mount;
    // this background doesn't need to react to prop changes after init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return <div ref={containerRef} className={`h-full w-full ${className}`} aria-hidden="true" />;
}
