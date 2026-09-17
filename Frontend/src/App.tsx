import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandPage } from "./pages/land-page";
import { HomePage } from "./pages/home-page";

const ComponentsPage = lazy(() =>
  import("./pages/components-page").then((module) => ({
    default: module.ComponentsPage,
  })),
);
const ImportPage = lazy(() =>
  import("./pages/import-page").then((module) => ({
    default: module.ImportPage,
  })),
);

function PageFallback() {
  return <div className="min-h-screen bg-canvas" aria-busy="true" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/components"
          element={
            <Suspense fallback={<PageFallback />}>
              <ComponentsPage />
            </Suspense>
          }
        />
        <Route path="/" element={<LandPage />} />
        <Route
          path="/import"
          element={
            <Suspense fallback={<PageFallback />}>
              <ImportPage />
            </Suspense>
          }
        />
        <Route
          path="/home"
          element={<Navigate to="/home/pesquisa-tecnologia-2026" replace />}
        />
        <Route path="/home/:pesquisaId" element={<HomePage />} />
        <Route
          path="/home/:pesquisaId/perguntas"
          element={<HomePage />}
        />
        <Route
          path="/home/:pesquisaId/perguntas/:perguntaId"
          element={<HomePage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
