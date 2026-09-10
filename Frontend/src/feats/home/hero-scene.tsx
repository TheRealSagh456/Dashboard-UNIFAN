import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferGeometry,
  DataTexture,
  Float32BufferAttribute,
  LinearFilter,
  PlaneGeometry,
  Vector2,
  Vector3,
  Mesh,
} from "three";
import { WAVE_SETTINGS } from "./wave-field";
import { createWaveMaterials } from "./wave-materials";
import type { WaveUniforms } from "./wave-materials";
import { createWaveRaycast } from "./wave-raycast";

const BACKGROUND = "#fae8d5";

function createParticleMask() {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const alpha = Math.round(255);
      const offset = (y * size + x) * 4;
      pixels.fill(alpha, offset, offset + 4);
    }
  }

  const texture = new DataTexture(pixels, size, size);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createParticleGeometry(compact: boolean) {
  const { width, depth, segmentsX, segmentsY } = WAVE_SETTINGS;
  const geometry = new PlaneGeometry(
    width,
    depth,
    compact ? 176 : segmentsX,
    compact ? 144 : segmentsY,
  );
  geometry.translate(0, 2, 0);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);

  for (let index = 0; index < positions.count; index += 1) {
    const seed = Math.sin(index * 127.1 + 311.7) * 43758.5453;
    const variation = seed - Math.floor(seed);
    const secondSeed = Math.sin(index * 269.5 + 183.3) * 43758.5453;
    const secondVariation = secondSeed - Math.floor(secondSeed);
    const stepX = width / geometry.parameters.widthSegments;
    const stepY = depth / geometry.parameters.heightSegments;
    positions.setX(
      index,
      positions.getX(index) + (variation - 0.5) * stepX * 0.3,
    );
    positions.setY(
      index,
      positions.getY(index) + (secondVariation - 0.5) * stepY * 0.3,
    );
    const brightness = 0.55 + variation * 0.45;
    colors.set([brightness, brightness, brightness], index * 3);
  }

  const particles = new BufferGeometry();
  particles.setAttribute("position", positions);
  particles.setAttribute("color", new Float32BufferAttribute(colors, 3));
  particles.computeBoundingSphere();
  if (particles.boundingSphere) particles.boundingSphere.radius += 6;
  geometry.dispose();
  return particles;
}

function createSurfaceGeometry(compact: boolean) {
  const geometry = new PlaneGeometry(
    WAVE_SETTINGS.width,
    WAVE_SETTINGS.depth,
    compact ? 96 : 160,
    compact ? 80 : 128,
  );
  geometry.translate(0, 2, 0);
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius += 6;
  return geometry;
}

function CameraRig() {
  const { camera } = useThree();
  const compact = useThree((state) => state.size.width < 640);

  useEffect(() => {
    const offset = compact ? 2.1 : 0;
    camera.position.set(offset, 3.3, 8.8);
    camera.lookAt(offset, -0.1, -3.2);
    camera.updateProjectionMatrix();
  }, [camera, compact]);

  return null;
}

