import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useSettingsStatus } from "../hooks/useSettingsStatus";
import { LoadingSpinner } from "../components/LoadingSpinner";
import styles from "../styles/dashboard.module.css";

export function DashboardLayout() {
  const { data, isLoading } = useSettingsStatus();
  const location = useLocation();
  const onSettings = location.pathname.startsWith("/settings");

  if (isLoading && !onSettings) {
    return <LoadingSpinner message="Checking portal connection..." />;
  }

  if (data && !data.connected && !onSettings) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
