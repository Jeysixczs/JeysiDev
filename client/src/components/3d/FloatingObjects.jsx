import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { seededRandom, seededRange } from "../../utils/random";

// Rough world-space extent the cursor maps to at the shards' depth —
// matches the mapping used by CursorLight so the "cursor as a physical
// presence" reads consistently across the scene.
const CURSOR_WORLD_X = 3.2;
const CURSOR_WORLD_Y = 2;
const INTERACTION_RADIUS = 2.1;

/**
 * A single floating "signal shard" — the hero's meaningful centerpiece,
 * not decoration. It tilts toward the cursor, drifts on its own, backs
 * away when the cursor gets physically close, and grows/spins when
 * directly hovered. All motion is lerped toward a target rather than
 * snapping, so it reads as having weight.
 */
function Shard({
  geometryArgs,
  position,
  color,
  mouse,
  wireframe = false,
  speed = 1,
  seed = 1,
  scrollProgress,
  reduced = false,
}) {
  const meshRef = useRef();
  const offsetGroupRef = useRef();
  const target = useRef({ x: 0, y: 0 });
  const magnet = useRef({ x: 0, y: 0 });
  const scale = useRef(1);
  const [hovered, setHovered] = useState(false);

  // Deterministic per-shard variation (phase + spin bias) instead of a
  // fresh Math.random() call on every render.
  const rng = useMemo(() => seededRandom(seed * 9973), [seed]);
  const phase = useMemo(() => seededRange(rng, 0, Math.PI * 2), [rng]);
  const spinBias = useMemo(() => seededRange(rng, 0.85, 1.15), [rng]);

  useFrame((state, delta) => {
    const scroll = scrollProgress?.current?.enter ?? 0;
    // Objects calm down as the hero scrolls out of view rather than
    // spinning forever off-screen.
    const calm = 1 - Math.min(scroll, 1) * 0.65;
    const lerpSpeed = Math.min(delta * 2, 1);

    if (mouse) {
      target.current.x = mouse.current.y * 0.35;
      target.current.y = mouse.current.x * 0.35;
    }

    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        target.current.x,
        lerpSpeed
      );
      const spin = reduced ? 0 : state.clock.elapsedTime * 0.08 * speed * spinBias * calm;
      const hoverSpin = reduced || !hovered ? 0 : state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        target.current.y + spin + phase + hoverSpin,
        lerpSpeed
      );

      const targetScale = hovered ? 1.18 : 1;
      scale.current = THREE.MathUtils.lerp(scale.current, targetScale, delta * 5);
      meshRef.current.scale.setScalar(scale.current);
    }

    // Cursor-as-physical-presence: shards lean away when the cursor
    // gets close, then spring back once it moves off. Skipped when
    // mouse tracking is disabled (reduced motion / low power).
    if (mouse && offsetGroupRef.current) {
      const cursorWorldX = mouse.current.x * CURSOR_WORLD_X;
      const cursorWorldY = mouse.current.y * CURSOR_WORLD_Y;
      const dx = position[0] - cursorWorldX;
      const dy = position[1] - cursorWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let pushX = 0;
      let pushY = 0;
      if (dist < INTERACTION_RADIUS && dist > 0.0001) {
        const strength = (1 - dist / INTERACTION_RADIUS) * 0.4;
        pushX = (dx / dist) * strength;
        pushY = (dy / dist) * strength;
      }

      magnet.current.x = THREE.MathUtils.lerp(magnet.current.x, pushX, delta * 4);
      magnet.current.y = THREE.MathUtils.lerp(magnet.current.y, pushY, delta * 4);
      offsetGroupRef.current.position.set(magnet.current.x, magnet.current.y, 0);
    }
  });

  return (
    <Float
      speed={reduced ? 0 : 1.4 * speed}
      rotationIntensity={reduced ? 0 : 0.4}
      floatIntensity={reduced ? 0 : 1.1}
      position={position}
    >
      <group ref={offsetGroupRef}>
        <mesh
          ref={meshRef}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
            window.dispatchEvent(new CustomEvent("cursor-state", { detail: "hover" }));
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = "auto";
            window.dispatchEvent(new CustomEvent("cursor-state", { detail: "default" }));
          }}
        >
          {geometryArgs}
          {wireframe ? (
            <meshBasicMaterial
              color={color}
              wireframe
              transparent
              opacity={hovered ? 0.85 : 0.55}
            />
          ) : (
            <MeshTransmissionMaterial
              color={color}
              thickness={0.6}
              roughness={0.08}
              transmission={1}
              ior={1.2}
              chromaticAberration={0.04}
              backside
            />
          )}
        </mesh>
      </group>
    </Float>
  );
}

export default function FloatingObjects({
  mouse,
  isLowPower = false,
  scrollProgress,
  reduced = false,
}) {
  return (
    <group>
      <Shard
        geometryArgs={<icosahedronGeometry args={[1.15, 0]} />}
        position={[1.9, 0.4, 0]}
        color="#3DDAD7"
        mouse={mouse}
        speed={1}
        seed={1}
        scrollProgress={scrollProgress}
        reduced={reduced}
      />
      <Shard
        geometryArgs={<torusKnotGeometry args={[0.55, 0.16, 128, 16]} />}
        position={[-2.1, -0.6, -1.2]}
        color="#8B6BFF"
        mouse={mouse}
        wireframe
        speed={0.7}
        seed={2}
        scrollProgress={scrollProgress}
        reduced={reduced}
      />
      {!isLowPower && (
        <Shard
          geometryArgs={<octahedronGeometry args={[0.6, 0]} />}
          position={[0.6, -1.6, -0.6]}
          color="#FFB347"
          mouse={mouse}
          wireframe
          speed={1.3}
          seed={3}
          scrollProgress={scrollProgress}
          reduced={reduced}
        />
      )}
    </group>
  );
}
