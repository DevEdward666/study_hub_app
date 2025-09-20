import { useState, useEffect } from "react";

const TableControls: React.FC<{
  search: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: number[];
  searchPlaceholder: string;
  paginationInfo?: string;
}> = ({
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  searchPlaceholder,
  paginationInfo,
}) => {
  const [searchValue, setSearchValue] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "center",
        marginBottom: "1.5rem",
        padding: "1rem",
        borderRadius: "8px",
      }}
    >
      <div style={{ flex: "1", minWidth: "200px" }}>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          style={{
            width: "100%",
            fontSize: "12px",
            padding: "0.75rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: "white",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <label style={{ fontSize: "12px" }}>Show:</label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "12px",
            background: "white",
          }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      {paginationInfo && (
        <div style={{ fontSize: "12px", color: "#666" }}>{paginationInfo}</div>
      )}
    </div>
  );
};

export default TableControls;
