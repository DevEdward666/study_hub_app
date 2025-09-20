import { ReactNode } from "react";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable: boolean;
  visible?: boolean;
  render?: (value: any, row: T) => ReactNode;
  width?: string;
}

export interface TableState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface UseTableProps<TData, TPayload = void> {
  queryKey: string;
  fetchFn: (
    state: TableState,
    payload: TPayload
  ) => Promise<PaginatedResponse<TData>>;
  initialState?: Partial<TableState>;
  payload?: TPayload;
}
export type ExportType = "pdf" | "excel" | undefined;

export interface ExportState {
  isExporting: boolean;
  exportType?: ExportType;
  message?: string;
  progress?: number;
  fileName?: string;
}
export interface DynamicTableProps<T> {
  columns: TableColumn<T>[];
  data?: T[];
  total?: number;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRefetch?: () => void;
  tableState: TableState;
  onStateChange: (newState: Partial<TableState>) => void;
  totalPages?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  onRowClick?: (row: any) => void;
  fetchFn?: (state: TableState, payload?: any) => Promise<any>;
  payload?: any;
  isShowExports?: boolean;
  table_name?: string;
  onExportStateChange?: (
    update: Partial<ExportState> | ((prev: ExportState) => Partial<ExportState>)
  ) => void;
}
