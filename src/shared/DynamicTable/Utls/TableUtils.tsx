import { PaginatedResponse } from "../TableProperties";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

interface Column<T> {
  key: keyof T;
  label: string;
}
export const createStatusChip = (status: string) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return { bg: "#d4edda", color: "#155724", border: "#c3e6cb" };
      case "Inactive":
        return { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" };
      case "Pending":
        return { bg: "#fff3cd", color: "#856404", border: "#ffeaa7" };
      default:
        return { bg: "#f8f9fa", color: "#6c757d", border: "#dee2e6" };
    }
  };
  const colors = getStatusColor(status);
  return (
    <span
      style={{
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        borderRadius: "0.375rem",
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
};

export const createTableStatusChip = (status: string) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "true":
        return { bg: "#d4edda", color: "#155724", border: "#c3e6cb" };
      case "false":
        return { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" };
      default:
        return { bg: "#f8f9fa", color: "#6c757d", border: "#dee2e6" };
    }
  };
  const colors = getStatusColor(status);
  return (
    <span
      style={{
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        borderRadius: "0.375rem",
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
};
export const createFinancesChip = (status: string) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Liabilities":
        return { bg: "#d4edda", color: "#155724", border: "#c3e6cb" };
      case "Expenses":
        return { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" };
      default:
        return { bg: "#f8f9fa", color: "#6c757d", border: "#dee2e6" };
    }
  };
  const colors = getStatusColor(status);
  return (
    <span
      style={{
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        borderRadius: "0.375rem",
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
};

export const formatDate = (
  dateInput: string | number | Date,
  separator: string = "-",
  withHours: boolean = true
): string => {
  if (!dateInput) {
    return "";
  }

  const date = new Date(dateInput);

  // Force conversion to Asia/Manila timezone
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
    ...(withHours && {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };

  const formatter = new Intl.DateTimeFormat("en-PH", options);
  const parts = formatter.formatToParts(date);

  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";

  if (!withHours) {
    return `${month}${separator}${day}${separator}${year}`;
  }

  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";

  return `${month}${separator}${day}${separator}${year} ${hour}:${minute} ${dayPeriod}`;
};

export const createRoleChip = (role: string) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return { bg: "#cce5ff", color: "#004085", border: "#99d6ff" };
      case "Staff":
        return { bg: "#e2e3e5", color: "#383d41", border: "#d6d8db" };
      case "Collector":
        return { bg: "#d1ecf1", color: "#0c5460", border: "#bee5eb" };
      default:
        return { bg: "#f8f9fa", color: "#6c757d", border: "#dee2e6" };
    }
  };

  const colors = getRoleColor(role);
  return (
    <span
      style={{
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        borderRadius: "0.375rem",
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        textTransform: "capitalize",
      }}
    >
      {role}
    </span>
  );
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const validatePaginatedResponse = (response: any, validateUser: any) => {
  if (!response || typeof response !== "object") {
    throw new ValidationError("Response must be an object");
  }

  if (!Array.isArray(response.data)) {
    throw new ValidationError("Data must be an array");
  }

  const validatedData = response.data.map(validateUser);

  return {
    data: validatedData,
    total: Number(response.total) || 0,
    page: Number(response.page) || 1,
    pageSize: Number(response.pageSize) || 10,
    totalPages: Number(response.totalPages) || 0,
  };
};
export const validateUser = (user: any) => {
  if (!user || typeof user !== "object") {
    throw new ValidationError("User must be an object");
  }

  const requiredFields = [
    "id",
    "firstname",
    "middlename",
    "lastname",
    "email",
    "phone_no",
    "role",
    "status",
    "created_date",
    "updated_date",
  ];
  for (const field of requiredFields) {
    if (!(field in user)) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }

  if (!["admin", "user", "manager"].includes(user.role)) {
    throw new ValidationError("Invalid role");
  }

  if (!["active", "inactive", "pending"].includes(user.status)) {
    throw new ValidationError("Invalid status");
  }

  return user;
};
export function exportToExcel<T>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  table_name: string,
  fileName = `${table_name}.xlsx`
) {
  const exportData = data.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.label] = row[col.key];
      return acc;
    }, {} as Record<string, any>)
  );

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, fileName);
}

export function exportToPDF<T>(
  data: T[],
  columns: Column<T>[],
  table_name: string,
  fileName = `${table_name}.pdf`,
  title: string = ""
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 5); // (text, x, y)
  const numberFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const tableColumn = columns.map((c) => c.label);
  const tableRows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];

      // If column marked currency OR the label matches specific names:
      if (
        [
          "Amount Loan",
          "Service Charge",
          "Interest",
          "Total Payable Amount",
        ].includes(col.label)
      ) {
        const num = Number(value);
        return isNaN(num) ? "" : numberFormatter.format(num);
      }

      return String(value ?? "");
    })
  );

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
  });

  doc.save(fileName);
}
