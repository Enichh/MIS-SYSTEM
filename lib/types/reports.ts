export type ReportType =
  | "employee_summary"
  | "project_status"
  | "task_overview"
  | "workload_analysis"
  | "custom";

export interface ReportSection {
  title: string;
  content: string;
  order: number;
}

export interface ReportMetric {
  label: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  unit?: string;
}

export interface ReportChart {
  type: "bar" | "line" | "pie" | "table";
  title: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface ReportData {
  title: string;
  type: ReportType;
  generatedAt: string;
  sections: ReportSection[];
  metrics: ReportMetric[];
  charts: ReportChart[];
  metadata?: Record<string, unknown>;
}

export interface ReportPagination {
  page?: number;
  limit?: number;
}

export interface ReportConfig {
  type: ReportType;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, unknown>;
  includeCharts?: boolean;
  includeMetrics?: boolean;
  pagination?: ReportPagination;
  includeFullDetails?: boolean; // false = summary only (metrics + aggregates), true = full data with tables
}

export interface PDFExportOptions {
  filename?: string;
  format?: "A4" | "letter";
  orientation?: "portrait" | "landscape";
  includeCharts?: boolean;
  includeMetadata?: boolean;
}
