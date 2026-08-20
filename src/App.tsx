import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import { MissionsPage } from "./pages/MissionsPage";
import { PlayPage } from "./pages/PlayPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GrowthDemoPage } from "./pages/GrowthDemoPage";
import { DeliverablesPage } from "./pages/DeliverablesPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/deliverables" element={<DeliverablesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/demo-growth" element={<GrowthDemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
