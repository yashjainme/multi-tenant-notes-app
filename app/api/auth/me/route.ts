import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { createSuccessResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    // Remove password hash from response
    const { ...userWithoutPassword } = user;
    
    return createSuccessResponse(userWithoutPassword);
  });
}

export  function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}