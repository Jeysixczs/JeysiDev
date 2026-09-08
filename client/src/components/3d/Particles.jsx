import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A drifting field of point-sprites used as ambient depth behind the
 * hero geometry. Uses a single BufferGeometry + Points draw call so it
 * stays cheap even at higher counts. Reacts to the cursor with a very
 * small parallax offset — background depth should move the least of
 * anything in the scene.
 */
export default function Particles({ count = 900, radius = 9, mouse = null, spin = true }) {
  const pointsRef = useRef();
  const autoRotation = useRef({ x: 0, y: 0 });
  const parallax = useRef({ x: 0, y: 0 });

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // distribute inside a sphere, biased outward so the center stays clear
      const r = radius * Math.cbrt(Math.random() * 0.6 + 0.4);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    if (spin) {
      autoRotation.current.y += delta * 0.015;
      autoRotation.current.x += delta * 0.005;
    }

    if (mouse) {
      const targetX = mouse.current.y * 0.05;
      const targetY = mouse.current.x * 0.05;
      parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, targetX, delta * 0.6);
      parallax.current.y = THREE.MathUtils.lerp(parallax.current.y, targetY, delta * 0.6);
    }

    pointsRef.current.rotation.x = autoRotation.current.x + parallax.current.x;
    pointsRef.current.rotation.y = autoRotation.current.y + parallax.current.y;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#3DDAD7"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
