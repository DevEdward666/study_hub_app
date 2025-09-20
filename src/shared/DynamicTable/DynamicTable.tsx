import React, { useState, useMemo, useEffect, ReactNode } from "react";
import Spinner from "./Spinner";
import { exportToExcel, exportToPDF, ValidationError } from "./Utls/TableUtils";
import { PaginatedResponse } from "./TableProperties";
import {
  DynamicTableProps,
  TableState,
  UseTableProps,
} from "./Interface/TableInterface";
import TableHeader from "./TableHeader";
import TablePagination from "./TablePagination";
import TableControls from "./TableControls";
import TableBody from "./TableBody";
import { IonButton, IonIcon } from "@ionic/react";
import { addCircle, fileTray, fileTrayFullOutline } from "ionicons/icons";

interface QueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
}

const useQuery = <T,>(
  queryKey: any[],
  queryFn: () => Promise<T>,

  options: { staleTime?: number } = {}
): QueryState<T> & { refetch: () => void } => {
  const [state, setState] = useState<QueryState<T>>({
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
    isFetching: false,
  });

  const cacheKey = JSON.stringify(queryKey);
  const { staleTime = 5 * 60 * 1000 } = options;

  const fetchData = async () => {
    setState((prev) => ({
      ...prev,
      isFetching: true,
      isError: false,
      error: null,
    }));

    try {
      const result = await queryFn();
      setState({
        data: result,
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
      });
    } catch (error) {
      setState({
        data: undefined,
        isLoading: false,
        isError: true,
        error: error as Error,
        isFetching: false,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [cacheKey]);

  const refetch = () => {
    fetchData();
  };

  return { ...state, refetch };
};

export function useTable<TData, TPayload = void>({
  queryKey,
  fetchFn,
  initialState,
  payload,
}: UseTableProps<TData, TPayload>) {
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10,
    search: "",
    sortBy: "id",
    sortOrder: "asc",
    ...initialState,
  });

  const queryResult = useQuery(
    [
      queryKey,
      tableState.page,
      tableState.pageSize,
      tableState.search,
      tableState.sortBy,
      tableState.sortOrder,
      payload,
    ],
    () => fetchFn(tableState, payload as TPayload),
    { staleTime: 5 * 60 * 1000 }
  );

  const updateState = (newState: Partial<TableState>) => {
    setTableState((prev) => {
      const resetPage =
        (newState.search !== undefined && newState.search !== prev.search) ||
        (newState.sortBy !== undefined && newState.sortBy !== prev.sortBy) ||
        (newState.sortOrder !== undefined &&
          newState.sortOrder !== prev.sortOrder) ||
        (newState.pageSize !== undefined &&
          newState.pageSize !== prev.pageSize);

      return {
        ...prev,
        ...newState,
        page: newState.page ?? (resetPage ? 1 : prev.page),
      };
    });
  };

  return {
    tableState,
    updateState,
    ...queryResult,
  };
}

const DynamicTable: React.FC<DynamicTableProps<any>> = ({
  columns,
  data = [],
  total = 0,
  isLoading = false,
  isShowExports = false,
  isError = false,
  error = null,
  onRefetch,
  tableState,
  onStateChange,
  onRowClick,
  totalPages = 0,
  pageSizeOptions = [5, 10, 20, 50],
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  loadingMessage = "Loading...",
  fetchFn,
  payload,
  table_name,
  onExportStateChange,
}) => {
  const handleSort = (column: string) => {
    if (tableState.sortBy === column) {
      onStateChange({
        sortOrder: tableState.sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      onStateChange({ sortBy: column, sortOrder: "asc" });
    }
  };

  const paginationInfo = useMemo(() => {
    if (total === 0) return null;
    const start = (tableState.page - 1) * tableState.pageSize + 1;
    const end = Math.min(tableState.page * tableState.pageSize, total);
    return `${start}-${end} of ${total}`;
  }, [total, tableState.page, tableState.pageSize]);
  const computedTotalPages = Math.ceil(total / tableState.pageSize) || 1;
  const handleExport = async (type: "excel" | "pdf") => {
    const baseFileName = `${table_name}-${Date.now()}`;

    let progressInterval: NodeJS.Timeout | null = null;

    const startFakeProgress = () => {
      progressInterval = setInterval(() => {
        onExportStateChange?.((prev: any) => {
          const next = (prev?.progress ?? 0) + Math.random() * 100;
          return { progress: Math.min(next, 95) };
        });
      }, 500);
    };

    const stopFakeProgress = () => {
      if (progressInterval) clearInterval(progressInterval);
    };

    onExportStateChange?.({
      isExporting: true,
      exportType: type,
      message: "Starting export...",
      fileName: baseFileName,
      progress: 10,
    });

    try {
      startFakeProgress();

      let exportData = data;
      if (fetchFn) {
        const allState = { ...tableState, page: 1, pageSize: 100000 };
        const result = await fetchFn(allState, payload);
        exportData = result.data ?? result;
      }

      if (type === "excel") {
        exportToExcel(
          exportData,
          columns,
          `${baseFileName}.xlsx`,
          `${baseFileName}.xlsx`
        );
      } else {
        exportToPDF(
          exportData,
          columns,
          `${baseFileName}.pdf`,
          `${baseFileName}.pdf`,
          "Release Table"
        );
      }

      stopFakeProgress();
      onExportStateChange?.({
        isExporting: false,
        exportType: type,
        message: "Export completed",
        progress: 100,
        fileName: `${baseFileName}.${type === "excel" ? "xlsx" : "pdf"}`,
      });
    } catch (err) {
      console.error("Export failed", err);
      stopFakeProgress();
      onExportStateChange?.({
        isExporting: false,
        exportType: type,
        progress: 100,
        message: "Export failed",
      });
    }
  };

  return (
    <div>
      {isShowExports ? (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "8px",
            gap: "8px",
          }}
        >
          <IonButton
            onClick={() => handleExport("excel")}
            fill="solid"
            className="add-new-user-btn"
            size="small"
          >
            <IonIcon slot="start" ios={fileTray} md={fileTray}></IonIcon>
            Export Excel
          </IonButton>
          <IonButton
            onClick={() => handleExport("pdf")}
            fill="solid"
            className="add-new-user-btn"
            size="small"
          >
            <IonIcon
              slot="start"
              ios={fileTrayFullOutline}
              md={fileTrayFullOutline}
            ></IonIcon>
            Export PDF
          </IonButton>
        </div>
      ) : null}

      <TableControls
        search={tableState.search}
        onSearchChange={(value: any) => onStateChange({ search: value })}
        pageSize={tableState.pageSize}
        onPageSizeChange={(size: any) => onStateChange({ pageSize: size })}
        pageSizeOptions={pageSizeOptions}
        searchPlaceholder={searchPlaceholder}
        paginationInfo={paginationInfo!}
      />

      <div
        style={{
          overflowX: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          borderRadius: "8px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
          }}
        >
          <TableHeader
            columns={columns}
            sortBy={tableState.sortBy}
            sortOrder={tableState.sortOrder}
            onSort={handleSort}
          />
          <TableBody
            columns={columns}
            data={data}
            isLoading={isLoading}
            isError={isError}
            error={error}
            emptyMessage={emptyMessage}
            loadingMessage={loadingMessage}
            onRowClick={(row) => onRowClick?.(row)}
          />
        </table>
      </div>

      <TablePagination
        currentPage={tableState.page}
        totalPages={computedTotalPages}
        onPageChange={(page) => onStateChange({ page })}
        isLoading={isLoading}
      />
    </div>
  );
};
export default DynamicTable;
