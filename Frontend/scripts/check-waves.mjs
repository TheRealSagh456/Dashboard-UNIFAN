// Execute em Frontend: node scripts/check-waves.mjs
// Teste numérico e microbenchmark de CPU. Não é uma medição de FPS/GPU.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  ShaderLib,
  Texture,
  Vector2,
  Vector3,
} from "three";

const threeUrl = import.meta.resolve("three");
const modules = new Map();

function moduleUrl(name) {
  if (modules.has(name)) return modules.get(name);
  const source = readFileSync(
    new URL(`../src/feats/home/${name}.ts`, import.meta.url),
    "utf8",
  );
  let code = ts.transpile(source, {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  });
  code = code.replace(/from "three"/g, `from "${threeUrl}"`);
  code = code.replace(
    /from "\.\/((?:wave|ripple)-[\w-]+)"/g,
    (_, dependency) => `from "${moduleUrl(dependency)}"`,
  );
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  modules.set(name, url);
  return url;
}

const { sampleWaveHeight, WAVE_SETTINGS } = await import(moduleUrl("wave-field"));
const {
  createWaveMaterials,
  createWaveUniforms,
  glowRingFunction,
  waveVertexFunctions,
} = await import(moduleUrl("wave-materials"));
const { createWaveRaycast } = await import(moduleUrl("wave-raycast"));
const {
  RIPPLE_SETTINGS,
  RIPPLE_KIND,
  SPARK_SETTINGS,
  bounceStrength,
  createRippleState,
  createSparkState,
  rippleStrength,
  sampleGlowRing,
  startRipple,
  startSparkBurst,
  updateRipples,
  updateSparkBuffers,
} = await import(moduleUrl("ripple-field"));

const scalarShader = waveVertexFunctions
  .replace(/uniform [^;]+;/g, "")
  .replace(/float waveSquare\(float v\)/, "function waveSquare(v)")
  .replace(/float waveHeightAt\(vec2 p\)/, "function waveHeightAt(p)")
  .replace(/\bfloat\s+/g, "let ");
const shaderEvaluator = new Function(
  "p",
  "uWaveTime",
  `
    const { sin, exp, pow, max } = Math;
    ${scalarShader}
    return waveHeightAt(p);
  `,
);

const uniforms = createWaveUniforms();
assert.deepEqual(Object.keys(uniforms).sort(), [
  "uBounceDirections",
  "uGlowColor",
  "uGlowIntensity",
  "uRippleBounces",
  "uRipples",
  "uWaveTime",
]);
assert.equal(uniforms.uGlowColor.value.getHexString(), RIPPLE_SETTINGS.color.slice(1));
assert.equal(uniforms.uGlowIntensity.value, RIPPLE_SETTINGS.intensity);

const sceneSource = readFileSync(
  new URL("../src/feats/home/hero-scene.tsx", import.meta.url),
  "utf8",
);
assert.ok(!/onPointer(?:Move|Over|Enter|Leave|Out)\s*=/.test(sceneSource));
assert.ok(!/uWaveCursor|uWaveStrength/.test(waveVertexFunctions));
assert.ok(glowRingFunction.includes("glowRingAt"));

let formulaSamples = 0;
for (const time of [0, 10, 30, 60]) {
  uniforms.uWaveTime.value = time;
  for (let x = -10; x <= 10; x += 0.5) {
    for (let y = -8; y <= 12; y += 0.5) {
      const shaderHeight = shaderEvaluator({ x, y }, time);
      assert.ok(Math.abs(shaderHeight - sampleWaveHeight(x, y, time)) < 1e-10);
      formulaSamples += 1;
    }
  }
}

