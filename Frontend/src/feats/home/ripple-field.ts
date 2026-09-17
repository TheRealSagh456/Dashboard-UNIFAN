import { sampleWaveHeight } from "./wave-field";

// Coroas de luz: o clique altera o brilho, nunca a altura da superfície.
export const RIPPLE_SETTINGS = {
  capacity: 20,
  speed: 3,
  color: "#ffffff",
  intensity: 3.8, // Emissão acima de 1 para um núcleo luminoso após o tone mapping.
  coreWidth: 0.085,
  haloWidth: 0.55,
  haloStrength: 0.32,
  damping: 0.24,
  duration: 4.8,
  attack: 0.12,
  release: 1.15,
  minimumCollisionDistance: 0.25,
  bounceSpeed: 3.6,
  bounceDuration: 1.65,
  bounceAttack: 0.055,
  bounceRelease: 0.65,
  directionalCollisionThreshold: 0.05,
  collisionScanStep: 1 / 90,
} as const;

export const SPARK_SETTINGS = {
  burstCapacity: 20,
  particlesPerBurst: 14,
  duration: 0.78,
  gravity: 4.8,
  color: "#ffffff",
} as const;

interface RippleVector {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface DirectionVector {
  x: number;
  y: number;
}

export interface RippleState {
  starts: Float64Array;
  kinds: Uint8Array;
  origins: Float32Array;
  directions: Float32Array;
  usedInUpdate: Uint8Array;
  lastUpdateTime: number;
}

export interface RippleCollision {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  time: number;
}

export interface SparkState {
  starts: Float64Array;
  origins: Float32Array;
  directions: Float32Array;
}

export const RIPPLE_KIND = {
  inactive: 0,
  radial: 1,
  directional: 2,
} as const;

function smoothUnit(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

export function rippleStrength(age: number) {
  const settings = RIPPLE_SETTINGS;
  if (age <= 0 || age >= settings.duration) return 0;
  return (
    Math.exp(-settings.damping * age) *
    smoothUnit(age / settings.attack) *
    smoothUnit((settings.duration - age) / settings.release)
  );
}

export function bounceStrength(age: number) {
  const settings = RIPPLE_SETTINGS;
  if (age < 0 || age >= settings.bounceDuration) return 0;
  return (
    Math.exp(-settings.damping * age * 0.7) *
    smoothUnit(age / settings.bounceAttack) *
    smoothUnit((settings.bounceDuration - age) / settings.bounceRelease)
  );
}

export function createRippleState(): RippleState {
  return {
    starts: new Float64Array(RIPPLE_SETTINGS.capacity).fill(-Infinity),
    kinds: new Uint8Array(RIPPLE_SETTINGS.capacity),
    origins: new Float32Array(RIPPLE_SETTINGS.capacity * 2),
    directions: new Float32Array(RIPPLE_SETTINGS.capacity * 2),
    usedInUpdate: new Uint8Array(RIPPLE_SETTINGS.capacity),
    lastUpdateTime: -Infinity,
  };
}

export function clearRippleState(state: RippleState) {
  state.starts.fill(-Infinity);
  state.kinds.fill(RIPPLE_KIND.inactive);
  state.origins.fill(0);
  state.directions.fill(0);
  state.usedInUpdate.fill(0);
  state.lastUpdateTime = -Infinity;
}

function slotDuration(state: RippleState, index: number) {
  return state.kinds[index] === RIPPLE_KIND.directional
    ? RIPPLE_SETTINGS.bounceDuration
    : RIPPLE_SETTINGS.duration;
}

function slotHasFinished(state: RippleState, index: number, time: number) {
  return (
    state.kinds[index] === RIPPLE_KIND.inactive ||
    time - state.starts[index] >= slotDuration(state, index)
  );
}

export function startRipple(
  state: RippleState,
  ripples: RippleVector[],
  x: number,
  y: number,
  time: number,
) {
  const index = state.starts.findIndex((_, slot) =>
    slotHasFinished(state, slot, time),
  );
  // Não apaga um efeito ativo para abrir espaço: evita cortes bruscos de luz.
  if (index < 0) return false;

  state.starts[index] = time;
  state.kinds[index] = RIPPLE_KIND.radial;
  state.origins[index * 2] = x;
  state.origins[index * 2 + 1] = y;
  state.directions[index * 2] = 0;
  state.directions[index * 2 + 1] = 0;
  ripples[index].x = x;
  ripples[index].y = y;
  ripples[index].z = 0;
  ripples[index].w = 0;
  return true;
}

interface CollisionPoint {
  x: number;
  y: number;
  time: number;
}

function isActiveAt(state: RippleState, index: number, time: number) {
  const age = time - state.starts[index];
  return (
    state.kinds[index] !== RIPPLE_KIND.inactive &&
    age >= 0 &&
    age < slotDuration(state, index)
  );
}

function radiusAt(state: RippleState, index: number, time: number) {
  const speed =
    state.kinds[index] === RIPPLE_KIND.directional
      ? RIPPLE_SETTINGS.bounceSpeed
      : RIPPLE_SETTINGS.speed;
  return Math.max(0, time - state.starts[index]) * speed;
}

function acceptsCollisionPoint(
  state: RippleState,
  index: number,
  x: number,
  y: number,
) {
  if (state.kinds[index] === RIPPLE_KIND.radial) return true;
  const offset = index * 2;
  const deltaX = x - state.origins[offset];
  const deltaY = y - state.origins[offset + 1];
  const length = Math.hypot(deltaX, deltaY);
  if (length < 1e-6) return false;
  const alignment =
    (deltaX * state.directions[offset] +
      deltaY * state.directions[offset + 1]) /
    length;
  return alignment >= RIPPLE_SETTINGS.directionalCollisionThreshold;
}

function intersectionAt(
  state: RippleState,
  first: number,
  second: number,
  time: number,
): CollisionPoint | null {
  if (!isActiveAt(state, first, time) || !isActiveAt(state, second, time)) {
    return null;
  }

  const firstOffset = first * 2;
  const secondOffset = second * 2;
  const differenceX =
    state.origins[secondOffset] - state.origins[firstOffset];
  const differenceY =
    state.origins[secondOffset + 1] - state.origins[firstOffset + 1];
  const distance = Math.hypot(differenceX, differenceY);
  if (distance < RIPPLE_SETTINGS.minimumCollisionDistance) return null;

  const firstRadius = radiusAt(state, first, time);
  const secondRadius = radiusAt(state, second, time);
  if (
    firstRadius + secondRadius < distance ||
    Math.abs(firstRadius - secondRadius) > distance
  ) {
    return null;
  }

  const axisX = differenceX / distance;
  const axisY = differenceY / distance;
  const along =
    (firstRadius * firstRadius - secondRadius * secondRadius +
      distance * distance) /
    (2 * distance);
  const heightSquared = Math.max(
    0,
    firstRadius * firstRadius - along * along,
  );
  const height = Math.sqrt(heightSquared);
  const baseX = state.origins[firstOffset] + axisX * along;
  const baseY = state.origins[firstOffset + 1] + axisY * along;
  const candidates = [
    { x: baseX - axisY * height, y: baseY + axisX * height, time },
    { x: baseX + axisY * height, y: baseY - axisX * height, time },
  ];

  return (
    candidates.find(
      (point) =>
        acceptsCollisionPoint(state, first, point.x, point.y) &&
        acceptsCollisionPoint(state, second, point.x, point.y),
    ) ?? null
  );
}

function findRadialCollision(
  state: RippleState,
  first: number,
  second: number,
  latestTime: number,
): CollisionPoint | null {
  const firstOffset = first * 2;
  const secondOffset = second * 2;
  const differenceX =
    state.origins[secondOffset] - state.origins[firstOffset];
  const differenceY =
    state.origins[secondOffset + 1] - state.origins[firstOffset + 1];
  const distance = Math.hypot(differenceX, differenceY);
  if (distance < RIPPLE_SETTINGS.minimumCollisionDistance) return null;

  const collisionTime =
    (distance / RIPPLE_SETTINGS.speed +
      state.starts[first] +
      state.starts[second]) /
    2;
  const latestStart = Math.max(state.starts[first], state.starts[second]);
  const latestEnd = Math.min(
    state.starts[first] + RIPPLE_SETTINGS.duration,
    state.starts[second] + RIPPLE_SETTINGS.duration,
  );
  if (
    collisionTime < latestStart ||
    collisionTime >= latestEnd ||
    collisionTime > latestTime
  ) {
    return null;
  }

  const directionX = differenceX / distance;
  const directionY = differenceY / distance;
  const firstRadius =
    (collisionTime - state.starts[first]) * RIPPLE_SETTINGS.speed;
  return {
    x: state.origins[firstOffset] + directionX * firstRadius,
    y: state.origins[firstOffset + 1] + directionY * firstRadius,
    time: collisionTime,
  };
}

function findDirectionalCollision(
  state: RippleState,
  first: number,
  second: number,
  previousTime: number,
  latestTime: number,
): CollisionPoint | null {
  const start = Math.max(
    Number.isFinite(previousTime) ? previousTime : -Infinity,
    state.starts[first],
    state.starts[second],
  );
  const end = Math.min(
    latestTime,
    state.starts[first] + slotDuration(state, first),
    state.starts[second] + slotDuration(state, second),
  );
  if (!Number.isFinite(start) || end < start) return null;

  const steps = Math.max(
    1,
    Math.ceil((end - start) / RIPPLE_SETTINGS.collisionScanStep),
  );
  let lastTime = start;
  let point = intersectionAt(state, first, second, start);
  if (point) return point;

  for (let step = 1; step <= steps; step += 1) {
    const sampleTime = start + ((end - start) * step) / steps;
    point = intersectionAt(state, first, second, sampleTime);
    if (point) {
      let left = lastTime;
      let right = sampleTime;
      for (let iteration = 0; iteration < 8; iteration += 1) {
        const middle = (left + right) / 2;
        if (intersectionAt(state, first, second, middle)) right = middle;
        else left = middle;
      }
      return intersectionAt(state, first, second, right) ?? point;
    }
    lastTime = sampleTime;
  }
  return null;
}

function applyCollision(
  state: RippleState,
  first: number,
  second: number,
  point: CollisionPoint,
  onCollision?: (collision: RippleCollision) => void,
) {
  const firstOffset = first * 2;
  const secondOffset = second * 2;
  const differenceX =
    state.origins[secondOffset] - state.origins[firstOffset];
  const differenceY =
    state.origins[secondOffset + 1] - state.origins[firstOffset + 1];
  const distance = Math.hypot(differenceX, differenceY);
  if (distance < RIPPLE_SETTINGS.minimumCollisionDistance) return;
  const directionX = differenceX / distance;
  const directionY = differenceY / distance;

  for (const [index, sign] of [
    [first, -1],
    [second, 1],
  ] as const) {
    const offset = index * 2;
    state.starts[index] = point.time;
    state.kinds[index] = RIPPLE_KIND.directional;
    state.origins[offset] = point.x;
    state.origins[offset + 1] = point.y;
    state.directions[offset] = directionX * sign;
    state.directions[offset + 1] = directionY * sign;
  }

  onCollision?.({
    x: point.x,
    y: point.y,
    directionX,
    directionY,
    time: point.time,
  });
}

function findCollisions(
  state: RippleState,
  time: number,
  onCollision?: (collision: RippleCollision) => void,
) {
  const used = state.usedInUpdate;
  used.fill(0);

  for (let first = 0; first < RIPPLE_SETTINGS.capacity; first += 1) {
    if (used[first] || !isActiveAt(state, first, time)) continue;

    for (let second = first + 1; second < RIPPLE_SETTINGS.capacity; second += 1) {
      if (used[second] || !isActiveAt(state, second, time)) continue;
      const bothRadial =
        state.kinds[first] === RIPPLE_KIND.radial &&
        state.kinds[second] === RIPPLE_KIND.radial;
      const collision = bothRadial
        ? findRadialCollision(state, first, second, time)
        : findDirectionalCollision(
            state,
            first,
            second,
            state.lastUpdateTime,
            time,
          );
      if (collision) {
        applyCollision(state, first, second, collision, onCollision);
        used[first] = 1;
        used[second] = 1;
        break;
      }
    }
  }

  state.lastUpdateTime = time;
}

// z é o raio e w é a força já amortecida. As coroas originais somem no
// contato; cada uma reaparece como um arco que se afasta na direção oposta.
export function updateRipples(
  state: RippleState,
  ripples: RippleVector[],
  bounces: RippleVector[],
  directions: DirectionVector[],
  time: number,
  onCollision?: (collision: RippleCollision) => void,
) {
  findCollisions(state, time, onCollision);

  for (let index = 0; index < ripples.length; index += 1) {
    const age = time - state.starts[index];
    const offset = index * 2;
    const active = isActiveAt(state, index, time);
    const directional = state.kinds[index] === RIPPLE_KIND.directional;
    ripples[index].x = state.origins[offset];
    ripples[index].y = state.origins[offset + 1];
    ripples[index].z = active && !directional ? radiusAt(state, index, time) : 0;
    ripples[index].w = active && !directional ? rippleStrength(age) : 0;

    bounces[index].x = state.origins[offset];
    bounces[index].y = state.origins[offset + 1];
    bounces[index].z = active && directional ? radiusAt(state, index, time) : 0;
    bounces[index].w = active && directional ? bounceStrength(age) : 0;
    directions[index].x = state.directions[offset];
    directions[index].y = state.directions[offset + 1];

    if (!active && age >= slotDuration(state, index)) {
      state.kinds[index] = RIPPLE_KIND.inactive;
    }
  }
}

export function createSparkState(): SparkState {
  return {
    starts: new Float64Array(SPARK_SETTINGS.burstCapacity).fill(-Infinity),
    origins: new Float32Array(SPARK_SETTINGS.burstCapacity * 2),
    directions: new Float32Array(SPARK_SETTINGS.burstCapacity * 2),
  };
}

export function clearSparkState(state: SparkState) {
  state.starts.fill(-Infinity);
  state.origins.fill(0);
  state.directions.fill(0);
}

export function startSparkBurst(
  state: SparkState,
  collision: RippleCollision,
) {
  let index = state.starts.findIndex(
    (start) => collision.time - start >= SPARK_SETTINGS.duration,
  );
  if (index < 0) {
    let oldest = Infinity;
    for (let slot = 0; slot < state.starts.length; slot += 1) {
      if (state.starts[slot] < oldest) {
        oldest = state.starts[slot];
        index = slot;
      }
    }
  }
  state.starts[index] = collision.time;
  state.origins[index * 2] = collision.x;
  state.origins[index * 2 + 1] = collision.y;
  state.directions[index * 2] = collision.directionX;
  state.directions[index * 2 + 1] = collision.directionY;
}

function randomUnit(seed: number) {
  const value = Math.sin(seed * 91.345 + 17.123) * 47453.5453;
  return value - Math.floor(value);
}

export function updateSparkBuffers(
  state: SparkState,
  positions: Float32Array,
  alphas: Float32Array,
  time: number,
  waveTime: number,
) {
  const { particlesPerBurst, duration, gravity } = SPARK_SETTINGS;

  for (let burst = 0; burst < SPARK_SETTINGS.burstCapacity; burst += 1) {
    const originX = state.origins[burst * 2];
    const originY = state.origins[burst * 2 + 1];
    const axisAngle = Math.atan2(
      state.directions[burst * 2 + 1],
      state.directions[burst * 2],
    );

    for (let spark = 0; spark < particlesPerBurst; spark += 1) {
      const particle = burst * particlesPerBurst + spark;
      const offset = particle * 3;
      const delayedAge = time - state.starts[burst] - spark * 0.009;
      if (delayedAge <= 0 || delayedAge >= duration) {
        alphas[particle] = 0;
        continue;
      }

      const side = spark % 2 === 0 ? 0 : Math.PI;
      const spread = (randomUnit(particle + 1) - 0.5) * 1.7;
      const angle = axisAngle + side + spread;
      const speed = 0.9 + randomUnit(particle + 19) * 2.4;
      const lift = 1.35 + randomUnit(particle + 47) * 2.1;
      const x = originX + Math.cos(angle) * speed * delayedAge;
      const y = originY + Math.sin(angle) * speed * delayedAge;
      const height =
        sampleWaveHeight(x, y, waveTime) +
        0.08 +
        lift * delayedAge -
        gravity * delayedAge * delayedAge * 0.5;
      const life = 1 - delayedAge / duration;

      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = height;
      alphas[particle] = smoothUnit(delayedAge / 0.045) * life * life;
    }
  }
}

// Referência numérica do fragment shader, usada pelos testes.
export function sampleGlowRing(
  distance: number,
  radius: number,
  strength: number,
  pixelWidth = 0.01,
) {
  if (strength <= 0) return 0;
  const offset = Math.abs(distance - radius);
  const feather = Math.max(pixelWidth, 0.01);
  const core =
    1 - smoothUnit((offset - RIPPLE_SETTINGS.coreWidth) / feather);
  const halo = 1 - smoothUnit(offset / RIPPLE_SETTINGS.haloWidth);
  return (core + halo * halo * RIPPLE_SETTINGS.haloStrength) * strength;
}
