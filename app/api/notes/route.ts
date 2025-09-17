import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';
import { CreateNoteRequest, SubscriptionLimitError } from '@/types';

// GET /api/notes - List all notes for current tenant
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const notes = await db.getNotesByTenant(user.tenant_id);
      return createSuccessResponse(notes);
    } catch (error: unknown) {
  console.error('Error fetching notes:', error);

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse('Failed to fetch notes', 500);
}

  });
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body: CreateNoteRequest = await req.json();
      const { title, content } = body;

      // Validate input
      if (!title || title.trim().length === 0) {
        return createErrorResponse('Title is required', 400);
      }

      // Check subscription limits
      const canCreate = await db.canTenantCreateNote(user.tenant_id);
      if (!canCreate) {
        throw new SubscriptionLimitError(
          'Free plan limited to 3 notes. Upgrade to Pro for unlimited notes.'
        );
      }

      // Create note
      const note = await db.createNote({
        tenant_id: user.tenant_id,
        user_id: user.id,
        title: title.trim(),
        content: content?.trim() || '',
      });

      return createSuccessResponse(note, 'Note created successfully');
    } catch (error: unknown) {
  console.error('Error creating note:', error);

  if (error instanceof SubscriptionLimitError) {
    return createErrorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse('Failed to create note', 500);
}

  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}