const rippleState = createRippleState();
const vectorIdentities = [...uniforms.uRipples.value];
const bounceIdentities = [...uniforms.uRippleBounces.value];
for (let index = 0; index < RIPPLE_SETTINGS.capacity; index += 1) {
  assert.ok(
    startRipple(rippleState, uniforms.uRipples.value, 0, 0, 0),
  );
}
assert.equal(
  startRipple(rippleState, uniforms.uRipples.value, 100, 100, 0.1),
  false,
);
updateRipples(
  rippleState,
  uniforms.uRipples.value,
  uniforms.uRippleBounces.value,
  uniforms.uBounceDirections.value,
  0.6,
);
assert.ok(
  uniforms.uRipples.value.every(
    (ripple, index) => ripple === vectorIdentities[index] && ripple.w > 0,
  ),
);
assert.ok(
  uniforms.uRippleBounces.value.every(
    (bounce, index) => bounce === bounceIdentities[index] && bounce.w === 0,
  ),
);
updateRipples(
  rippleState,
  uniforms.uRipples.value,
  uniforms.uRippleBounces.value,
  uniforms.uBounceDirections.value,
  RIPPLE_SETTINGS.duration,
);
assert.ok(uniforms.uRipples.value.every((ripple) => ripple.w === 0));
assert.ok(
  startRipple(
    rippleState,
    uniforms.uRipples.value,
    -2,
    1,
    RIPPLE_SETTINGS.duration,
  ),
);

assert.equal(rippleStrength(0), 0);
assert.equal(rippleStrength(RIPPLE_SETTINGS.duration), 0);
assert.ok(rippleStrength(0.5) > rippleStrength(2));
assert.equal(bounceStrength(RIPPLE_SETTINGS.bounceDuration), 0);
assert.ok(bounceStrength(0.2) > 0);

const collisionState = createRippleState();
const collisionUniforms = createWaveUniforms();
assert.ok(startRipple(collisionState, collisionUniforms.uRipples.value, -3, 0, 0));
assert.ok(startRipple(collisionState, collisionUniforms.uRipples.value, 3, 0, 0));
const collisions = [];
updateRipples(
  collisionState,
  collisionUniforms.uRipples.value,
  collisionUniforms.uRippleBounces.value,
  collisionUniforms.uBounceDirections.value,
  0.99,
  (collision) => collisions.push(collision),
);
assert.equal(collisions.length, 0);
updateRipples(
  collisionState,
  collisionUniforms.uRipples.value,
  collisionUniforms.uRippleBounces.value,
  collisionUniforms.uBounceDirections.value,
  1.1,
  (collision) => collisions.push(collision),
);
assert.equal(collisions.length, 1);
assert.ok(Math.abs(collisions[0].x) < 1e-12);
assert.ok(Math.abs(collisions[0].y) < 1e-12);
assert.equal(collisions[0].time, 1);
assert.equal(collisionUniforms.uRipples.value[0].w, 0);
assert.equal(collisionUniforms.uRipples.value[1].w, 0);
assert.ok(collisionUniforms.uRippleBounces.value[0].w > 0);
assert.ok(collisionUniforms.uRippleBounces.value[1].w > 0);
assert.equal(collisionUniforms.uBounceDirections.value[0].x, -1);
assert.equal(collisionUniforms.uBounceDirections.value[1].x, 1);
assert.ok(
  Math.abs(
    collisionUniforms.uRippleBounces.value[0].z -
      RIPPLE_SETTINGS.bounceSpeed * 0.1,
  ) < 1e-12,
);
updateRipples(
  collisionState,
  collisionUniforms.uRipples.value,
  collisionUniforms.uRippleBounces.value,
  collisionUniforms.uBounceDirections.value,
  1.2,
  (collision) => collisions.push(collision),
);
assert.equal(collisions.length, 1);

