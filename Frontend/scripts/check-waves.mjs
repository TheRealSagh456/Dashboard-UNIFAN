// Execute em Frontend: node scripts/check-waves.mjs
// Teste numérico e microbenchmark de CPU. Não é uma medição de FPS/GPU.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, ShaderLib, Texture, Vector2, Vector3 } from 'three';

const threeUrl = import.meta.resolve('three');
const modules = new Map();

function moduleUrl(name) {
  if (modules.has(name)) return modules.get(name);
  const source = readFileSync(new URL(`../src/feats/home/${name}.ts`, import.meta.url), 'utf8');
  let code = ts.transpile(source, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 });
  code = code.replace(/from "three"/g, `from "${threeUrl}"`);
  code = code.replace(/from "\.\/((?:wave|ripple)-[\w-]+)"/g, (_, dependency) => `from "${moduleUrl(dependency)}"`);
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(name, url);
  return url;
}

const { sampleWaveHeight } = await import(moduleUrl('wave-field'));
const { createWaveMaterials, createWaveUniforms, waveVertexFunctions, rippleVertexFunctions, displacementFunctions } = await import(moduleUrl('wave-materials'));
const { createWaveRaycast } = await import(moduleUrl('wave-raycast'));
const { RIPPLE_SETTINGS, rippleAmplitude, sampleRippleHeight, startRipple, updateRipples } = await import(moduleUrl('ripple-field'));

// Compara a expressão GLSL exportada com a referência JS em precisão dupla.
// Não substitui a compilação WebGL/precisão float32, que exige teste no navegador.
const scalarShader = (waveVertexFunctions + rippleVertexFunctions + displacementFunctions)
  .replace(/uniform [^;]+;/g, '')
  .replace(/float waveSquare\(float v\)/, 'function waveSquare(v)')
  .replace(/float waveHeightAt\(vec2 p\)/, 'function waveHeightAt(p)')
  .replace(/float rippleHeightAt\(float distance, float front, float amplitude\)/, 'function rippleHeightAt(distance, front, amplitude)')
  .replace(/float displacedHeightAt\(vec2 p\)/, 'function displacedHeightAt(p)')
  .replace(/ripple\.xy/g, 'ripple')
  .replace(/\b(?:float|int|vec4)\s+/g, 'let ');
const shaderEvaluator = new Function('p', 'uWaveTime', 'uRipples', `
  const { sin, exp, pow, max, sqrt } = Math;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  ${scalarShader}
  return displacedHeightAt(p);
`);
const uniforms = createWaveUniforms();
const starts = new Float64Array(RIPPLE_SETTINGS.capacity).fill(-Infinity);
function expectedHeight(x, y) {
  const rippleHeight = uniforms.uRipples.value.reduce((sum, ripple) => sum
    + sampleRippleHeight(Math.hypot(x - ripple.x, y - ripple.y), ripple.z, ripple.w), 0);
  return sampleWaveHeight(x, y, uniforms.uWaveTime.value) + rippleHeight;
}

// Regressão: o hover não deve voltar a alterar a superfície nem alimentar uniforms.
const sceneSource = readFileSync(new URL('../src/feats/home/hero-scene.tsx', import.meta.url), 'utf8');
assert.ok(!/onPointer(?:Move|Over|Enter|Leave|Out)\s*=/.test(sceneSource));
assert.deepEqual(Object.keys(uniforms).sort(), ['uRipples', 'uWaveTime']);
assert.ok(!/uWaveCursor|uWaveStrength/.test(waveVertexFunctions));

// Limite, reutilização sem cortar pulsos ativos e objetos sem alocações por frame.
const vectorIdentities = [...uniforms.uRipples.value];
for (let index = 0; index < RIPPLE_SETTINGS.capacity; index += 1) {
  assert.ok(startRipple(starts, uniforms.uRipples.value, index - 1, index * 0.5, 0));
}
assert.equal(startRipple(starts, uniforms.uRipples.value, 100, 100, 0.1), false);
updateRipples(starts, uniforms.uRipples.value, 0.6);
assert.equal(uniforms.uRipples.value.length, RIPPLE_SETTINGS.capacity);
assert.ok(uniforms.uRipples.value.every((ripple, index) => ripple === vectorIdentities[index] && ripple.w > 0));
updateRipples(starts, uniforms.uRipples.value, RIPPLE_SETTINGS.duration);
assert.ok(uniforms.uRipples.value.every((ripple) => ripple.w === 0));
assert.ok(startRipple(starts, uniforms.uRipples.value, -2, 1, RIPPLE_SETTINGS.duration));

// Propagação localizada, amortecimento, centro suave e superposição linear.
assert.equal(rippleAmplitude(0), 0);
assert.equal(rippleAmplitude(RIPPLE_SETTINGS.duration), 0);
assert.ok(rippleAmplitude(1) > rippleAmplitude(2));
for (const age of [0.05, 0.2, 0.6, 1.3, 3, 4.79]) {
  const front = age * RIPPLE_SETTINGS.speed;
  const amplitude = rippleAmplitude(age);
  assert.equal(sampleRippleHeight(front + 1, front, amplitude), 0);
  assert.ok(Math.abs(sampleRippleHeight(0.00001, front, amplitude) - sampleRippleHeight(0, front, amplitude)) < 1e-7);
  for (let radius = 0; radius < 20; radius += 0.1) {
    const height = sampleRippleHeight(radius, front, amplitude);
    assert.ok(Number.isFinite(height) && Math.abs(height) <= amplitude);
    assert.ok(Math.abs(sampleRippleHeight(radius, front, amplitude * 2) - 2 * height) < 1e-12);
  }
}
// Avaliação absoluta: a mesma idade produz o mesmo estado a 15, 30 ou 60 Hz.
for (const fps of [15, 30, 60]) {
  starts.fill(0);
  for (let frame = 0; frame <= fps; frame += 1) updateRipples(starts, uniforms.uRipples.value, frame / fps);
  assert.equal(uniforms.uRipples.value[0].z, RIPPLE_SETTINGS.speed);
  assert.equal(uniforms.uRipples.value[0].w, rippleAmplitude(1));
}

