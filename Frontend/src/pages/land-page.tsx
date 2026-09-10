import { lazy, Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Button, Text } from "../components";

const HeroScene = lazy(() => import("../feats/home/hero-scene").then((module) => ({ default: module.HeroScene })));

export function HomePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-paper">
      <Suspense fallback={<div aria-hidden="true" className="absolute inset-0 bg-[#fae8d5]" />}>
        <HeroScene />
      </Suspense>
      <section className="pointer-events-none relative z-10 flex min-h-screen items-center px-6 py-24 md:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
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
              <Button size="lg">
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
