import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Text } from "../components/ui/typography";

const HeroScene = lazy(() =>
  import("../feats/home/hero-scene").then((module) => ({
    default: module.HeroScene,
  })),
);

export function LandPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() === true;
  const [sceneReady, setSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => setSceneReady(true), 1800);
    return () => window.clearTimeout(fallbackTimer);
  }, []);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-paper">
      <Suspense
        fallback={
          <div aria-hidden="true" className="absolute inset-0 bg-canvas" />
        }
      >
        <HeroScene onReady={handleSceneReady} />
      </Suspense>
      <section className="pointer-events-none relative z-10 flex min-h-screen items-center px-6 py-24 md:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: sceneReady ? 1 : 0,
              y: sceneReady ? 0 : reducedMotion ? 0 : 24,
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.7,
              ease: "easeOut",
            }}
          >
            <Text as="p" variant="eyebrow" tone="accent" className="mb-5">
              UNIFAN Analytics
            </Text>

            <Text as="h1" variant="display" className="max-w-lg">
              Transforme respostas em insights.
            </Text>

            <Text className="mt-6 max-w-md text-base" tone="muted">
              Importe seus dados, visualize padrões e descubra o que realmente
              importa.
            </Text>

            <motion.div
              className="pointer-events-auto mt-8 w-fit"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 600, damping: 40 }}
            >
              <Button size="lg" onClick={() => navigate("/import")}>
                Importar pesquisa
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
