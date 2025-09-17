import { NextRequest } from 'next/server';
import { AuthService, extractToken } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    
    if (token) {
      await AuthService.logout(token);
    }

    return createSuccessResponse(null, 'Logged out successfully');
  } catch (error: unknown) {
  console.error('Logout error:', error);

  let message = 'Logout failed';
  let statusCode = 500;

  if (error instanceof Error) {
    message = error.message;
  }

  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    statusCode = (error as { statusCode?: number }).statusCode ?? 500;
  }

  return createErrorResponse(message, statusCode);
}

}



export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
