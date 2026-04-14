import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import styles from "../styles/dashboard.module.css";

export function DashboardLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
