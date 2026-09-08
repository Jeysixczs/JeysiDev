import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "../../hooks/useMousePosition";
import { useSmoothMouse } from "../../hooks/useSmoothMouse";
import { useDeviceCapability } from "../../hooks/useDeviceCapability";

const RING_COLORS = {
  Language: "#3DDAD7",
  Frontend: "#8B6BFF",
  Backend: "#FFB347",
  "3D / Graphics": "#3DDAD7",
  Tooling: "#8B6BFF",
  Database: "#FFB347",
};

function Core({ speedFactorRef }) {
  const ref = useRef();
  useFrame((_, delta) => {
    const factor = speedFactorRef?.current ?? 1;
    ref.current.rotation.y += delta * 0.15 * factor;
    ref.current.rotation.x += delta * 0.05 * factor;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.55, 1]} />
      <meshStandardMaterial
        color="#0D1220"
        emissive="#3DDAD7"
        emissiveIntensity={0.35}
        wireframe
      />
    </mesh>
  );
}

function SkillNode({
  skill,
  angle,
  radius,
  height,
  active,
  dimmed,
  pushAngle,
  orbitTimeRef,
  onHover,
  onLeave,
}) {
  const groupRef = useRef();
  const scale = useRef(1);
  const zOffset = useRef(0);
  const pushRef = useRef(0);
  const color = RING_COLORS[skill.category] || "#3DDAD7";

  useFrame((state, delta) => {
    const orbitTime = orbitTimeRef.current;
    pushRef.current = THREE.MathUtils.lerp(pushRef.current, pushAngle, delta * 4);
    const t = orbitTime * 0.18 + angle + pushRef.current;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;

    zOffset.current = THREE.MathUtils.lerp(zOffset.current, active ? 0.55 : 0, delta * 5);
    groupRef.current.position.set(x, height, z + zOffset.current);

    const targetScale = active ? 1.7 : dimmed ? 0.85 : 1;
    scale.current = THREE.MathUtils.lerp(scale.current, targetScale, delta * 6);
    groupRef.current.scale.setScalar(scale.current);
  });

  return (
    <group ref={groupRef}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(skill);
          window.dispatchEvent(new CustomEvent("cursor-state", { detail: "hover" }));
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onLeave();
          window.dispatchEvent(new CustomEvent("cursor-state", { detail: "default" }));
        }}
      >
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.6 : 0.6}
        />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div
          className={`whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[11px] transition-all duration-200 ${
            active
              ? "border-cyan/70 bg-void/90 text-cyan opacity-100"
              : dimmed
                ? "border-white/5 bg-void/50 text-ink-faint opacity-40"
                : "border-white/10 bg-void/60 text-ink-muted opacity-70"
          }`}
        >
          {skill.name}
        </div>
      </Html>
    </group>
  );
}

function OrbitRing({ radius }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(t) * radius, 0, Math.sin(t) * radius]);
    }
    return pts;
  }, [radius]);

  return <Line points={points} color="#1E2740" lineWidth={1} transparent opacity={0.6} />;
}

