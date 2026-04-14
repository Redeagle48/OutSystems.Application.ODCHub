import { NavLink } from "react-router-dom";
import {
  Globe,
  Package,
  Rocket,
  GitBranch,
  ShieldCheck,
  Users,
  Settings,
} from "lucide-react";
import styles from "../styles/sidebar.module.css";

const links = [
  { to: "/environments", label: "Environments", icon: Globe },
  { to: "/assets", label: "Assets", icon: Package },
  { to: "/deployments", label: "Deployments", icon: Rocket },
  { to: "/dependencies", label: "Dependencies", icon: GitBranch },
  { to: "/code-quality", label: "Code Quality", icon: ShieldCheck },
  { to: "/users", label: "Users", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoAccent}>OS</span> ODC Hub
      </div>
      <nav className={styles.nav}>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
