// Execute em Frontend: node scripts/check-waves.mjs
// Teste numérico e microbenchmark de CPU. Não é uma medição de FPS/GPU.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, ShaderLib, Texture, Vector3 } from 'three';

const threeUrl = import.meta.resolve('three');
const modules = new Map();

function moduleUrl(name) {
  if (modules.has(name)) return modules.get(name);
  const source = readFileSync(new URL(`../src/feats/home/${name}.ts`, import.meta.url), 'utf8');
  let code = ts.transpile(source, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 });
  code = code.replace(/from "three"/g, `from "${threeUrl}"`);
  code = code.replace(/from "\.\/(wave-[\w-]+)"/g, (_, dependency) => `from "${moduleUrl(dependency)}"`);
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(name, url);
  return url;
}

const { sampleWaveHeight, WAVE_SETTINGS } = await import(moduleUrl('wave-field'));
const { createWaveMaterials, createWaveUniforms, waveVertexFunctions } = await import(moduleUrl('wave-materials'));
const { createWaveRaycast } = await import(moduleUrl('wave-raycast'));

// Compara a expressão GLSL exportada com a referência JS em precisão dupla.
// A compilação real do shader e a precisão float32 são verificadas no navegador.
const scalarShader = waveVertexFunctions
  .replace(/uniform [^;]+;/g, '')
  .replace(/float waveSquare\(float v\)/, 'function waveSquare(v)')
  .replace(/float waveHeightAt\(vec2 p\)/, 'function waveHeightAt(p)')
  .replace(/\bfloat\s+/g, 'let ');
const shaderEvaluator = new Function('p', 'uWaveTime', 'uWaveCursor', 'uWaveStrength', `
  const { sin, exp, pow, max } = Math;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  ${scalarShader}
  return waveHeightAt(p);
`);
const uniforms = createWaveUniforms();
const cursor = uniforms.uWaveCursor.value.set(2.5, -0.4);
function expectedHeight(x, y) {
  const influence = Math.max(0, 1 - Math.hypot(x - cursor.x, y - cursor.y) / WAVE_SETTINGS.cursorRadius);
  return sampleWaveHeight(x, y, uniforms.uWaveTime.value) - influence ** 2 * WAVE_SETTINGS.cursorDepth * uniforms.uWaveStrength.value;
}

let formulaSamples = 0;
for (const time of [0, 10, 30, 60]) {
  for (const strength of [0, 0.5, 1]) {
    uniforms.uWaveTime.value = time;
    uniforms.uWaveStrength.value = strength;
    for (let x = -10; x <= 10; x += 0.5) {
      for (let y = -8; y <= 12; y += 0.5) {
        const shaderHeight = shaderEvaluator({ x, y }, time, cursor, strength);
        assert.ok(Math.abs(shaderHeight - expectedHeight(x, y)) < 1e-10);
        formulaSamples += 1;
      }
    }
  }
}

// Confirma os pontos de extensão dos materiais da versão instalada de Three.js.
const mask = new Texture();
const materials = createWaveMaterials(mask, false);
for (const [material, shaderSource] of [[materials.surface, ShaderLib.physical], [materials.particles, ShaderLib.points]]) {
  const shader = { uniforms: {}, vertexShader: shaderSource.vertexShader };
  material.onBeforeCompile(shader);
  assert.ok(shader.vertexShader.includes('waveHeightAt(position.xy)') || shader.vertexShader.includes('float waveHeight ='));
  assert.ok(!shader.vertexShader.includes('#include <begin_vertex>'));
  assert.equal(shader.uniforms.uWaveTime, materials.uniforms.uWaveTime);
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
  uniforms.uWaveStrength.value = 0.75;
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
