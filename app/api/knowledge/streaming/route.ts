import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { STREAMING_CONFIG } from '@/lib/utils/ai-config';
import { handleApiError } from '@/lib/utils/api-handler';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// TODO: Add authentication check before production deployment
export async function POST(request: NextRequest) {
  const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY;

  if (!LONGCAT_API_KEY) {
    const errorResponse: ApiResponse = {
      code: 'MISSING_API_KEY',
      message: 'LONGCAT_API_KEY environment variable is not configured',
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const longcat = createOpenAI({
    name: 'longcat',
    apiKey: LONGCAT_API_KEY,
    baseURL: 'https://api.longcat.chat/openai/v1',
  });

  try {
    const body = await request.json();

    if (!Array.isArray(body.messages)) {
      const errorResponse: ApiResponse = {
        code: 'VALIDATION_ERROR',
        message: 'messages must be an array',
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await streamText({
      model: longcat('LongCat-Flash-Chat'),
      messages: body.messages,
      temperature: STREAMING_CONFIG.temperature,
      maxTokens: STREAMING_CONFIG.maxTokens,
      topP: STREAMING_CONFIG.topP,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
