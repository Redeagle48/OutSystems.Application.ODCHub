import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { EnvironmentsPage } from "./pages/EnvironmentsPage";
import { AssetsPage } from "./pages/AssetsPage";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { DependenciesPage } from "./pages/DependenciesPage";
import { UsersPage } from "./pages/UsersPage";
import { CodeQualityPage } from "./pages/CodeQualityPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/environments" replace />} />
        <Route path="environments" element={<EnvironmentsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/:assetKey" element={<AssetDetailPage />} />
        <Route path="deployments" element={<DeploymentsPage />} />
        <Route path="dependencies" element={<DependenciesPage />} />
        <Route path="code-quality" element={<CodeQualityPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
