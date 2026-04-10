import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { ModelsPage } from "./pages/ModelsPage";
import { ChannelsPage } from "./pages/ChannelsPage";
import { LogsPage } from "./pages/LogsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/channels" element={<ChannelsPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
}

