const TablePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}> = ({ currentPage, totalPages, onPageChange, isLoading }) => {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.5rem",
        fontSize:'12px',
        marginTop: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      <button
        disabled={currentPage === 1 || isLoading}
        onClick={() => onPageChange(currentPage - 1)}
        style={{
          padding: "0.5rem 1rem",
          border: "1px solid #dee2e6",
          backgroundColor: "#fff",
          borderRadius: "4px",
          fontSize:'12px',
          cursor: currentPage === 1 || isLoading ? "not-allowed" : "pointer",
          opacity: currentPage === 1 || isLoading ? 0.5 : 1,
          color: "black",
        }}
      >
        Previous
      </button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const pageNum =
          Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
        if (pageNum > totalPages) return null;

        return (
          <button
            key={pageNum}
            disabled={isLoading}
            onClick={() => onPageChange(pageNum)}
            style={{
              padding: "0.5rem 0.75rem",
              fontSize:'12px',
              border: "1px solid #dee2e6",
              backgroundColor: currentPage === pageNum ? "#007bff" : "#fff",
              color: currentPage === pageNum ? "#fff" : "#495057",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        disabled={currentPage === totalPages || isLoading}
        onClick={() => onPageChange(currentPage + 1)}
        style={{
          padding: "0.5rem 1rem",
          border: "1px solid #dee2e6",
          backgroundColor: "#fff",
          borderRadius: "4px",
          fontSize:'12px',
          color: "black",
          cursor:
            currentPage === totalPages || isLoading ? "not-allowed" : "pointer",
          opacity: currentPage === totalPages || isLoading ? 0.5 : 1,
        }}
      >
        Next
      </button>

      <div
        style={{
          fontSize:'12px',
          color: "#666",
          marginLeft: "1rem",
          textAlign: "center",
          minWidth: "fit-content",
        }}
      >
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};
export default TablePagination;
