import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Gives the hero scene a sense of depth by gently panning the camera
 * toward the pointer position, and dollies it slightly forward as the
 * hero section scrolls out of view. Movement is small and lerped so it
 * reads as "alive" rather than distracting.
 *
 * `mouse` is a raw or smoothed position ref in [-1, 1] on both axes.
 * `scrollProgress` is the ref from useScrollProgress — .current.enter
 * goes from 0 (hero fully in view) to 1 (scrolled past).
 * `strength` scales the pan for touch/desktop differences.
 */
export default function CameraController({ mouse, scrollProgress, strength = 1 }) {
  const { camera } = useThree();

  useFrame((state, delta) => {
    const scroll = scrollProgress?.current?.enter ?? 0;
    const lerpSpeed = Math.min(delta * 1.6, 1);

    const targetX = mouse ? mouse.current.x * 0.6 * strength : 0;
    const targetY = mouse ? mouse.current.y * 0.35 * strength : 0;
    // Dolly the camera in and slightly down as the hero scrolls away,
    // so the scene feels connected to scroll rather than static.
    const targetZ = 6.5 - scroll * 1.4;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, lerpSpeed);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY - scroll * 0.3, lerpSpeed);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, lerpSpeed);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
