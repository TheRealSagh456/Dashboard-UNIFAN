// Coroas de luz: o clique altera o brilho, nunca a altura da superfície.
export const RIPPLE_SETTINGS = {
  capacity: 4,
  speed: 3,
  color: "#e7a878", // Pêssego original, antes de brand-500.
  intensity: 3.8, // Emissão acima de 1 para um núcleo luminoso após o tone mapping.
  coreWidth: 0.085,
  haloWidth: 0.55,
  haloStrength: 0.32,
  damping: 0.24,
  duration: 4.8,
  attack: 0.12,
  release: 1.15,
} as const;

interface RippleVector {
  x: number;
  y: number;
  z: number;
  w: number;
}

function smoothUnit(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

export function rippleStrength(age: number) {
  const settings = RIPPLE_SETTINGS;
  if (age <= 0 || age >= settings.duration) return 0;
  return Math.exp(-settings.damping * age)
    * smoothUnit(age / settings.attack)
    * smoothUnit((settings.duration - age) / settings.release);
}

// z é o raio do anel; w é a força do brilho já amortecida no tempo.
// Esse pré-cálculo acontece só quatro vezes por frame, não por vértice.
export function updateRipples(starts: Float64Array, ripples: RippleVector[], time: number) {
  for (let index = 0; index < ripples.length; index += 1) {
    const age = time - starts[index];
    ripples[index].z = Number.isFinite(age) ? age * RIPPLE_SETTINGS.speed : 0;
    ripples[index].w = rippleStrength(age);
  }
}

export function startRipple(starts: Float64Array, ripples: RippleVector[], x: number, y: number, time: number) {
  const index = starts.findIndex((start) => time - start >= RIPPLE_SETTINGS.duration);
  // Não apaga um anel ativo para abrir espaço: evita cortes bruscos de luz.
  if (index < 0) return false;
  starts[index] = time;
  ripples[index].x = x;
  ripples[index].y = y;
  ripples[index].z = 0;
  ripples[index].w = 0;
  return true;
}

// Referência numérica do fragment shader, usada pelos testes.
export function sampleGlowRing(distance: number, radius: number, strength: number, pixelWidth = 0.01) {
  if (strength <= 0) return 0;
  const offset = Math.abs(distance - radius);
  const feather = Math.max(pixelWidth, 0.01);
  const core = 1 - smoothUnit((offset - RIPPLE_SETTINGS.coreWidth) / feather);
  const halo = 1 - smoothUnit(offset / RIPPLE_SETTINGS.haloWidth);
  return (core + halo * halo * RIPPLE_SETTINGS.haloStrength) * strength;
}
