import {
  FrontSide,
  MeshPhysicalMaterial,
  PointsMaterial,
  Vector4,
} from "three";
import type { Material, Texture } from "three";
import { WAVE_SETTINGS } from "./wave-field";
import { RIPPLE_SETTINGS } from "./ripple-field";

// Uniforms são poucos valores compartilhados por todos os vértices na GPU.
export function createWaveUniforms() {
  return {
    uWaveTime: { value: 0 },
    uRipples: { value: Array.from({ length: RIPPLE_SETTINGS.capacity }, () => new Vector4(0, 0, 0, 0)) },
  };
}

export type WaveUniforms = ReturnType<typeof createWaveUniforms>;

export const waveVertexFunctions = `
  uniform float uWaveTime;

  float waveSquare(float v) { return v * v; }

  float waveHeightAt(vec2 p) {
    float x = p.x;
    float y = p.y;
    float phase = uWaveTime * ${WAVE_SETTINGS.speed.toFixed(4)};
    float bend = sin(x * 0.38 + phase * 0.4) * 1.2;
    float swell = sin(y * 0.82 + x * 0.22 + bend - phase);
    float foldedSwell = pow(max((swell + 1.0) * 0.5, 0.0), 1.7) * 1.35;
    float crossingSwell = sin(x * 0.46 - y * 0.18 + phase * 0.6) * 0.38;
    float ridgeCenter = 3.8 + sin(y * 0.32 + phase * 0.35) * 1.1;
    float ridge = exp(-waveSquare(x - ridgeCenter) / 5.0 - waveSquare(y - 0.8) / 28.0) * 1.65;
    float valley = exp(-waveSquare(x + 0.8) / 7.0 - waveSquare(y - 0.2) / 12.0) * 0.62;
    float frontCurve = -4.2 + sin(x * 0.36 + phase * 0.3) * 1.15;
    float foregroundFold = exp(-waveSquare(y - frontCurve) / 1.3) * 0.85;
    float detail = sin(x * 1.35 + y * 0.9 + phase) * 0.045;
    float height = (foldedSwell + crossingSwell + ridge + foregroundFold - valley + detail - 0.55)
      * ${WAVE_SETTINGS.amplitude.toFixed(4)};
    return height;
  }
`;

// A mesma expressão de sampleRippleHeight, executada em paralelo na GPU.
export const rippleVertexFunctions = /* glsl */ `
  float rippleHeightAt(float distance, float front, float amplitude) {
    if (amplitude == 0.0) return 0.0;
    float radius = sqrt(distance * distance + 0.04) - 0.2;
    float offset = radius - front;
    if (offset >= 0.0 || offset <= -${RIPPLE_SETTINGS.packetWidth.toFixed(4)}) return 0.0;
    float envelope = sin(3.141592653589793 * offset / ${RIPPLE_SETTINGS.packetWidth.toFixed(4)});
    float oscillation = sin(6.283185307179586 * offset / ${RIPPLE_SETTINGS.wavelength.toFixed(4)});
    return amplitude * envelope * envelope * oscillation
      / sqrt(1.0 + ${RIPPLE_SETTINGS.spreading.toFixed(4)} * radius);
  }
`;

export const displacementFunctions = /* glsl */ `
  uniform vec4 uRipples[${RIPPLE_SETTINGS.capacity}];

  float displacedHeightAt(vec2 p) {
    float height = waveHeightAt(p);
    for (int i = 0; i < ${RIPPLE_SETTINGS.capacity}; i++) {
      vec4 ripple = uRipples[i];
      if (ripple.w > 0.0) {
        height += rippleHeightAt(distance(p, ripple.xy), ripple.z, ripple.w);
      }
    }
    return height;
  }
`;

function addWaveDeformation(
  material: Material,
  uniforms: WaveUniforms,
  surface: boolean,
) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>\n${waveVertexFunctions}\n${rippleVertexFunctions}\n${displacementFunctions}`,
    );

    if (surface) {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `
          float waveHeight = displacedHeightAt(position.xy);
          float epsilon = 0.025;
          vec3 objectNormal = normalize(vec3(
            waveHeight - displacedHeightAt(position.xy + vec2(epsilon, 0.0)),
            waveHeight - displacedHeightAt(position.xy + vec2(0.0, epsilon)),
            epsilon
          ));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif
        `,
      );
    }

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `vec3 transformed = vec3(position.xy, ${surface ? "waveHeight" : "displacedHeightAt(position.xy)"});`,
    );
  };

  material.customProgramCacheKey = () =>
    `wave-v2-${surface}-${waveVertexFunctions}-${rippleVertexFunctions}-${displacementFunctions}`;
}

export function createWaveMaterials(mask: Texture, compact: boolean) {
  const uniforms = createWaveUniforms();
  const surface = new MeshPhysicalMaterial({
    color: "#c56e32", // --color-brand-500 em index.css.
    roughness: 0.88,
    metalness: 0,
    sheen: 0.55,
    sheenColor: "#fff3e8", // --color-brand-50.
    sheenRoughness: 0.85,
    specularIntensity: 0.25,
    side: FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const particles = new PointsMaterial({
    color: "#f8dfca", // --color-brand-100.
    vertexColors: true,
    alphaMap: mask,
    size: compact ? 0.048 : 0.034,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
    alphaTest: 0.015,
    depthWrite: false,
  });

  addWaveDeformation(surface, uniforms, true);
  addWaveDeformation(particles, uniforms, false);
  surface.userData.waveUniforms = uniforms;
  surface.userData.rippleStarts = new Float64Array(RIPPLE_SETTINGS.capacity).fill(-Infinity);
  return { surface, particles, uniforms };
}
