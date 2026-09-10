import { Matrix4, Ray, Vector3 } from "three";
import type { Mesh } from "three";
import { sampleWaveHeight, WAVE_SETTINGS } from "./wave-field";
import type { WaveUniforms } from "./wave-materials";

export function createWaveRaycast(uniforms: WaveUniforms): Mesh["raycast"] {
  const inverse = new Matrix4();
  const localRay = new Ray();
  const point = new Vector3();
  const minimum = [-WAVE_SETTINGS.width / 2, 2 - WAVE_SETTINGS.depth / 2, -4];
  const maximum = [WAVE_SETTINGS.width / 2, 2 + WAVE_SETTINGS.depth / 2, 6];

  function residual(distance: number) {
    localRay.at(distance, point);
    const cursor = uniforms.uWaveCursor.value;
    const influence = Math.max(
      0,
      1 -
        Math.hypot(point.x - cursor.x, point.y - cursor.y) /
          WAVE_SETTINGS.cursorRadius,
    );
    const lift =
      influence *
      influence *
      WAVE_SETTINGS.cursorDepth *
      uniforms.uWaveStrength.value;
    return (
      point.z -
      sampleWaveHeight(point.x, point.y, uniforms.uWaveTime.value) +
      lift
    );
  }

  return function (this: Mesh, raycaster, intersections) {
    inverse.copy(this.matrixWorld).invert();
    localRay.copy(raycaster.ray).applyMatrix4(inverse);

    let near = 0;
    let far = Infinity;
    for (let axis = 0; axis < 3; axis += 1) {
      const origin = localRay.origin.getComponent(axis);
      const direction = localRay.direction.getComponent(axis);
      if (Math.abs(direction) < 1e-8) {
        if (origin < minimum[axis] || origin > maximum[axis]) return;
      } else {
        const a = (minimum[axis] - origin) / direction;
        const b = (maximum[axis] - origin) / direction;
        near = Math.max(near, Math.min(a, b));
        far = Math.min(far, Math.max(a, b));
      }
    }
    if (far <= near) return;

    const steps = Math.min(192, Math.max(1, Math.ceil((far - near) / 0.2)));
    const step = (far - near) / steps;
    let previousDistance = near;
    let previousResidual = residual(near);

    for (let index = 1; index <= steps; index += 1) {
      const currentDistance = near + step * index;
      const currentResidual = residual(currentDistance);
      if (previousResidual * currentResidual <= 0) {
        let left = previousDistance;
        let right = currentDistance;
        let leftResidual = previousResidual;
        for (let iteration = 0; iteration < 12; iteration += 1) {
          const middle = (left + right) / 2;
          const middleResidual = residual(middle);
          if (leftResidual * middleResidual <= 0) {
            right = middle;
          } else {
            left = middle;
            leftResidual = middleResidual;
          }
        }
        localRay.at((left + right) / 2, point);
        const worldPoint = point.clone().applyMatrix4(this.matrixWorld);
        const distance = raycaster.ray.origin.distanceTo(worldPoint);
        if (distance >= raycaster.near && distance <= raycaster.far) {
          intersections.push({ distance, point: worldPoint, object: this });
        }
        return;
      }
      previousDistance = currentDistance;
      previousResidual = currentResidual;
    }
  };
}
