import React, { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../../services/api';
import { useTranslation } from 'react-i18next';

/**
 * NotesSection - Collaborative case notes for mediators
 *
 * Displays private notes on mediator profiles.
 * Allows team members to share knowledge and observations.
 */
function NotesSection({ mediatorId, workspaceId = null }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [mediatorId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await getNotes({ mediatorId, workspaceId });
      setNotes(response.notes);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const response = await createNote({
        mediatorId,
        content: newNote,
        visibility: workspaceId ? 'team' : 'private',
        workspaceId
      });

      setNotes([response.note, ...notes]);
      setNewNote('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create note');
    }
  };

  const handleUpdate = async (id) => {
    if (!editContent.trim()) return;

    try {
      const response = await updateNote(id, { content: editContent });
      setNotes(notes.map(note => note._id === id ? response.note : note));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update note');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(id);
      setNotes(notes.filter(note => note._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete note');
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create new note form */}
      <form onSubmit={handleCreate} className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about this mediator..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
          rows="3"
        />
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No notes yet. Add your first note about this mediator.
          </p>
        ) : (
          // TODO(human): Implement the notes list display here
          // Each note should show:
          // - content (with edit mode if editingId matches)
          // - author name (userId.name)
          // - created date (formatted)
          // - edit/delete buttons (only for note owner)
          // Use dark neumorphic card styling to match the app theme
          <div>
            {/* Your implementation here */}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesSection;
