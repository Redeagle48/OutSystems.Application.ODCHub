import { useState, useMemo, Fragment } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from "lucide-react";
import styles from "../styles/table.module.css";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  emptyMessage?: string;
  renderExpanded?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = "No data available",
  renderExpanded,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {renderExpanded && <th className={styles.expandTh} />}
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={
                  col.sortable !== false ? () => handleSort(col.key) : undefined
                }
              >
                {col.label}
                {col.sortable !== false && (
                  <span
                    className={`${styles.sortIcon} ${sortKey === col.key ? styles.sortIconActive : ""}`}
                  >
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )
                    ) : (
                      <ArrowUpDown size={14} />
                    )}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={renderExpanded ? columns.length + 1 : columns.length} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const rowKey = String(row[keyField]);
              const isExpanded = expandedKey === rowKey;
              return (
                <Fragment key={rowKey}>
                  <tr>
                    {renderExpanded && (
                      <td
                        className={styles.expandTd}
                        onClick={() => setExpandedKey(isExpanded ? null : rowKey)}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(row)
                          : String(row[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                  {renderExpanded && isExpanded && (
                    <tr key={`${rowKey}-expanded`} className={styles.expandedRow}>
                      <td colSpan={columns.length + 1} className={styles.expandedContent}>
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