function LearningPlane({
  paused,
  reducedMotion,
}: {
  paused: boolean;
  reducedMotion: boolean;
}) {
  const compact = useThree((state) => state.size.width < 640);
  const geometry = useMemo(() => createSurfaceGeometry(compact), [compact]);
  const particleGeometry = useMemo(
    () => createParticleGeometry(compact),
    [compact],
  );
  const particleMask = useMemo(() => createParticleMask(), []);
  const materials = useMemo(
    () => createWaveMaterials(particleMask, compact),
    [particleMask, compact],
  );
  const raycast = useMemo(
    () => createWaveRaycast(materials.uniforms),
    [materials],
  );
  const surfaceRef = useRef<Mesh<PlaneGeometry>>(null);
  const cursorTarget = useRef(new Vector2());
  const cursorCurrent = useRef(new Vector2());
  const localHit = useRef(new Vector3());

  const interactionTarget = useRef(0);
  const interactionStrength = useRef(0);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => particleGeometry.dispose(), [particleGeometry]);
  useEffect(() => () => particleMask.dispose(), [particleMask]);
  useEffect(
    () => () => {
      materials.surface.dispose();
      materials.particles.dispose();
    },
    [materials],
  );

  useFrame((_, delta) => {
    const surface = surfaceRef.current;
    if (!surface || Array.isArray(surface.material)) return;
    const uniforms = surface.material.userData.waveUniforms as WaveUniforms;
    if (reducedMotion) {
      uniforms.uWaveStrength.value = 0;
      return;
    }
    if (paused) return;
    const step = Math.min(delta, 0.05);
    const smoothing = 1 - Math.exp(-10 * step);

    cursorCurrent.current.lerp(cursorTarget.current, smoothing);

    interactionStrength.current +=
      (interactionTarget.current - interactionStrength.current) * smoothing;

    uniforms.uWaveTime.value += step;
    uniforms.uWaveCursor.value.copy(cursorCurrent.current);
    uniforms.uWaveStrength.value = interactionStrength.current;
  });

  return (
    <group rotation={[-Math.PI / 2, 0, -0.08]} position={[0, -1.6, 0]}>
      <mesh
        ref={surfaceRef}
        geometry={geometry}
        material={materials.surface}
        raycast={raycast}
        onPointerMove={(event) => {
          if (reducedMotion) return;
          event.object.worldToLocal(localHit.current.copy(event.point));
          cursorTarget.current.set(localHit.current.x, localHit.current.y);
          interactionTarget.current = 1;
        }}
        onPointerLeave={() => {
          interactionTarget.current = 0;
        }}
      />

      <points
        geometry={particleGeometry}
        material={materials.particles}
        position={[0, 0, 0.025]}
        raycast={() => {}}
      />
    </group>
  );
}

export function HeroScene() {
  const reducedMotion = useReducedMotion() === true;
  const [pageVisible, setPageVisible] = useState(
    () => document.visibilityState !== "hidden",
  );
  const [inView, setInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const paused = !pageVisible || !inView;

  useEffect(() => {
    const onVisibilityChange = () =>
      setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibilityChange);
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ background: BACKGROUND }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 3.3, 8.8], fov: 43, near: 0.1, far: 65 }}
        frameloop={reducedMotion || paused ? "demand" : "always"}
        dpr={[1, 1.25]}
        gl={{ antialias: true }}
        fallback={
          <div className="h-full w-full" style={{ background: BACKGROUND }} />
        }
      >
        <color attach="background" args={[BACKGROUND]} />
        <fog attach="fog" args={[BACKGROUND, 9, 24]} />
        <hemisphereLight args={["#fff7f2", "#b36742", 0.8]} />
        <directionalLight
          position={[-6, 9, -3]}
          color="#ffffff"
          intensity={2.3}
        />
        <directionalLight
          position={[5, 3, 5]}
          color="#ffede3"
          intensity={0.7}
        />

        <CameraRig />
        <LearningPlane reducedMotion={reducedMotion} paused={paused} />
      </Canvas>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #fae8d5 0%, #fae8d5d9 20%, #fae8d526 49%, transparent 68%), radial-gradient(ellipse at 18% 38%, #fae8d5a6, #fae8d54d 30%, transparent 65%)",
        }}
      />
    </div>
  );
}
/*

- Canvas: cria o renderer, a cena, a câmera e o ciclo de renderização, é a janela pro mundo 3D.

- mesh: combina uma geometria com um material.

- planeGeometry: cria o plano. Os dois primeiros números são largura e altura; os últimos são as subdivisões.

- meshBasicMaterial: define como a geometria será desenhada. Ele não precisa de iluminação.

- wireframe: mostra as arestas dos triângulos.

- rotation: usa radianos, não graus.

- camera.position: posiciona a câmera nos eixos x, y e z.

- fov: determina o campo de visão da câmera.

*/
