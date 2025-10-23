import { TableColumn } from "./Interface/TableInterface";
import Spinner from "./Spinner";

const TableBody: React.FC<{
  columns: TableColumn[];
  data: any[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  emptyMessage: string;
  loadingMessage: string;
  onRowClick?: (row: any) => void;
}> = ({
  columns,
  data,
  isLoading,
  isError,
  error,
  emptyMessage,
  loadingMessage,
  onRowClick,
}) => {
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length}
            style={{ textAlign: "center", padding: "3rem", fontSize: "12px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <Spinner />
              <span style={{ color: "#666" }}>{loadingMessage}</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (isError) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length}
            style={{ textAlign: "center", padding: "3rem" }}
          >
            <div style={{ color: "#dc3545" }}>
              Error loading data: {error?.message || "Unknown error"}
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length}
            style={{ textAlign: "center", padding: "3rem" }}
          >
            <div style={{ color: "#666" }}>{emptyMessage}</div>
          </td>
        </tr>
      </tbody>
    );
  }
  const normalizedColumns = columns.map((column) => ({
    visible: true,
    ...column,
  }));
  return (
    <tbody>
      {data.map((row, index) => (
        <tr
          key={row.id || index}
          style={{
            backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
            borderBottom: "1px solid #dee2e6",
            cursor: onRowClick ? "pointer" : "default",
          }}
          onDoubleClick={() => onRowClick?.(row)}
        >
          {normalizedColumns.map(
            (column, colIndex) =>
              column.visible && (
                <td
                  key={`${String(column.key)} - ${String(colIndex)}`}
                  style={{ padding: "0.75rem", fontSize: "12px" }}
                  data-label={column.label}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] || "")}
                </td>
              )
          )}
        </tr>
      ))}
    </tbody>
  );
};
export default TableBody;