function setRippleScenario(time, activeCount) {
  starts.fill(-Infinity);
  for (let index = 0; index < activeCount; index += 1) {
    starts[index] = time - [0.12, 0.55, 1.2, 3.9][index];
    uniforms.uRipples.value[index].x = index - 1;
    uniforms.uRipples.value[index].y = index * 0.5;
  }
  updateRipples(starts, uniforms.uRipples.value, time);
}

let formulaSamples = 0;
for (const activeCount of [0, 1, RIPPLE_SETTINGS.capacity]) {
  for (const time of [0, 10, 30, 60]) {
    setRippleScenario(time, activeCount);
    uniforms.uWaveTime.value = time;
    for (let x = -10; x <= 10; x += 0.5) {
      for (let y = -8; y <= 12; y += 0.5) {
        const shaderHeight = shaderEvaluator({ x, y }, time, uniforms.uRipples.value);
        assert.ok(Math.abs(shaderHeight - expectedHeight(x, y)) < 1e-10);
        formulaSamples += 1;
      }
    }
  }
}

// Confirma os pontos de extensão dos materiais da versão instalada de Three.js.
const mask = new Texture();
const materials = createWaveMaterials(mask, false);
// Three.js recebe as mesmas cores sRGB dos tokens, sem conversão manual dupla.
const themeSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
for (const [color, token] of [[materials.surface.color, 'brand-500'], [materials.surface.sheenColor, 'brand-50'], [materials.particles.color, 'brand-100']]) {
  const hex = themeSource.match(new RegExp(`--color-${token}:\\s*#([\\da-f]{6})`, 'i'))?.[1];
  assert.ok(hex, `Token ausente: ${token}`);
  assert.equal(color.getHexString(), hex);
}
for (const [material, shaderSource] of [[materials.surface, ShaderLib.physical], [materials.particles, ShaderLib.points]]) {
  const shader = { uniforms: {}, vertexShader: shaderSource.vertexShader };
  material.onBeforeCompile(shader);
  assert.ok(shader.vertexShader.includes('displacedHeightAt(position.xy)'));
  assert.ok(!shader.vertexShader.includes('#include <begin_vertex>'));
  assert.equal(shader.uniforms.uWaveTime, materials.uniforms.uWaveTime);
  assert.equal(shader.uniforms.uRipples, materials.uniforms.uRipples);
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
  setRippleScenario(time, RIPPLE_SETTINGS.capacity);
  uniforms.uWaveTime.value = time;
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    positions.setZ(index, expectedHeight(positions.getX(index), positions.getY(index)));
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
        const target = new Vector3(x, y, expectedHeight(x, y)).applyMatrix4(dense.matrixWorld);
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

  // Raios rasantes da câmera real, além dos raios quase verticais acima.
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
      assert.equal(hits.length > 0, referenceHits.length > 0, `Camera miss ${column}, ${row}`);
      if (hits.length) {
        const error = Math.abs(hits[0].distance - referenceHits[0].distance);
        largestDistanceError = Math.max(largestDistanceError, error);
        assert.ok(error < 0.05, `Camera ray error ${error} at ${column}, ${row}`);
      }
      raySamples += 1;
    }
  }
}

analytic.matrixWorld.identity();
for (const [origin, direction, near, far] of [
  [new Vector3(100, 0, 8), new Vector3(0, 0, -1), 0, Infinity],
  [new Vector3(0, 0, 8), new Vector3(0, 0, 1), 0, Infinity],
  [new Vector3(0, 0, 8), new Vector3(0, 0, -1), 0, 0.5],
  [new Vector3(0, 0, 8), new Vector3(0, 0, -1), 20, Infinity],
]) {
  raycaster.set(origin, direction);
  raycaster.near = near;
  raycaster.far = far;
  hits.length = 0;
  analytic.raycast(raycaster, hits);
  assert.equal(hits.length, 0);
}

const summarize = (samples) => {
  samples.sort((a, b) => a - b);
  return { meanMs: +(samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(4), p95Ms: +samples[Math.floor(samples.length * 0.95)].toFixed(4) };
};
raycaster.near = 0;
raycaster.far = Infinity;
raycaster.set(new Vector3(3, 0, 8), new Vector3(0, 0, -1));
dense.matrixWorld.identity();
const before = [];
const after = [];
for (let index = 0; index < 80; index += 1) {
  hits.length = 0;
  let start = performance.now();
  dense.raycast(raycaster, hits);
  if (index >= 20) before.push(performance.now() - start);
  hits.length = 0;
  start = performance.now();
  analytic.raycast(raycaster, hits);
  if (index >= 20) after.push(performance.now() - start);
}
console.log(JSON.stringify({ formulaSamples, raySamples, largestDistanceError, cpuRaycastBefore: summarize(before), cpuRaycastAfter: summarize(after) }, null, 2));
geometry.dispose();
dense.material.dispose();
analytic.geometry.dispose();
analytic.material.dispose();
materials.surface.dispose();
materials.particles.dispose();
mask.dispose();
