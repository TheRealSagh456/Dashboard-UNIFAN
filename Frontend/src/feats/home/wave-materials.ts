import {
  Color,
  FrontSide,
  MeshPhysicalMaterial,
  PointsMaterial,
  Vector2,
  Vector4,
} from "three";
import type { Material, Texture } from "three";
import { WAVE_SETTINGS } from "./wave-field";
import { RIPPLE_SETTINGS } from "./ripple-field";

// Uniforms são poucos valores compartilhados por todos os vértices na GPU.
export function createWaveUniforms() {
  return {
    uWaveTime: { value: 0 },
    uGlowColor: { value: new Color(RIPPLE_SETTINGS.color) },
    uGlowIntensity: { value: RIPPLE_SETTINGS.intensity },
    uRipples: { value: Array.from({ length: RIPPLE_SETTINGS.capacity }, () => new Vector4(0, 0, 0, 0)) },
    uRippleBounces: { value: Array.from({ length: RIPPLE_SETTINGS.capacity }, () => new Vector4(0, 0, 0, 0)) },
    uBounceDirections: { value: Array.from({ length: RIPPLE_SETTINGS.capacity }, () => new Vector2(0, 0)) },
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

// Coroa fina + halo suave, sem deslocamento e sem uma passagem extra de bloom.
export const glowRingFunction = /* glsl */ `
  float glowRingAt(float radialDistance, float radius, float strength, float pixelWidth) {
    if (strength <= 0.0) return 0.0;
    float offset = abs(radialDistance - radius);
    float feather = max(pixelWidth, 0.01);
    float core = 1.0 - smoothstep(${RIPPLE_SETTINGS.coreWidth.toFixed(4)}, ${RIPPLE_SETTINGS.coreWidth.toFixed(4)} + feather, offset);
    float halo = 1.0 - smoothstep(0.0, ${RIPPLE_SETTINGS.haloWidth.toFixed(4)}, offset);
    return (core + halo * halo * ${RIPPLE_SETTINGS.haloStrength.toFixed(4)}) * strength;
  }
`;

const glowFragmentFunctions = /* glsl */ `
  varying vec2 vWavePosition;
  uniform vec4 uRipples[${RIPPLE_SETTINGS.capacity}];
  uniform vec4 uRippleBounces[${RIPPLE_SETTINGS.capacity}];
  uniform vec2 uBounceDirections[${RIPPLE_SETTINGS.capacity}];
  uniform vec3 uGlowColor;
  uniform float uGlowIntensity;
  ${glowRingFunction}

  float glowAt(vec2 p) {
    float glow = 0.0;
    // Derivadas fora dos branches: antialiasing mesmo nas partes distantes.
    float pixelWidth = max(length(fwidth(p)), 0.01);
    for (int i = 0; i < ${RIPPLE_SETTINGS.capacity}; i++) {
      vec4 ripple = uRipples[i];
      if (ripple.w > 0.0) {
        glow += glowRingAt(distance(p, ripple.xy), ripple.z, ripple.w, pixelWidth);
      }

      vec4 bounce = uRippleBounces[i];
      if (bounce.w > 0.0) {
        vec2 delta = p - bounce.xy;
        float radialDistance = length(delta);
        vec2 heading = delta / max(radialDistance, 0.001);
        float alignment = dot(heading, uBounceDirections[i]);
        float directionalMask = smoothstep(-0.2, 0.72, alignment);
        float reflectedRing = glowRingAt(
          radialDistance,
          bounce.z,
          bounce.w,
          pixelWidth
        );
        glow += reflectedRing * directionalMask * (0.82 + max(alignment, 0.0) * 0.38);
      }
    }
    // Sobreposições iluminam mais, sem estourar a tela com vários cliques.
    return min(glow, 1.7);
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
      `#include <common>\n${waveVertexFunctions}\nvarying vec2 vWavePosition;`,
    );

    if (surface) {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `
          float waveHeight = waveHeightAt(position.xy);
          float epsilon = 0.025;
          vec3 objectNormal = normalize(vec3(
            waveHeight - waveHeightAt(position.xy + vec2(epsilon, 0.0)),
            waveHeight - waveHeightAt(position.xy + vec2(0.0, epsilon)),
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
      `vWavePosition = position.xy;\nvec3 transformed = vec3(position.xy, ${surface ? "waveHeight" : "waveHeightAt(position.xy)"});`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>\n${glowFragmentFunctions}`,
    ).replace(
      "#include <opaque_fragment>",
      /* glsl */ `
        float ringGlow = glowAt(vWavePosition);
        // Um centro perolado conserva o pêssego nas bordas do halo.
        vec3 ringColor = mix(uGlowColor, vec3(1.0), smoothstep(0.7, 1.3, ringGlow) * 0.22);
        outgoingLight += ringColor * ringGlow * uGlowIntensity * ${surface ? "1.0" : "0.7"};
        #include <opaque_fragment>
      `,
    );
  };

  material.customProgramCacheKey = () =>
    `wave-glow-v4-${surface}-${waveVertexFunctions}-${glowFragmentFunctions}`;
}

export function createWaveMaterials(
  mask: Texture,
  compact: boolean,
  darkTheme = false,
) {
  const uniforms = createWaveUniforms();
  const surface = new MeshPhysicalMaterial({
    color: darkTheme ? "#0874f9" : "#c56e32", // --color-brand-500.
    roughness: 0.88,
    metalness: 0,
    sheen: 0.55,
    sheenColor: darkTheme ? "#78b8ff" : "#fff3e8",
    sheenRoughness: 0.85,
    specularIntensity: 0.25,
    side: FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const particles = new PointsMaterial({
    color: darkTheme ? "#c4e0ff" : "#f8dfca",
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
  return { surface, particles, uniforms };
}
