import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';
import { NotFoundError, TenantIsolationError } from '@/types';

// POST /api/tenants/[slug]/upgrade - Upgrade tenant subscription (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withAdminAuth(request, async (req, user) => {
    try {
      // Get tenant by slug
      const tenant = await db.getTenantBySlug(params.slug);
      
      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      // Ensure admin belongs to the same tenant they're trying to upgrade
      if (user.tenant_id !== tenant.id) {
        throw new TenantIsolationError(
          'You can only upgrade your own tenant subscription'
        );
      }

      // Check if already pro
      if (tenant.subscription_plan === 'pro') {
        return createErrorResponse('Tenant is already on Pro plan', 400);
      }

      // Upgrade to pro
      const updatedTenant = await db.upgradeTenantSubscription(tenant.id);

      return createSuccessResponse(
        updatedTenant,
        'Subscription upgraded to Pro successfully'
      );
    } catch (error: unknown) {
      console.error('Error upgrading subscription:', error);
      
      if (error instanceof NotFoundError || error instanceof TenantIsolationError) {
        return createErrorResponse(error.message, error.statusCode);
      }
      
      return createErrorResponse('Failed to upgrade subscription', 500);
    }
  });
}

export  function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}