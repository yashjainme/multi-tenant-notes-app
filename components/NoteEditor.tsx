import React, { useState, useEffect, useMemo } from 'react';
import { useNotes } from '@/contexts/NotesContext';
import { Button, Alert } from '@/components/ui';
import { Note } from '@/types';
import { formatRelativeTime, debounce } from '@/lib/utils';
import { X, Save } from 'lucide-react';

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
}

export function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { updateNote } = useNotes();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync internal state when the note prop changes from the parent
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content || '');
  }, [note]);

  // Track if local state differs from the prop
  useEffect(() => {
    const hasChanges = title !== note.title || content !== (note.content || '');
    setHasUnsavedChanges(hasChanges);
  }, [title, content, note.title, note.content]);

  // Memoize the debounced save function with proper typing
  const debouncedSave = useMemo(() => {
    const saveFunction = async (newTitle: string, newContent: string) => {
      setIsSaving(true);
      setSaveError('');
      try {
        await updateNote(note.id, {
          title: newTitle.trim() || 'Untitled',
          content: newContent,
        });
      } catch (error) {
        setSaveError('Failed to auto-save note. Please try again.');
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    };

    return debounce(saveFunction as (...args: unknown[]) => unknown, 1500) as typeof saveFunction & { cancel: () => void };
  }, [note.id, updateNote]);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedSave(title, content);
    }

    // Cleanup function to cancel pending saves
    return () => {
      debouncedSave.cancel();
    };
  }, [title, content, hasUnsavedChanges, debouncedSave]);

  // Handle manual save
  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    debouncedSave.cancel(); // Cancel any pending auto-save
    setIsSaving(true);
    setSaveError('');
    try {
      await updateNote(note.id, {
        title: title.trim() || 'Untitled',
        content,
      });
    } catch (error) {
      setSaveError(`Failed to save note: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getSaveStatus = () => {
    if (isSaving) {
      return (
        <>
          <div className="w-3 h-3 animate-spin border-2 border-current border-t-transparent rounded-full mr-2" />
          Saving...
        </>
      );
    }
    if (hasUnsavedChanges) {
      return (
        <>
          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
          Unsaved changes
        </>
      );
    }
    // After a successful save, hasUnsavedChanges becomes false, showing this message
    return <span className="text-green-500">Saved</span>;
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4 flex-grow min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 placeholder-muted-foreground w-full"
            placeholder="Untitled Note"
            maxLength={500}
          />
          <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
            {getSaveStatus()}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            variant="ghost"
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <Button onClick={handleClose} variant="ghost" size="icon">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {saveError && (
        <div className="p-4">
          <Alert variant="destructive">{saveError}</Alert>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full resize-none bg-transparent border-none outline-none focus:ring-0 text-base"
          placeholder="Start writing your note..."
          spellCheck="true"
        />
      </div>

      {/* Editor Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Chars: {content.length}</span>
          <span>Words: {content ? content.trim().split(/\s+/).length : 0}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Modified: {formatRelativeTime(note.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}