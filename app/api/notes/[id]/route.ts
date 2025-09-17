import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';
import { UpdateNoteRequest, NotFoundError } from '@/types';

// GET /api/notes/[id] - Get specific note
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return withAuth(request, async (req, user) => {
    try {
      const note = await db.getNoteById(id, user.tenant_id);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      return createSuccessResponse(note);
    } catch (error: unknown) {
  console.error('Error fetching note:', error);

  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse('Failed to fetch note', 500);
}

  });
}

// PUT /api/notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return withAuth(request, async (req, user) => {
    try {
      const body: UpdateNoteRequest = await req.json();
      const { title, content } = body;

      // Validate input
      if (title !== undefined && title.trim().length === 0) {
        return createErrorResponse('Title cannot be empty', 400);
      }

      // Prepare updates
      const updates: UpdateNoteRequest = {};
      if (title !== undefined) updates.title = title.trim();
      if (content !== undefined) updates.content = content.trim();

      if (Object.keys(updates).length === 0) {
        return createErrorResponse('No valid updates provided', 400);
      }

      // Update note (with tenant isolation)
      const note = await db.updateNote(id, user.tenant_id, updates);

      if (!note) {
        throw new NotFoundError('Note not found');
      }

      return createSuccessResponse(note, 'Note updated successfully');
    } catch (error: unknown) {
  console.error('Error updating note:', error);

  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse('Failed to update note', 500);
}

  });
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return withAuth(request, async (req, user) => {
    try {
      // Check if note exists and belongs to tenant
      const existingNote = await db.getNoteById(id, user.tenant_id);
      if (!existingNote) {
        throw new NotFoundError('Note not found');
      }

      // Delete note
      await db.deleteNote(id, user.tenant_id);

      return createSuccessResponse(null, 'Note deleted successfully');
    } catch (error: unknown) {
  console.error('Error deleting note:', error);

  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse('Failed to delete note', 500);
}

  });
}

// OPTIONS handler for CORS preflight
export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
