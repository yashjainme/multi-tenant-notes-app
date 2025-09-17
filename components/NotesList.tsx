'use client';

import React, { useState } from 'react';
import { useNotes } from '@/contexts/NotesContext';
import { Skeleton } from '@/components/ui';
import { Note } from '@/types';
import { formatRelativeTime, getPlainTextPreview, truncateText, cn } from '@/lib/utils';
import { FileText, Trash2 } from 'lucide-react';

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null | undefined;
  onNoteSelect: (note: Note | null) => void;
  loading: boolean;
}

export function NotesList({ notes, selectedNote, onNoteSelect, loading }: NotesListProps) {
  const { deleteNote } = useNotes();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;

    setDeletingId(noteId);
    try {
      const success = await deleteNote(noteId);
      if (success && selectedNote?.id === noteId) {
        onNoteSelect(null); // Now this is valid
      } else if (!success) {
        alert('Failed to delete note. Please try again.');
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert('An error occurred while deleting the note.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && notes.length === 0) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 space-y-3">
      {notes.map((note) => {
        const isSelected = selectedNote?.id === note.id;
        const preview = getPlainTextPreview(note.content || '', 100);
        const isDeleting = deletingId === note.id;

        return (
          <div
            key={note.id}
            className={cn(
              'group p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200',
              isSelected 
                ? 'bg-primary/10 border-primary shadow-sm' 
                : 'bg-card hover:bg-accent/50 active:bg-accent/70',
              isDeleting && 'opacity-50 pointer-events-none'
            )}
            onClick={() => !isDeleting && onNoteSelect(note)}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-2">
              <h3 className={cn(
                'font-semibold text-sm sm:text-base line-clamp-1 break-words flex-1 pr-2',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {truncateText(note.title, 50) || 'Untitled'}
              </h3>

              <button
                onClick={(e) => handleDelete(e, note.id)}
                className={cn(
                  'p-1 rounded-md transition-all',
                  'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                  // Make delete button always visible on mobile, hover-only on desktop
                  'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                )}
                disabled={isDeleting}
                title="Delete note"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Preview text */}
            {preview && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 break-words">
                {preview}
              </p>
            )}

            {/* Footer metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground gap-1">
              <span>{formatRelativeTime(note.updated_at)}</span>
              <span className="flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                {note.content?.length || 0} chars
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}