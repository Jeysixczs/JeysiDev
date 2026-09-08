import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

/**
 * Orb — a small, reactbits.dev-style animated orb
 * (https://reactbits.dev/backgrounds/orb), re-implemented here with the
 * same OGL/WebGL approach as `Aurora.jsx` instead of the old Three.js /
 * react-three-fiber version. That version pulled in three.js + fiber +
 * drei (~600kb) and ran a full React-reconciled scene graph just to spin
 * two wireframe icosahedrons, which is what made it stutter on anything
 * but a fast desktop GPU.
 *
 * This version is a single fullscreen-triangle shader that raymarches
 * one noise-distorted sphere. It only costs one small WebGL context and:
 * - stops its render loop entirely while scrolled off-screen
 *   (IntersectionObserver)
 * - renders a single static frame under prefers-reduced-motion
 * - caps devicePixelRatio on low-power devices
 * - tears its GL context down completely on unmount
 *
 * Props (mirroring reactbits.dev's Orb):
 * - hue:             rotation in degrees (0-360) away from the built-in
 *                    violet/cyan base color below — 0 is that base color
 *                    itself, not "red" as in standard HSL
 * - hoverIntensity:  how strongly the surface warps toward the pointer, 0-1
 * - rotateOnHover:   whether hovering speeds up the idle spin
 * - forceHoverState: keep the hover effect always-on (e.g. touch devices)
 * - lowPower:        cap dpr/step count further for weaker devices
 * - paused:          skip the RAF loop and render one static frame
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
  uniform vec2 uResolution;
  uniform float uHue;
  uniform float uHoverIntensity;
  uniform float uHoverActive;
  uniform vec2 uHoverPos;
  uniform float uRotateOnHover;
  uniform int uSteps;

  varying vec2 vUv;

  // Ashima Arts / Stefan Gustavson 3D simplex noise — standard, widely
  // reused utility for organic surface distortion.
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(vec4(i, 0.0)).xyz;
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Standard RGB hue-rotation matrix so a single base color can sweep the
  // full spectrum from one hue uniform.
  mat3 hueRotation(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    mat3 luma = mat3(0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114);
    mat3 cosPart = mat3(0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.300, -0.588, 0.886);
    mat3 sinPart = mat3(0.168, 0.330, -0.497, -0.328, 0.035, 0.292, 1.250, -1.050, -0.203);
    return luma + cosPart * c + sinPart * s;
  }

  float sdSphere(vec3 p, float r) { return length(p) - r; }

  float map(vec3 p, vec3 warp) {
    float n = snoise((p + warp) * 1.7 + vec3(0.0, 0.0, uTime * 0.12));
    return sdSphere(p, 1.0 + n * 0.16);
  }

  vec3 calcNormal(vec3 p, vec3 warp) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
      map(p + e.xyy, warp) - map(p - e.xyy, warp),
      map(p + e.yxy, warp) - map(p - e.yxy, warp),
      map(p + e.yyx, warp) - map(p - e.yyx, warp)
    ));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);

    vec3 ro = vec3(0.0, 0.0, 3.1);
    vec3 rd = normalize(vec3(uv, -1.6));

    float spin = uTime * (0.16 + uRotateOnHover * uHoverActive * 0.35);
    float ca = cos(spin);
    float sa = sin(spin);
    ro.xz = mat2(ca, -sa, sa, ca) * ro.xz;
    rd.xz = mat2(ca, -sa, sa, ca) * rd.xz;

    vec3 warp = vec3(uHoverPos * uHoverIntensity * uHoverActive * 0.6, 0.0);

    float t = 0.0;
    vec3 p = ro;
    vec3 pMin = ro;
    float tMin = 0.0;
    float minDist = 1e5;
    bool hit = false;
    for (int i = 0; i < 56; i++) {
      if (i >= uSteps) break;
      p = ro + rd * t;
      float d = map(p, warp);
      if (d < minDist) {
        minDist = d;
        pMin = p;
        tMin = t;
      }
      if (d < 0.0015) { hit = true; break; }
      t += d;
      if (t > 6.0) break;
    }

    // Approximate world-space size of one screen pixel at this ray
    // distance, used to soften the raymarched silhouette over ~1-1.5
    // pixels instead of a hard hit/miss cutoff — that hard cutoff is
    // what made the orb's edge look jagged/pixelated, since regular
    // MSAA/antialiasing never touches alpha computed inside a fragment
    // shader (there's no extra triangle edge here for it to smooth).
    float pixelWorldSize = (2.0 / max(uResolution.y, 1.0)) * max(tMin, 1.0);
    float edgeWidth = max(pixelWorldSize * 1.5, 0.0025);
    float coverage = hit ? 1.0 : 1.0 - smoothstep(0.0, edgeWidth, minDist);

    vec3 surfaceColor = vec3(0.0);
    if (coverage > 0.0) {
      vec3 n = calcNormal(pMin, warp);
      vec3 lightDir = normalize(vec3(0.6, 0.7, 0.8));
      float diff = max(dot(n, lightDir), 0.0);
      float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 2.2);

      vec3 base = hueRotation(radians(uHue)) * vec3(0.52, 0.34, 0.92);
      surfaceColor = base * (0.22 + diff * 0.55) + fresnel * (base + 0.45);
    }

    float glow = 0.055 / (0.055 + pow(length(uv), 2.3));
    vec3 bgBase = hueRotation(radians(uHue)) * vec3(0.30, 0.5, 0.95);
    vec3 bgColor = bgBase * glow * 0.6;
    float bgAlpha = clamp(glow * 0.7, 0.0, 1.0);

    vec3 color = mix(bgColor, surfaceColor, coverage);
    float alpha = mix(bgAlpha, 1.0, coverage);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function Orb({
  hue = 0,
  hoverIntensity = 0.35,
  rotateOnHover = true,
  forceHoverState = false,
  lowPower = false,
  paused = false,
  className = "",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const maxDpr = lowPower ? 1 : 1.5;
    const renderer = new Renderer({ alpha: true, antialias: !lowPower, dpr: Math.min(window.devicePixelRatio, maxDpr) });
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
        uResolution: { value: [1, 1] },
        uHue: { value: hue },
        uHoverIntensity: { value: hoverIntensity },
        uHoverActive: { value: forceHoverState ? 1 : 0 },
        uHoverPos: { value: [0, 0] },
        uRotateOnHover: { value: rotateOnHover ? 1 : 0 },
        uSteps: { value: lowPower ? 34 : 56 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    // Cached in resize() so pointermove doesn't force a synchronous
    // layout read (getBoundingClientRect) on every mouse-move event.
    let rect = { left: 0, top: 0, width: 1, height: 1 };

    function resize() {
      const width = container.offsetWidth || 1;
      const height = container.offsetHeight || 1;
      // See Aurora.jsx's resize() for why dpr is re-read here instead of
      // only at mount: it keeps the backing-buffer resolution correct
      // when the browser's zoom level changes.
      renderer.dpr = Math.min(window.devicePixelRatio, maxDpr);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
      rect = container.getBoundingClientRect();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    // getBoundingClientRect only reflects scroll position at resize time,
    // so refresh it on scroll too (cheap: no layout read, just re-reads
    // the cached rect's already-computed position via a rAF-throttled read).
    let scrollRafId = null;
    function handleScroll() {
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        rect = container.getBoundingClientRect();
        scrollRafId = null;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    let targetHover = forceHoverState ? 1 : 0;
    function handlePointerMove(e) {
      if (forceHoverState) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      program.uniforms.uHoverPos.value = [x, y];
      targetHover = 1;
    }
    function handlePointerLeave() {
      if (forceHoverState) return;
      targetHover = 0;
    }
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    let rafId = null;
    let elapsed = 0;
    let lastTimestamp = performance.now();

    function frame(timestamp) {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      elapsed += delta;
      program.uniforms.uTime.value = elapsed;
      const current = program.uniforms.uHoverActive.value;
      program.uniforms.uHoverActive.value = current + (targetHover - current) * Math.min(delta * 4, 1);
      renderer.render({ scene: mesh });

      if (!paused && isVisible) rafId = requestAnimationFrame(frame);
    }

    // Only spend GPU/CPU time on this while it's actually visible —
    // this is the single biggest win over the old version, which kept
    // its Canvas render loop running the whole time the page was open.
    // The rAF loop itself is now fully stopped (not just skipped) while
    // off-screen, so there's zero per-frame JS cost when scrolled away.
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible && !paused) {
          lastTimestamp = performance.now();
          rafId = requestAnimationFrame(frame);
        } else if (!isVisible && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(container);

    if (!paused) rafId = requestAnimationFrame(frame);
    if (paused) renderer.render({ scene: mesh });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollRafId) cancelAnimationFrame(scrollRafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      const loseContext = gl.getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    };
    // Props are read once at mount, same convention as Aurora.jsx — this
    // is a decorative background, not something that needs to react to
    // prop changes after init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, lowPower]);

  return <div ref={containerRef} className={`h-full w-full ${className}`} aria-hidden="true" />;
}