// Uma rebatida para a direita encontra uma terceira coroa criada depois.
assert.ok(
  startRipple(
    collisionState,
    collisionUniforms.uRipples.value,
    3,
    0,
    1.2,
  ),
);
updateRipples(
  collisionState,
  collisionUniforms.uRipples.value,
  collisionUniforms.uRippleBounces.value,
  collisionUniforms.uBounceDirections.value,
  1.6,
  (collision) => collisions.push(collision),
);
assert.equal(collisions.length, 2);
assert.ok(collisions[1].x > 1.8 && collisions[1].x < 2.1);
assert.ok(Math.abs(collisions[1].y) < 0.02);
assert.equal(collisionState.kinds[1], RIPPLE_KIND.directional);
assert.equal(collisionState.kinds[2], RIPPLE_KIND.directional);
assert.equal(collisionUniforms.uBounceDirections.value[1].x, -1);
assert.equal(collisionUniforms.uBounceDirections.value[2].x, 1);
assert.ok(collisionUniforms.uRippleBounces.value[1].w > 0);
assert.ok(collisionUniforms.uRippleBounces.value[2].w > 0);

const sparkState = createSparkState();
for (const collision of collisions) startSparkBurst(sparkState, collision);
const sparkCount =
  SPARK_SETTINGS.burstCapacity * SPARK_SETTINGS.particlesPerBurst;
const sparkPositions = new Float32Array(sparkCount * 3);
const sparkAlphas = new Float32Array(sparkCount);
updateSparkBuffers(sparkState, sparkPositions, sparkAlphas, 1.7, 1.7);
assert.ok(sparkAlphas.some((alpha) => alpha > 0));
assert.ok(sparkPositions.every(Number.isFinite));
updateSparkBuffers(sparkState, sparkPositions, sparkAlphas, 3, 3);
assert.ok(sparkAlphas.every((alpha) => alpha === 0));

let glowSamples = 0;
for (const age of [0.05, 0.2, 0.6, 1.3, 3, 4.79]) {
  const radius = age * RIPPLE_SETTINGS.speed;
  const strength = rippleStrength(age);
  const center = sampleGlowRing(radius, radius, strength);
  assert.ok(center > 0);
  assert.ok(
    Math.abs(
      sampleGlowRing(radius - 0.2, radius, strength) -
        sampleGlowRing(radius + 0.2, radius, strength),
    ) < 1e-12,
  );
  assert.equal(sampleGlowRing(radius + RIPPLE_SETTINGS.haloWidth, radius, strength), 0);
  for (let distance = 0; distance < 20; distance += 0.1) {
    const glow = sampleGlowRing(distance, radius, strength);
    assert.ok(Number.isFinite(glow) && glow >= 0);
    glowSamples += 1;
  }
}

for (const fps of [15, 30, 60]) {
  const frameState = createRippleState();
  for (let index = 0; index < RIPPLE_SETTINGS.capacity; index += 1) {
    startRipple(frameState, uniforms.uRipples.value, 0, 0, 0);
  }
  for (let frame = 0; frame <= fps; frame += 1) {
    updateRipples(
      frameState,
      uniforms.uRipples.value,
      uniforms.uRippleBounces.value,
      uniforms.uBounceDirections.value,
      frame / fps,
    );
  }
  assert.equal(uniforms.uRipples.value[0].z, RIPPLE_SETTINGS.speed);
  assert.equal(uniforms.uRipples.value[0].w, rippleStrength(1));
}

const mask = new Texture();
const materials = createWaveMaterials(mask, false);
const themeSource = readFileSync(
  new URL("../src/index.css", import.meta.url),
  "utf8",
);
for (const [color, token] of [
  [materials.surface.color, "brand-500"],
  [materials.surface.sheenColor, "brand-50"],
  [materials.particles.color, "brand-100"],
]) {
  const hex = themeSource.match(
    new RegExp(`--color-${token}:\\s*#([\\da-f]{6})`, "i"),
  )?.[1];
  assert.ok(hex, `Token ausente: ${token}`);
  assert.equal(color.getHexString(), hex);
}

