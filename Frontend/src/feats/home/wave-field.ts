// Unidades da cena, não pixels. Estes são os controles para experimentar.
export const WAVE_SETTINGS = {
  width: 28,
  depth: 22,
  segmentsX: 288,
  segmentsY: 224,
  amplitude: 1.15,
  speed: 0.24,
  cursorRadius: 0.8,
  cursorDepth: 0.65,
} as const;

export function sampleWaveHeight(x: number, y: number, time: number) {
  const phase = time * WAVE_SETTINGS.speed;

  // A coordenada também ondula: as cristas deixam de formar linhas retas.
  const bend = Math.sin(x * 0.38 + phase * 0.4) * 1.2;
  const swell = Math.sin(y * 0.82 + x * 0.22 + bend - phase);
  const foldedSwell = Math.pow((swell + 1) * 0.5, 1.7) * 1.35;
  const crossingSwell = Math.sin(x * 0.46 - y * 0.18 + phase * 0.6) * 0.38;

  // Uma crista larga à direita e um vale central reproduzem a composição.
  const ridgeCenter = 3.8 + Math.sin(y * 0.32 + phase * 0.35) * 1.1;
  const ridge = Math.exp(-((x - ridgeCenter) ** 2) / 5 - ((y - 0.8) ** 2) / 28) * 1.65;
  const valley = Math.exp(-((x + 0.8) ** 2) / 7 - ((y - 0.2) ** 2) / 12) * 0.62;
  const frontCurve = -4.2 + Math.sin(x * 0.36 + phase * 0.3) * 1.15;
  const foregroundFold = Math.exp(-((y - frontCurve) ** 2) / 1.3) * 0.85;
  const detail = Math.sin(x * 1.35 + y * 0.9 + phase) * 0.045;

  return (foldedSwell + crossingSwell + ridge + foregroundFold - valley + detail - 0.55) * WAVE_SETTINGS.amplitude;
}
