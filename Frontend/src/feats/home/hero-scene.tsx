import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DataTexture,
  DynamicDrawUsage,
  Float32BufferAttribute,
  LinearFilter,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  Mesh,
} from "three";
import { WAVE_SETTINGS } from "./wave-field";
import { createWaveMaterials } from "./wave-materials";
import type { WaveUniforms } from "./wave-materials";
import { createWaveRaycast } from "./wave-raycast";
import {
  clearRippleState,
  clearSparkState,
  createRippleState,
  createSparkState,
  SPARK_SETTINGS,
  startRipple,
  startSparkBurst,
  updateRipples,
  updateSparkBuffers,
} from "./ripple-field";

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
  const { width, depth } = WAVE_SETTINGS;
  const segments = compact
    ? WAVE_SETTINGS.compactParticleSegments
    : WAVE_SETTINGS.particleSegments;
  const geometry = new PlaneGeometry(width, depth, ...segments);
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
  if (particles.boundingSphere) particles.boundingSphere.radius += 8;
  geometry.dispose();
  return particles;
}

function createSurfaceGeometry(compact: boolean) {
  const segments = compact
    ? WAVE_SETTINGS.compactSurfaceSegments
    : WAVE_SETTINGS.surfaceSegments;
  const geometry = new PlaneGeometry(
    WAVE_SETTINGS.width,
    WAVE_SETTINGS.depth,
    ...segments,
  );
  geometry.translate(0, 2, 0);
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius += 8;
  return geometry;
}

function createSparkGeometry() {
  const count =
    SPARK_SETTINGS.burstCapacity * SPARK_SETTINGS.particlesPerBurst;
  const geometry = new BufferGeometry();
  const positions = new Float32BufferAttribute(new Float32Array(count * 3), 3);
  const alphas = new Float32BufferAttribute(new Float32Array(count), 1);
  const sizes = new Float32BufferAttribute(new Float32Array(count), 1);
  positions.setUsage(DynamicDrawUsage);
  alphas.setUsage(DynamicDrawUsage);

  for (let index = 0; index < count; index += 1) {
    const variation = Math.sin(index * 73.17 + 19.41) * 43758.5453;
    sizes.setX(index, 3.2 + (variation - Math.floor(variation)) * 3.6);
  }

  geometry.setAttribute("position", positions);
  geometry.setAttribute("aAlpha", alphas);
  geometry.setAttribute("aSize", sizes);
  return geometry;
}

function createSparkMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uSparkColor: { value: new Color(SPARK_SETTINGS.color) },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aSize;
      varying float vAlpha;

      void main() {
        vAlpha = aAlpha;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * clamp(7.0 / max(-viewPosition.z, 1.0), 0.72, 1.45);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSparkColor;
      varying float vAlpha;

      void main() {
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float softEdge = 1.0 - smoothstep(0.12, 0.5, distanceToCenter);
        float hotCore = 1.0 - smoothstep(0.0, 0.2, distanceToCenter);
        vec3 color = mix(uSparkColor, vec3(1.0), hotCore * 0.75);
        gl_FragColor = vec4(color, softEdge * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
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
  const sparkGeometry = useMemo(() => createSparkGeometry(), []);
  const sparkMaterial = useMemo(() => createSparkMaterial(), []);
  const materials = useMemo(
    () => createWaveMaterials(particleMask, compact),
    [particleMask, compact],
  );
  const raycast = useMemo(
    () => createWaveRaycast(materials.uniforms),
    [materials],
  );
  const surfaceRef = useRef<Mesh<PlaneGeometry>>(null);
  const localHit = useRef(new Vector3());
  const rippleState = useMemo(() => createRippleState(), []);
  const sparkState = useMemo(() => createSparkState(), []);

  const resuming = useRef(true);

  useEffect(() => {
    resuming.current = true;
  }, [paused, reducedMotion]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => particleGeometry.dispose(), [particleGeometry]);
  useEffect(() => () => sparkGeometry.dispose(), [sparkGeometry]);
  useEffect(() => () => sparkMaterial.dispose(), [sparkMaterial]);
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
      for (const ripple of uniforms.uRipples.value) ripple.w = 0;
      for (const bounce of uniforms.uRippleBounces.value) bounce.w = 0;
      clearRippleState(rippleState);
      clearSparkState(sparkState);
      const alphas = sparkGeometry.getAttribute(
        "aAlpha",
      ) as Float32BufferAttribute;
      (alphas.array as Float32Array).fill(0);
      alphas.needsUpdate = true;
      return;
    }
    if (paused) return;
    // Tempo real entre frames, sem desacelerar a física em aparelhos mais lentos.
    // Ao retomar, descarta somente o intervalo em que a cena ficou pausada.
    const step = resuming.current ? 0 : delta;
    resuming.current = false;
    uniforms.uWaveTime.value += step;
    // Conjunto fixo de impulsos: sem percorrer a malha nem atualizar estado React.
    updateRipples(
      rippleState,
      uniforms.uRipples.value,
      uniforms.uRippleBounces.value,
      uniforms.uBounceDirections.value,
      uniforms.uWaveTime.value,
      (collision) => startSparkBurst(sparkState, collision),
    );
    const positions = sparkGeometry.getAttribute(
      "position",
    ) as Float32BufferAttribute;
    const alphas = sparkGeometry.getAttribute(
      "aAlpha",
    ) as Float32BufferAttribute;
    updateSparkBuffers(
      sparkState,
      positions.array as Float32Array,
      alphas.array as Float32Array,
      uniforms.uWaveTime.value,
      uniforms.uWaveTime.value,
    );
    positions.needsUpdate = true;
    alphas.needsUpdate = true;
  });

  return (
    <group rotation={[-Math.PI / 2, 0, -0.08]} position={[0, -1.6, 0]}>
      <mesh
        ref={surfaceRef}
        geometry={geometry}
        material={materials.surface}
        raycast={raycast}
        onClick={(event) => {
          if (reducedMotion || paused || event.button !== 0 || event.delta > 5)
            return;
          const surface = surfaceRef.current;
          if (!surface || Array.isArray(surface.material)) return;
          const uniforms = surface.material.userData
            .waveUniforms as WaveUniforms;
          event.object.worldToLocal(localHit.current.copy(event.point));
          startRipple(
            rippleState,
            uniforms.uRipples.value,
            localHit.current.x,
            localHit.current.y,
            uniforms.uWaveTime.value,
          );
        }}
      />

      <points
        geometry={particleGeometry}
        material={materials.particles}
        position={[0, 0, 0.025]}
        raycast={() => {}}
      />

      <points
        geometry={sparkGeometry}
        material={sparkMaterial}
        frustumCulled={false}
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
        camera={{ position: [0, 3.8, 8.8], fov: 38, near: 0.1, far: 65 }}
        frameloop={reducedMotion || paused ? "demand" : "always"}
        dpr={1}
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