for (const [material, shaderSource] of [
  [materials.surface, ShaderLib.physical],
  [materials.particles, ShaderLib.points],
]) {
  const shader = {
    uniforms: {},
    vertexShader: shaderSource.vertexShader,
    fragmentShader: shaderSource.fragmentShader,
  };
  material.onBeforeCompile(shader);
  assert.ok(shader.vertexShader.includes("waveHeightAt(position.xy)"));
  assert.ok(shader.fragmentShader.includes("glowRingAt"));
  assert.ok(shader.fragmentShader.includes("directionalMask"));
  assert.equal(shader.uniforms.uWaveTime, materials.uniforms.uWaveTime);
  assert.equal(shader.uniforms.uRipples, materials.uniforms.uRipples);
  assert.equal(
    shader.uniforms.uRippleBounces,
    materials.uniforms.uRippleBounces,
  );
  assert.equal(
    shader.uniforms.uBounceDirections,
    materials.uniforms.uBounceDirections,
  );
  assert.equal(shader.uniforms.uGlowColor, materials.uniforms.uGlowColor);
  assert.equal(shader.uniforms.uGlowIntensity, materials.uniforms.uGlowIntensity);
}

const geometry = new PlaneGeometry(28, 22, 288, 224);
geometry.translate(0, 2, 0);
const dense = new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }));
const analytic = new Mesh();
analytic.raycast = createWaveRaycast(uniforms);
const raycaster = new Raycaster();
const hits = [];
const referenceHits = [];
let raySamples = 0;
let largestDistanceError = 0;

for (const time of [0, 17, 60]) {
  uniforms.uWaveTime.value = time;
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    positions.setZ(
      index,
      sampleWaveHeight(positions.getX(index), positions.getY(index), time),
    );
  }
  geometry.computeBoundingSphere();
  for (const rotated of [false, true]) {
    dense.rotation.set(rotated ? -Math.PI / 2 : 0, 0, rotated ? -0.08 : 0);
    dense.position.set(0, rotated ? -1.6 : 0, 0);
    dense.updateMatrixWorld(true);
    analytic.matrixWorld.copy(dense.matrixWorld);
    for (let x = -8; x <= 8; x += 2) {
      for (let y = -6; y <= 10; y += 2) {
        const origin = new Vector3(x, y - 1, 8).applyMatrix4(dense.matrixWorld);
        const target = new Vector3(
          x,
          y,
          sampleWaveHeight(x, y, time),
        ).applyMatrix4(dense.matrixWorld);
        raycaster.set(origin, target.sub(origin).normalize());
        hits.length = referenceHits.length = 0;
        analytic.raycast(raycaster, hits);
        dense.raycast(raycaster, referenceHits);
        referenceHits.sort((a, b) => a.distance - b.distance);
        assert.equal(hits.length > 0, referenceHits.length > 0);
        assert.ok(hits.length > 0);
        const error = Math.abs(hits[0].distance - referenceHits[0].distance);
        largestDistanceError = Math.max(largestDistanceError, error);
        assert.ok(error < 0.04, `Ray error ${error} at ${x}, ${y}`);
        raySamples += 1;
      }
    }
  }

  const camera = new PerspectiveCamera(43, 16 / 9, 0.1, 65);
  camera.position.set(0, 3.3, 8.8);
  camera.lookAt(0, -0.1, -3.2);
  camera.updateMatrixWorld(true);
  for (let column = -4; column <= 4; column += 1) {
    for (let row = -4; row <= 2; row += 1) {
      raycaster.setFromCamera(new Vector2(column / 5, row / 5), camera);
      hits.length = referenceHits.length = 0;
      analytic.raycast(raycaster, hits);
      dense.raycast(raycaster, referenceHits);
      referenceHits.sort((a, b) => a.distance - b.distance);
      assert.equal(hits.length > 0, referenceHits.length > 0);
      if (hits.length) {
        const error = Math.abs(hits[0].distance - referenceHits[0].distance);
        largestDistanceError = Math.max(largestDistanceError, error);
        assert.ok(error < 0.05, `Camera ray error ${error}`);
      }
      raySamples += 1;
    }
  }
}

console.log(
  JSON.stringify(
    { formulaSamples, glowSamples, raySamples, largestDistanceError },
    null,
    2,
  ),
);
geometry.dispose();
dense.material.dispose();
analytic.geometry.dispose();
analytic.material.dispose();
materials.surface.dispose();
materials.particles.dispose();
mask.dispose();
