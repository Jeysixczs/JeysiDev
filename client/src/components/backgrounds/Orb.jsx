import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

/**
 * Orb — an interactive, reactbits.dev-style animated orb
 * (https://reactbits.dev/backgrounds/orb), built on the same OGL/WebGL
 * approach as `Aurora.jsx` rather than Three.js / react-three-fiber (which
 * pulled in ~600kb and ran a full React-reconciled scene graph just to spin
 * two wireframe icosahedrons).
 *
 * The visual design (noise, lighting, glow) is the original single-octave
 * raymarched sphere. What's new is the rotation model: instead of a
 * yaw-only auto-spin, the object's orientation is a full quaternion, and
 * the camera is fixed while the *object* rotates under it. That means a
 * drag along any direction — pure x, pure y, or any diagonal in between —
 * rotates the sphere freely across all three axes (it can tumble through
 * yz- and xz-plane rotations as easily as xy), with no gimbal lock and no
 * artificial pitch clamp.
 *
 * - Dragging rotates the object; releasing carries the drag's angular
 *   velocity as momentum, which decays back to a slow idle spin.
 *
 * Performance/lifecycle guarantees are unchanged:
 * - stops its render loop entirely while scrolled off-screen (IntersectionObserver)
 * - freezes ambient motion (idle spin, hover parallax, surface time) under
 *   prefers-reduced-motion, while still responding instantly to direct drag
 * - caps devicePixelRatio on low-power devices
 * - tears its GL context down completely on unmount
 * - never triggers a React re-render from animation/pointer state — all of
 *   it lives in refs and is pushed straight into WebGL uniforms / canvas style
 *
 * Props (mirroring reactbits.dev's Orb, plus one addition):
 * - hue:         rotation in degrees (0-360) away from the built-in
 *                violet/cyan base color below — 0 is that base color
 *                itself, not "red" as in standard HSL
 * - lowPower:    cap dpr/step count further for weaker devices
 * - paused:      skip the RAF loop and render one static frame
 * - interactive: whether the orb responds to mouse/touch at all
 *                (default true). Set to false to restore the old fully
 *                passive/pass-through behavior (pointer-events: none, no
 *                listeners, idle spin only).
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
  uniform mat3 uRotation;
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

  // transpose() is a GLSL ES 3.00 (WebGL2-only) built-in — it doesn't exist
  // in the GLSL ES 1.00 this shader is written in, so it has to be done by
  // hand here instead.
  mat3 transposeMat3(mat3 m) {
    return mat3(
      m[0][0], m[1][0], m[2][0],
      m[0][1], m[1][1], m[2][1],
      m[0][2], m[1][2], m[2][2]
    );
  }

  float map(vec3 p) {
    float n = snoise(p * 1.7 + vec3(0.0, 0.0, uTime * 0.12));
    return sdSphere(p, 1.0 + n * 0.16);
  }

  vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
      map(p + e.xyy) - map(p - e.xyy),
      map(p + e.yxy) - map(p - e.yxy),
      map(p + e.yyx) - map(p - e.yyx)
    ));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);

    // Fixed camera looking down -Z. The object rotates under it via
    // uRotation instead of the camera orbiting it — this is what lets a
    // drag in any direction (x, y, or a diagonal) freely tumble the sphere
    // across all three axes, with no up-vector to lock roll out.
    vec3 ro = vec3(0.0, 0.0, 3.1);
    vec3 forward = vec3(0.0, 0.0, -1.0);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = vec3(1.0, 0.0, 0.0);
    vec3 rd = normalize(right * uv.x + up * uv.y + forward * 1.6);

    // uRotation is orthonormal, so its transpose is its inverse: this maps
    // the fixed world-space camera ray into the sphere's rotating object
    // space, where the raymarch/noise happen exactly as before rotation
    // was added.
    mat3 invRotation = transposeMat3(uRotation);
    vec3 ro_o = invRotation * ro;
    vec3 rd_o = normalize(invRotation * rd);

    float t = 0.0;
    vec3 p = ro_o;
    vec3 pMin = ro_o;
    float tMin = 0.0;
    float minDist = 1e5;
    bool hit = false;
    for (int i = 0; i < 56; i++) {
      if (i >= uSteps) break;
      p = ro_o + rd_o * t;
      float d = map(p);
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
    // pixels instead of a hard hit/miss cutoff.
    float pixelWorldSize = (2.0 / max(uResolution.y, 1.0)) * max(tMin, 1.0);
    float edgeWidth = max(pixelWorldSize * 1.5, 0.0025);
    float coverage = hit ? 1.0 : 1.0 - smoothstep(0.0, edgeWidth, minDist);

    vec3 surfaceColor = vec3(0.0);
    if (coverage > 0.0) {
      // Rotate the object-space normal back into world space so the
      // (fixed) light direction and view direction stay meaningful as the
      // sphere spins.
      vec3 n = normalize(uRotation * calcNormal(pMin));
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// --- Minimal quaternion helpers (x, y, z, w order) -------------------
// No external math library — this is the entire dependency-free rotation
// model: an axis-angle step per axis, composed by quaternion multiply.
function quatFromAxisAngle(axis, angle) {
  const half = angle / 2;
  const s = Math.sin(half);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)];
}

function quatMultiply(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

function quatNormalize(q) {
  const len = Math.hypot(q[0], q[1], q[2], q[3]);
  return len > 1e-8 ? [q[0] / len, q[1] / len, q[2] / len, q[3] / len] : [0, 0, 0, 1];
}

// Column-major 3x3, matching the layout WebGL's uniformMatrix3fv expects.
function quatToMat3(q) {
  const [x, y, z, w] = q;
  const xx = x * x, yy = y * y, zz = z * z;
  const xy = x * y, xz = x * z, yz = y * z;
  const wx = w * x, wy = w * y, wz = w * z;
  return [
    1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy),
    2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx),
    2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy),
  ];
}

const AXIS_X = [1, 0, 0];
const AXIS_Y = [0, 1, 0];

// Tuned motion constants. Keep these in one place so the "feel" of the
// interaction can be adjusted without hunting through the effect bodies.
const IDLE_YAW_RATE = 0.26; // rad/s idle auto-spin speed
const ANGULAR_DAMPING = 1.8; // how fast drag momentum relaxes toward idle
const DRAG_YAW_SCALE = Math.PI * 1.5; // full-width drag ≈ 270° of yaw
const DRAG_PITCH_SCALE = Math.PI * 1.2; // full-height drag ≈ 216° of pitch
const MAX_ANGULAR_VELOCITY = 10; // rad/s cap on momentum after release

export default function Orb({
  hue = 0,
  lowPower = false,
  paused = false,
  interactive = true,
  className = "",
}) {
  const containerRef = useRef(null);

  // All interaction/animation state lives here, at component scope, so it
  // survives the WebGL effect below being torn down and recreated (which
  // happens whenever `paused`/`lowPower` change) and so none of it needs a
  // React re-render to update every frame.
  const stateRef = useRef({
    quat: [0, 0, 0, 1], // the object's persistent orientation
    angVel: { x: 0, y: 0, z: 0 }, // rad/s, drives momentum + idle spin
    isDragging: false,
    lastDrag: { x: 0, y: 0, t: 0 },
  });
  const reducedMotionRef = useRef(false);

  // WebGL setup + render loop. Only recreated when `paused`/`lowPower`
  // change — everything interaction-related is read from stateRef each
  // frame, so toggling `interactive` never tears down the GL context.
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
        uRotation: { value: quatToMat3(stateRef.current.quat) },
        uSteps: { value: lowPower ? 34 : 56 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const width = container.offsetWidth || 1;
      const height = container.offsetHeight || 1;
      renderer.dpr = Math.min(window.devicePixelRatio, maxDpr);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;
    const handleMotionChange = (e) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) {
        // Kill any in-flight momentum immediately so we don't keep
        // spinning after the user's system asks for reduced motion.
        stateRef.current.angVel = { x: 0, y: 0, z: 0 };
      }
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", handleMotionChange);
    else motionQuery.addListener(handleMotionChange);

    let rafId = null;
    let elapsed = 0;
    let lastTimestamp = performance.now();

    function frame(timestamp) {
      const delta = Math.min((timestamp - lastTimestamp) / 1000, 1 / 20);
      lastTimestamp = timestamp;

      const s = stateRef.current;
      const reduced = reducedMotionRef.current;

      if (!reduced) elapsed += delta;
      program.uniforms.uTime.value = elapsed;

      if (!s.isDragging) {
        // Momentum from a drag relaxes toward a slow idle spin (or toward
        // stillness under reduced motion) rather than snapping to it —
        // whatever axis the drag left it spinning on decays smoothly.
        const target = reduced ? { x: 0, y: 0, z: 0 } : { x: 0, y: IDLE_YAW_RATE, z: 0 };
        const k = 1 - Math.exp(-ANGULAR_DAMPING * delta);
        s.angVel.x += (target.x - s.angVel.x) * k;
        s.angVel.y += (target.y - s.angVel.y) * k;
        s.angVel.z += (target.z - s.angVel.z) * k;

        if (s.angVel.x !== 0) {
          s.quat = quatMultiply(quatFromAxisAngle(AXIS_X, s.angVel.x * delta), s.quat);
        }
        if (s.angVel.y !== 0) {
          s.quat = quatMultiply(quatFromAxisAngle(AXIS_Y, s.angVel.y * delta), s.quat);
        }
        s.quat = quatNormalize(s.quat);
      }

      program.uniforms.uRotation.value = quatToMat3(s.quat);

      renderer.render({ scene: mesh });

      if (!paused && isVisible) rafId = requestAnimationFrame(frame);
    }

    // Only spend GPU/CPU time on this while it's actually visible.
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
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (motionQuery.removeEventListener) motionQuery.removeEventListener("change", handleMotionChange);
      else motionQuery.removeListener(handleMotionChange);
      const loseContext = gl.getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    };
    // `hue` is intentionally read once at mount (same convention as
    // Aurora.jsx) — this loop reads everything else it needs from
    // stateRef/reducedMotionRef every frame instead of from props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, lowPower]);

  // Pointer/touch handling, kept separate from the WebGL effect above so
  // toggling `interactive` never tears down and recreates the GL context.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !interactive) return undefined;

    const s = stateRef.current;

    function handlePointerMove(e) {
      if (s.isDragging) {
        const rect = container.getBoundingClientRect();
        const now = performance.now();
        const dtDrag = Math.max((now - s.lastDrag.t) / 1000, 1 / 240);
        const dx = e.clientX - s.lastDrag.x;
        const dy = e.clientY - s.lastDrag.y;

        // Horizontal movement (x) rotates about the Y axis (an xz-plane
        // rotation); vertical movement (y) rotates about the X axis (a
        // yz-plane rotation). A diagonal drag (xy) applies both at once —
        // together these compose freely, so the object can tumble into
        // any orientation, not just yaw-then-pitch.
        const yawDelta = (dx / rect.width) * DRAG_YAW_SCALE;
        const pitchDelta = (dy / rect.height) * DRAG_PITCH_SCALE;

        s.quat = quatNormalize(
          quatMultiply(
            quatMultiply(quatFromAxisAngle(AXIS_Y, yawDelta), quatFromAxisAngle(AXIS_X, pitchDelta)),
            s.quat
          )
        );

        s.angVel = {
          x: clamp(pitchDelta / dtDrag, -MAX_ANGULAR_VELOCITY, MAX_ANGULAR_VELOCITY),
          y: clamp(yawDelta / dtDrag, -MAX_ANGULAR_VELOCITY, MAX_ANGULAR_VELOCITY),
          z: 0,
        };
        s.lastDrag = { x: e.clientX, y: e.clientY, t: now };
      }
    }

    function handlePointerDown(e) {
      s.isDragging = true;
      s.angVel = { x: 0, y: 0, z: 0 };
      s.lastDrag = { x: e.clientX, y: e.clientY, t: performance.now() };
      if (container.setPointerCapture) {
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          // Ignore — capture is a nicety, not a requirement.
        }
      }
    }

    function endDrag(e) {
      if (!s.isDragging) return;
      s.isDragging = false;
      if (reducedMotionRef.current) {
        s.angVel = { x: 0, y: 0, z: 0 };
      }
      if (e && e.pointerId != null && container.releasePointerCapture) {
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {
          // Already released or never captured — fine.
        }
      }
    }

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);
    container.addEventListener("lostpointercapture", endDrag);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", endDrag);
      container.removeEventListener("pointercancel", endDrag);
      container.removeEventListener("lostpointercapture", endDrag);
      // Reset transient interaction state so switching `interactive` off
      // settles back into a plain idle spin instead of freezing mid-drag.
      s.isDragging = false;
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full select-none ${
        interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      } ${className}`}
      style={interactive ? { touchAction: "none" } : undefined}
      aria-hidden="true"
    />
  );
}
