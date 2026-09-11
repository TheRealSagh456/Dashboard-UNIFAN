import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ComponentsPage } from "./pages/components-page";
import { LandPage } from "./pages/land-page";
import { ImportPage } from "./pages/import-page";
import { HomePage } from "./pages/home-page";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/components" element={<ComponentsPage />} />
        <Route path="/" element={<LandPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/Import" element={<ImportPage />} />
        <Route path="/Home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
