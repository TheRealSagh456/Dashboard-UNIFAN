import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/land-page";

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
        <Route path="/" element={<HomePage />} />
        <Route
          path="/import"
          element={
            <Suspense fallback={<PageFallback />}>
              <ImportPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
