import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ComponentsPage } from "./pages/components-page";
import { HomePage } from "./pages/land-page";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/components" element={<ComponentsPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
