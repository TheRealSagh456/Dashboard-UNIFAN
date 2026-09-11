// Pacotes de ondas radiais: aproximação de uma membrana, não um solver de fluido.
export const RIPPLE_SETTINGS = {
  capacity: 4,
  speed: 3,
  wavelength: 1.6,
  packetWidth: 3.2,
  amplitude: 0.38,
  damping: 0.38,
  spreading: 0.65,
  duration: 4.8,
  attack: 0.16,
  release: 0.8,
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

export function rippleAmplitude(age: number) {
  const settings = RIPPLE_SETTINGS;
  if (age <= 0 || age >= settings.duration) return 0;
  return settings.amplitude * Math.exp(-settings.damping * age)
    * smoothUnit(age / settings.attack)
    * smoothUnit((settings.duration - age) / settings.release);
}

// z é o raio da frente; w é a amplitude já amortecida no tempo.
// Esse pré-cálculo acontece só quatro vezes por frame, não por vértice.
export function updateRipples(starts: Float64Array, ripples: RippleVector[], time: number) {
  for (let index = 0; index < ripples.length; index += 1) {
    const age = time - starts[index];
    ripples[index].z = Number.isFinite(age) ? age * RIPPLE_SETTINGS.speed : 0;
    ripples[index].w = rippleAmplitude(age);
  }
}

export function startRipple(starts: Float64Array, ripples: RippleVector[], x: number, y: number, time: number) {
  const index = starts.findIndex((start) => time - start >= RIPPLE_SETTINGS.duration);
  // Não corta uma onda ativa para abrir espaço: preserva a continuidade da malha.
  if (index < 0) return false;
  starts[index] = time;
  ripples[index].x = x;
  ripples[index].y = y;
  ripples[index].z = 0;
  ripples[index].w = 0;
  return true;
}

export function sampleRippleHeight(distance: number, front: number, amplitude: number) {
  if (amplitude === 0) return 0;
  // Suaviza a derivada no centro, evitando uma ponta no local do clique.
  const radius = Math.sqrt(distance * distance + 0.04) - 0.2;
  const offset = radius - front;
  if (offset >= 0 || offset <= -RIPPLE_SETTINGS.packetWidth) return 0;
  const envelope = Math.sin(Math.PI * offset / RIPPLE_SETTINGS.packetWidth);
  const oscillation = Math.sin(2 * Math.PI * offset / RIPPLE_SETTINGS.wavelength);
  return amplitude * envelope * envelope * oscillation
    / Math.sqrt(1 + RIPPLE_SETTINGS.spreading * radius);
}
