import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { LoginRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // Authenticate user
    const result = await AuthService.authenticateUser(email, password);

    return createSuccessResponse(result, 'Login successful');
  } catch (error: unknown) {
  console.error('Login error:', error);

  let message = 'Login failed';
  let statusCode = 401;

  if (error instanceof Error) {
    message = error.message;
  }

  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    statusCode = (error as { statusCode?: number }).statusCode ?? 401;
  }

  return createErrorResponse(message, statusCode);
}

}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}