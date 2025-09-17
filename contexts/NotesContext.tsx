'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotesContextType, Note, CreateNoteRequest, UpdateNoteRequest } from '@/types';
import { useAuth, useAuthToken } from './AuthContext';
import { getApiUrl } from '@/lib/utils';

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [canCreateMore, setCanCreateMore] = useState(true);

  const { user, tenant } = useAuth();
  const token = useAuthToken();

  // Fetch notes when user/tenant changes
  

  // Update creation limit based on notes count and subscription
  useEffect(() => {
    if (tenant) {
      const canCreate = tenant.subscription_plan === 'pro' || notes.length < 3;
      setCanCreateMore(canCreate);
    }
  }, [notes.length, tenant]);

  const fetchNotes = useCallback(async (): Promise<void> => {
  if (!token) return;

  setLoading(true);
  setError(null);

  try {
    const response = await fetch(getApiUrl('/notes'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      setNotes(data.data || []);
    } else {
      setError(data.error || 'Failed to fetch notes');
    }
  } catch (err) {
    setError('Network error while fetching notes');
    console.error('Fetch notes error:', err);
  } finally {
    setLoading(false);
  }
}, [token]); // Only recreate when token changes
useEffect(() => {
  if (user && token) {
    fetchNotes();
  } else {
    setNotes([]);
    setCurrentNote(null);
  }
}, [user, token, fetchNotes]);

  const createNote = async (noteData: CreateNoteRequest): Promise<Note | null> => {
    if (!token) return null;

    setError(null);

    try {
      const response = await fetch(getApiUrl('/notes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
      });

      const data = await response.json();

      if (data.success) {
        const newNote = data.data;
        setNotes(prev => [newNote, ...prev]);
        return newNote;
      } else {
        setError(data.error || 'Failed to create note');
        return null;
      }
    } catch (err) {
      setError('Network error while creating note');
      console.error('Create note error:', err);
      return null;
    }
  };

  const updateNote = async (
    id: string,
    updates: UpdateNoteRequest
  ): Promise<Note | null> => {
    if (!token) return null;

    setError(null);

    try {
      const response = await fetch(getApiUrl(`/notes/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        const updatedNote = data.data;
        
        setNotes(prev =>
          prev.map(note => (note.id === id ? updatedNote : note))
        );
        
        if (currentNote?.id === id) {
          setCurrentNote(updatedNote);
        }
        
        return updatedNote;
      } else {
        setError(data.error || 'Failed to update note');
        return null;
      }
    } catch (err) {
      setError('Network error while updating note');
      console.error('Update note error:', err);
      return null;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    if (!token) return false;

    setError(null);

    try {
      const response = await fetch(getApiUrl(`/notes/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setNotes(prev => prev.filter(note => note.id !== id));
        
        if (currentNote?.id === id) {
          setCurrentNote(null);
        }
        
        return true;
      } else {
        setError(data.error || 'Failed to delete note');
        return false;
      }
    } catch (err) {
      setError('Network error while deleting note');
      console.error('Delete note error:', err);
      return false;
    }
  };

  const selectNote = (note: Note | null): void => {
    setCurrentNote(note);
  };

  const refreshNoteCount = async (): Promise<void> => {
    await fetchNotes();
  };

  const value: NotesContextType = {
    notes,
    loading,
    error,
    currentNote,
    canCreateMore,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    refreshNoteCount,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextType {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

// Custom hooks for specific note operations
export function useCreateNote() {
  const { createNote, canCreateMore, error } = useNotes();
  
  return {
    createNote,
    canCreateMore,
    error,
  };
}

export function useNoteEditor(noteId?: string) {
  const { notes, currentNote, updateNote, selectNote } = useNotes();
  
  const note = noteId 
    ? notes.find(n => n.id === noteId) || null 
    : currentNote;

  return {
    note,
    updateNote,
    selectNote,
  };
}