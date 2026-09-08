import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import Particles from "./Particles";
import FloatingObjects from "./FloatingObjects";
import CameraController from "./CameraController";
import { useMousePosition } from "../../hooks/useMousePosition";
import { useSmoothMouse } from "../../hooks/useSmoothMouse";
import { useDeviceCapability } from "../../hooks/useDeviceCapability";
import { useScrollProgress } from "../../hooks/useScrollProgress";

function SceneLoader() {
  return null; // Suspense fallback stays invisible; page content already reads fine without the canvas.
}

/** A point light that drifts toward the cursor, giving the scene a
 * light source that feels connected to the user rather than fixed. */
function CursorLight({ mouse }) {
  const ref = useRef();

  useFrame((state, delta) => {
    if (!mouse || !ref.current) return;
    const targetX = mouse.current.x * 3.2;
    const targetY = mouse.current.y * 2;
    const lerpSpeed = Math.min(delta * 2.4, 1);
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, lerpSpeed);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, lerpSpeed);
  });

  return <pointLight ref={ref} position={[0, 0, 3]} intensity={0.9} color="#B3A0FF" distance={7} />;
}

export default function Scene({ sectionRef }) {
  const mouse = useMousePosition();
  const smoothMouse = useSmoothMouse(mouse, 0.08);
  const { isLowPower, prefersReducedMotion, isMobile } = useDeviceCapability();
  const scrollProgress = useScrollProgress(sectionRef);

  const interactionMouse = prefersReducedMotion ? null : smoothMouse;

  return (
    <Canvas
      dpr={isLowPower ? [1, 1.3] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6.5], fov: 45 }}
    >
      <color attach="background" args={["#06080F"]} />
      <fog attach="fog" args={["#06080F", 8, 16]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.1} color="#3DDAD7" />
      <pointLight position={[-5, -3, -2]} intensity={0.8} color="#8B6BFF" />
      {!isLowPower && !prefersReducedMotion && <CursorLight mouse={interactionMouse} />}

      <Suspense fallback={<SceneLoader />}>
        {!isLowPower && <Environment preset="night" />}
        <Particles
          count={isLowPower ? 350 : 900}
          mouse={interactionMouse}
          spin={!prefersReducedMotion}
        />
        <FloatingObjects
          mouse={interactionMouse}
          isLowPower={isLowPower}
          scrollProgress={scrollProgress}
          reduced={prefersReducedMotion}
        />
      </Suspense>

      {!prefersReducedMotion && (
        <CameraController
          mouse={interactionMouse}
          scrollProgress={scrollProgress}
          strength={isMobile ? 0.5 : 1}
        />
      )}
    </Canvas>
  );
}
