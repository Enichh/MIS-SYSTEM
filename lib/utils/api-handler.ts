import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';

/**
 * Handles API errors and returns appropriate error responses
 * @param error - The error to handle
 * @returns NextResponse with appropriate status code and error message
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  // Handle validation errors
  if (error instanceof z.ZodError) {
    const errorResponse: ApiResponse = {
      code: 'VALIDATION_ERROR',
      message: error.errors[0].message,
    };
    return NextResponse.json(errorResponse, {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Handle other errors
  const errorResponse: ApiResponse = {
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'An unknown error occurred',
  };
  return NextResponse.json(errorResponse, {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
