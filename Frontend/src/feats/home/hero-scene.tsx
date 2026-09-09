import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PlaneGeometry, Points, PointsMaterial } from "three";
import { Vector2 } from "three";

const PLANE_SIZE = 5;

function LearningPLane() {
  const pointsRef = useRef<Points<PlaneGeometry, PointsMaterial>>(null);
  const cursorPosition = useRef(new Vector2(999, 999));

  useFrame(({ clock }) => {
    const points = pointsRef.current;

    if (!points) {
      return;
    }

    const positions = points.geometry.attributes.position;
    const time = clock.elapsedTime;

    const cursorX = cursorPosition.current.x;
    const cursorY = cursorPosition.current.y;

    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);

      const horizontalWave = Math.sin(x * 2 + time) * 0.18;
      const verticalWave = Math.cos(y * 1.5 + time * 0.8) * 0.12;

      const distanceX = x - cursorX;
      const distanceY = y - cursorY;

      const distance = Math.hypot(distanceX, distanceY);

      const radius = 1.1;

      const influence = Math.max(0, 1 - distance / radius);

      const cursorLift = influence * influence * -0.5;

      const height = horizontalWave + verticalWave + cursorLift;

      positions.setZ(index, height);
    }

    positions.needsUpdate = true;
  });

  return (
    <group rotation={[-Math.PI / 2.4, 0, 0]}>
      <points ref={pointsRef}>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE, 64, 64]} />

        <pointsMaterial
          color="#c56e32"
          size={0.08}
          sizeAttenuation
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </points>

      <mesh
        onPointerMove={(event) => {
          if (!event.uv) {
            return;
          }

          cursorPosition.current.set(
            (event.uv.x - 0.5) * PLANE_SIZE,
            (event.uv.y - 0.5) * PLANE_SIZE,
          );
        }}
        onPointerLeave={() => {
          cursorPosition.current.set(999, 999);
        }}
      >
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />

        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <div className="h-full w-full overflow-hidden rounded-[2rem] border border-line bg-paper">
      <Canvas camera={{ position: [0, 1.5, 10], fov: 25 }}>
        <color attach="background" args={["#fffaf4"]} />
        <LearningPLane />
      </Canvas>
    </div>
  );
}
/*

- Canvas: cria o renderer, a cena, a câmera e o ciclo de renderização.

- mesh: combina uma geometria com um material.

- planeGeometry: cria o plano. Os dois primeiros números são largura e altura; os últimos são as subdivisões.

- meshBasicMaterial: define como a geometria será desenhada. Ele não precisa de iluminação.

- wireframe: mostra as arestas dos triângulos.

- rotation: usa radianos, não graus.

- camera.position: posiciona a câmera nos eixos x, y e z.

- fov: determina o campo de visão da câmera.

*/
