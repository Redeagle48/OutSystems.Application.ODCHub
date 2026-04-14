import { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";
import styles from "../styles/pages.module.css";

export function UsersPage() {
  const { data, isLoading, error, refetch } = useUsers();
  const [search, setSearch] = useState("");

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        row.status ? <StatusBadge status={String(row.status)} /> : "-",
    },
  ];

  const users = data ?? [];
  const filtered = search
    ? users.filter(
        (u) =>
          String(u.name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          String(u.email || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : users;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Users</h1>
          <p className={styles.headerSubtitle}>
            User management and access control
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <LoadingSpinner message="Loading users..." />}
      {error && (
        <ErrorAlert message={error.message} onRetry={() => refetch()} />
      )}
      {data && (
        <DataTable
          columns={columns}
          data={filtered as Record<string, unknown>[]}
          keyField="key"
          emptyMessage="No users found"
        />
      )}
    </div>
  );
}
