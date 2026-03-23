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
          notes.map((note) => (
            <div
              key={note._id}
              className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700"
            >
              {/* Edit mode */}
              {editingId === note._id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(note._id)}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Note content */}
                  <p className="text-gray-100 whitespace-pre-wrap mb-3">
                    {note.content}
                  </p>

                  {/* Metadata and actions */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">
                        {note.userId?.name || 'Unknown'}
                      </span>
                      {' • '}
                      <span>
                        {new Date(note.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="px-3 py-1 text-gray-400 hover:text-slate-400 transition-colors"
                        aria-label="Edit note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="px-3 py-1 text-gray-400 hover:text-red-400 transition-colors"
                        aria-label="Delete note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotesSection;
