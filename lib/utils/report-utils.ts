import type { ReportType, ReportConfig } from "../types/reports";

export const REPORT_TYPES: ReportType[] = [
  "employee_summary",
  "project_status",
  "task_overview",
  "workload_analysis",
  "custom",
];

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  type: "employee_summary",
  includeCharts: true,
  includeMetrics: true,
};

export function validateReportType(type: string): type is ReportType {
  return REPORT_TYPES.includes(type as ReportType);
}

export function buildReportQuery(config: ReportConfig): Record<string, unknown> {
  const query: Record<string, unknown> = {
    type: config.type,
  };

  if (config.dateRange) {
    query.dateRange = config.dateRange;
  }

  if (config.filters) {
    query.filters = config.filters;
  }

  return query;
}

function aggregateReportMetrics(data: unknown[]): Record<string, number> {
  return data.reduce<Record<string, number>>(
    (acc, item) => {
      if (typeof item === "object" && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          if (typeof value === "number") {
            acc[key] = (acc[key] || 0) + value;
          }
        });
      }
      return acc;
    },
    {},
  );
}

function sanitizeReportData(data: unknown): unknown {
  if (typeof data === "string") {
    return data.replace(/<script[^>]*>.*?<\/script>/gi, "");
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeReportData);
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeReportData(value);
    }
    return sanitized;
  }

  return data;
}
