import { TableColumn } from "./Interface/TableInterface";

const TableHeader: React.FC<{
  columns: TableColumn[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
}> = ({ columns, sortBy, sortOrder, onSort }) => {
  const normalizedColumns = columns.map((column) => ({
    visible: true,
    ...column,
  }));
  return (
    <thead>
      <tr
        style={{
          backgroundColor: "#f8f9fa",
          borderBottom: "2px solid #dee2e6",
        }}
      >
        {normalizedColumns.map(
          (column, index) =>
            column.visible && (
              <th
                key={`${String(column.key)} - ${String(index)}`}
                style={{
                  padding: "1rem 0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "#495057",
                  fontSize: "12px",
                  cursor: column.sortable ? "pointer" : "default",
                  width: column.width,
                  userSelect: "none",
                }}
                onClick={() => column.sortable && onSort(String(column.key))}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {column.label}
                  {column.sortable && (
                    <span
                      style={{
                        opacity: sortBy === column.key ? 1 : 0.3,
                        fontSize: "12px",
                      }}
                    >
                      {sortBy === column.key && sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            )
        )}
      </tr>
    </thead>
  );
};

export default TableHeader;
