import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateReportData } from '@/lib/services/reportService';
import { handleApiError } from '@/lib/utils/api-handler';
import { validateReportType } from '@/lib/utils/report-utils';
import type { ReportConfig, ReportData } from '@/lib/types/reports';
import type { ApiResponse } from '@/types';

const reportConfigSchema = z.object({
  type: z.enum(['employee_summary', 'project_status', 'task_overview', 'workload_analysis', 'custom']),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  filters: z.record(z.unknown()).optional(),
  includeCharts: z.boolean().optional().default(true),
  includeMetrics: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest): Promise<NextResponse<ReportData | ApiResponse>> {
  try {
    const body = await request.json();
    
    const parseResult = reportConfigSchema.safeParse(body);
    if (!parseResult.success) {
      const errorResponse: ApiResponse = {
        code: 'VALIDATION_ERROR',
        message: `Invalid report configuration: ${parseResult.error.message}`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const config: ReportConfig = parseResult.data;
    
    if (!validateReportType(config.type)) {
      const errorResponse: ApiResponse = {
        code: 'INVALID_REPORT_TYPE',
        message: `Invalid report type: ${config.type}`,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const reportData = await generateReportData(config);
    
    return NextResponse.json(reportData, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
