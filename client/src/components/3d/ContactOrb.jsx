import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "../../hooks/useMousePosition";
import { useSmoothMouse } from "../../hooks/useSmoothMouse";
import { useDeviceCapability } from "../../hooks/useDeviceCapability";

function Orb({ dragRef, mouse }) {
  const outerRef = useRef();
  const innerRef = useRef();
  const tilt = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const idleAmount = delta * dragRef.current.idleSpeed * dragRef.current.idleDirection;
    if (dragRef.current.idleAxis === "x") {
      outerRef.current.rotation.x += idleAmount;
    } else {
      outerRef.current.rotation.y += idleAmount;
    }
    innerRef.current.rotation.y -= delta * 0.4;

    // Drag-to-rotate with momentum: exact while held, decaying after release.
    // Horizontal drag yaws (rotation.y), vertical drag pitches (rotation.x) —
    // a trackball, not a horizontal-only spinner.
    if (dragRef.current.dragging) {
      outerRef.current.rotation.y += dragRef.current.velocityX;
      innerRef.current.rotation.y += dragRef.current.velocityX * 0.6;
      outerRef.current.rotation.x += dragRef.current.velocityY;
    } else {
      if (Math.abs(dragRef.current.velocityX) > 0.0001) {
        outerRef.current.rotation.y += dragRef.current.velocityX;
        innerRef.current.rotation.y += dragRef.current.velocityX * 0.6;
        dragRef.current.velocityX *= 0.92;
      }
      if (Math.abs(dragRef.current.velocityY) > 0.0001) {
        outerRef.current.rotation.x += dragRef.current.velocityY;
        dragRef.current.velocityY *= 0.92;
      }
    }

    if (mouse) {
      // Subtle cursor-following tilt on an axis orthogonal to the idle
      // spin, so the two motions add up instead of fighting each other.
      tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, mouse.current.y * 0.2, delta * 2.5);
      tilt.current.y = THREE.MathUtils.lerp(tilt.current.y, -mouse.current.x * 0.2, delta * 2.5);
      outerRef.current.rotation.z = tilt.current.y;
      innerRef.current.rotation.z = tilt.current.x;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
      <group>
        <mesh ref={outerRef}>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshBasicMaterial color="#3DDAD7" wireframe transparent opacity={0.5} />
        </mesh>
        <mesh ref={innerRef}>
          <icosahedronGeometry args={[1.05, 0]} />
          <meshStandardMaterial
            color="#0D1220"
            emissive="#8B6BFF"
            emissiveIntensity={0.6}
            wireframe
          />
        </mesh>
        <pointLight position={[0, 0, 0]} intensity={2} color="#8B6BFF" distance={4} />
      </group>
    </Float>
  );
}

export default function ContactOrb() {
  const { prefersReducedMotion, hasFinePointer } = useDeviceCapability();
  const rawMouse = useMousePosition();
  const smoothMouse = useSmoothMouse(rawMouse, 0.1);
  const dragRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
    idleAxis: "y",
    idleDirection: 1,
    idleSpeed: 0.25,
  });

  function handlePointerDown(e) {
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    dragRef.current.velocityX = 0;
    dragRef.current.velocityY = 0;
    window.dispatchEvent(new CustomEvent("cursor-state", { detail: "drag" }));
  }

  function handlePointerMove(e) {
    if (!dragRef.current.dragging) return;
    const deltaX = e.clientX - dragRef.current.lastX;
    const deltaY = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    dragRef.current.velocityX = deltaX * 0.008;
    dragRef.current.velocityY = deltaY * 0.008;

    // Whichever axis is moving more is the one driving the rotation right
    // now — e.g. swiping up drives pitch (rotation.x), so idle should
    // keep tumbling in that same "up" direction once the swipe ends.
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      if (deltaX !== 0) {
        dragRef.current.idleAxis = "y";
        dragRef.current.idleDirection = Math.sign(deltaX);
      }
    } else if (deltaY !== 0) {
      dragRef.current.idleAxis = "x";
      dragRef.current.idleDirection = Math.sign(deltaY);
    }
  }

  function endDrag() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    // Carry the swipe's speed into the idle spin (clamped so a flick
    // doesn't leave it spinning absurdly fast, and a tiny nudge doesn't
    // stall it out).
    const releaseVelocity =
      dragRef.current.idleAxis === "x" ? dragRef.current.velocityY : dragRef.current.velocityX;
    const swipeSpeed = Math.abs(releaseVelocity) * 6;
    dragRef.current.idleSpeed = THREE.MathUtils.clamp(swipeSpeed, 0.15, 1.2);
    window.dispatchEvent(new CustomEvent("cursor-state", { detail: "default" }));
  }

  return (
    <div
      className="h-[280px] w-full touch-none select-none sm:h-[360px]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      data-cursor="drag"
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.75]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 3]} intensity={1} color="#3DDAD7" />
        <Suspense fallback={null}>
          <Orb
            dragRef={dragRef}
            mouse={prefersReducedMotion || !hasFinePointer ? null : smoothMouse}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
