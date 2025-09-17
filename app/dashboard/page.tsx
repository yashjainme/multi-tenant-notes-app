'use client';

import React, { useState } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NotesContext';
import { Button, EmptyState, Alert, Badge } from '@/components/ui';
import { NoteEditor } from '@/components/NoteEditor';
import { NotesList } from '@/components/NotesList';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { Plus, FileText, Zap, Menu } from 'lucide-react';
import { Note, SidebarContentProps } from '@/types';

export default function DashboardPage() {
  const { tenant } = useAuth();
  const isAdmin = useIsAdmin();
  const { 
    notes, 
    loading, 
    error, 
    currentNote, 
    canCreateMore,
    createNote,
    selectNote 
  } = useNotes();

  const [isCreating, setIsCreating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCreateNote = async () => {
    if (!canCreateMore) return;

    setIsCreating(true);
    
    const newNote = await createNote({
      title: 'Untitled Note',
      content: '',
    });

    if (newNote) {
      selectNote(newNote);
      setShowEditor(true);
    }
    
    setIsCreating(false);
    setSidebarOpen(false); // close sidebar after creating on mobile
  };

  // Updated to handle both Note and null
  const handleNoteSelect = (note: Note | null) => {
    selectNote(note);
    if (note) {
      setShowEditor(true);
    } else {
      setShowEditor(false);
    }
    setSidebarOpen(false);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    selectNote(null);
  };

  const subscriptionStatus = tenant?.subscription_plan || 'free';
  const notesCount = notes.length;
  const notesLimit = subscriptionStatus === 'pro' ? '∞' : '3';

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)]">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Your Notes</h2>
        <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar (hidden on mobile) */}
      <div className="hidden md:flex w-80 border-r bg-card/30 flex-col">
        <SidebarContent 
          notes={notes}
          notesCount={notesCount}
          notesLimit={notesLimit}
          subscriptionStatus={subscriptionStatus}
          canCreateMore={canCreateMore}
          isCreating={isCreating}
          error={error}
          handleCreateNote={handleCreateNote}
          handleNoteSelect={handleNoteSelect}
          currentNote={currentNote}
          isAdmin={isAdmin}
        />
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-72 bg-card shadow-xl flex flex-col">
            <SidebarContent 
              notes={notes}
              notesCount={notesCount}
              notesLimit={notesLimit}
              subscriptionStatus={subscriptionStatus}
              canCreateMore={canCreateMore}
              isCreating={isCreating}
              error={error}
              handleCreateNote={handleCreateNote}
              handleNoteSelect={handleNoteSelect}
              currentNote={currentNote}
              isAdmin={isAdmin}
            />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showEditor && currentNote ? (
          <NoteEditor
            note={currentNote}
            onClose={handleCloseEditor}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
            <div className="text-center max-w-md">
              <FileText className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
              <h3 className="text-xl font-medium mb-2">
                Select a note to start editing
              </h3>
              <p className="text-muted-foreground mb-6">
                Choose a note from the sidebar or create a new one to begin writing.
              </p>
              
              {canCreateMore && (
                <Button 
                  onClick={handleCreateNote}
                  loading={isCreating}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Note
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarContent({
  notes,
  notesCount,
  notesLimit,
  subscriptionStatus,
  canCreateMore,
  isCreating,
  error,
  handleCreateNote,
  handleNoteSelect,
  currentNote,
  isAdmin,
}: SidebarContentProps) {
  return (
    <>
      <div className="p-6 border-b">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Notes</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {notesCount}/{notesLimit}
            </Badge>
            {subscriptionStatus === 'pro' && (
              <Badge variant="success" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </div>
        </div>

        {/* New Note Button */}
        <Button
          onClick={handleCreateNote}
          className="w-full"
          disabled={!canCreateMore || isCreating}
          loading={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>

        {/* Free plan limit alert */}
        {!canCreateMore && subscriptionStatus === 'free' && (
          <Alert variant="default" className="mt-4 p-3">
            <div className="text-sm">
              <p className="font-medium mb-1">Free plan limit reached</p>
              <p className="text-muted-foreground">
                You&apos;ve reached the 3 note limit for free accounts.
              </p>
            </div>
          </Alert>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">{error}</Alert>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No notes yet"
              description="Create your first note to get started with your multi-tenant workspace."
              action={
                <Button
                  onClick={handleCreateNote}
                  disabled={!canCreateMore || isCreating}
                  loading={isCreating}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Note
                </Button>
              }
            />
          </div>
        ) : (
          <NotesList
            notes={notes}
            selectedNote={currentNote}
            onNoteSelect={handleNoteSelect}
            loading={false}
          />
        )}
      </div>

      {/* Upgrade Prompt for admins */}
      {!canCreateMore && subscriptionStatus === 'free' && isAdmin && (
        <div className="p-4 border-t">
          <UpgradePrompt />
        </div>
      )}
    </>
  );
}