function OrbitScene({ skills, active, setActive, dragRef, mouse }) {
  const groupRef = useRef();
  const orbitTimeRef = useRef(0);
  const speedFactorRef = useRef(1);
  const tilt = useRef({ x: 0, y: 0 });

  const layout = useMemo(() => {
    return skills.map((skill, i) => {
      const ring = i % 2 === 0 ? 2.1 : 2.9;
      const height = i % 2 === 0 ? 0.4 : -0.4;
      const angle = (i / skills.length) * Math.PI * 2;
      return { skill, ring, height, angle, index: i };
    });
  }, [skills]);

  const activeIndex = useMemo(
    () => (active ? layout.findIndex((l) => l.skill.name === active.name) : -1),
    [active, layout]
  );

  useFrame((state, delta) => {
    // Orbit pauses/slows while a node is being examined, so the label
    // stays readable instead of sliding away mid-hover.
    const targetSpeed = active ? 0.2 : 1;
    speedFactorRef.current = THREE.MathUtils.lerp(speedFactorRef.current, targetSpeed, delta * 3);
    orbitTimeRef.current += delta * speedFactorRef.current;

    // Drag rotation with inertia: while dragging, follow the pointer
    // exactly; once released, velocity decays instead of stopping dead.
    if (groupRef.current) {
      if (dragRef.current.dragging) {
        groupRef.current.rotation.y += dragRef.current.velocity;
      } else if (Math.abs(dragRef.current.velocity) > 0.0001) {
        groupRef.current.rotation.y += dragRef.current.velocity;
        dragRef.current.velocity *= 0.94;
      }

      if (mouse) {
        tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, mouse.current.y * 0.12, delta * 2);
        tilt.current.y = THREE.MathUtils.lerp(tilt.current.y, mouse.current.x * 0.12, delta * 2);
        groupRef.current.rotation.x = tilt.current.x;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#3DDAD7" />
      <pointLight position={[-3, -2, -2]} intensity={0.7} color="#8B6BFF" />
      <group ref={groupRef}>
        <Core speedFactorRef={speedFactorRef} />
        <OrbitRing radius={2.1} />
        <OrbitRing radius={2.9} />
        {layout.map(({ skill, ring, height, angle, index }) => {
          const isActive = activeIndex === index;
          // Neighbors of the active node get nudged apart angularly so
          // the highlighted node has visual room to breathe.
          let pushAngle = 0;
          if (activeIndex !== -1 && !isActive) {
            const circularDist = Math.min(
              Math.abs(index - activeIndex),
              skills.length - Math.abs(index - activeIndex)
            );
            if (circularDist === 1) {
              const direction = index > activeIndex ? 1 : -1;
              pushAngle = direction * 0.16;
            }
          }
          return (
            <SkillNode
              key={skill.name}
              skill={skill}
              angle={angle}
              radius={ring}
              height={height}
              active={isActive}
              dimmed={activeIndex !== -1 && !isActive}
              pushAngle={pushAngle}
              orbitTimeRef={orbitTimeRef}
              onHover={setActive}
              onLeave={() => setActive(null)}
            />
          );
        })}
      </group>
    </>
  );
}

export default function SkillsOrbit({ skills }) {
  const [active, setActive] = useState(null);
  const { prefersReducedMotion, hasFinePointer } = useDeviceCapability();
  const rawMouse = useMousePosition();
  const smoothMouse = useSmoothMouse(rawMouse, 0.1);
  const dragRef = useRef({ dragging: false, lastX: 0, velocity: 0 });

  function handlePointerDown(e) {
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.velocity = 0;
    window.dispatchEvent(new CustomEvent("cursor-state", { detail: "drag" }));
  }

  function handlePointerMove(e) {
    if (!dragRef.current.dragging) return;
    const deltaX = e.clientX - dragRef.current.lastX;
    dragRef.current.lastX = e.clientX;
    dragRef.current.velocity = deltaX * 0.006;
  }

  function endDrag() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    window.dispatchEvent(new CustomEvent("cursor-state", { detail: "default" }));
  }

  return (
    <div
      className="relative h-[420px] w-full touch-pan-y select-none sm:h-[480px]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      data-cursor="drag"
    >
      <Canvas camera={{ position: [0, 1.6, 6.5], fov: 45 }} dpr={[1, 1.75]}>
        <Suspense fallback={null}>
          <OrbitScene
            skills={skills}
            active={active}
            setActive={setActive}
            dragRef={dragRef}
            mouse={prefersReducedMotion || !hasFinePointer ? null : smoothMouse}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
        <div className="glass-panel min-h-[52px] w-full max-w-sm rounded-2xl px-5 py-3 text-center">
          {active ? (
            <>
              <p className="font-display text-sm text-ink">{active.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{active.note}</p>
            </>
          ) : (
            <p className="text-xs text-ink-faint">Hover a node — drag to rotate the orbit</p>
          )}
        </div>
      </div>
    </div>
  );
}
