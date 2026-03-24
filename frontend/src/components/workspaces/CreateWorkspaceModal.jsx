import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTranslation } from 'react-i18next';

/**
 * CreateWorkspaceModal - Modal for creating new team workspaces
 *
 * Allows users to create a new workspace with a name and optional settings.
 */
const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    if (name.length > 100) {
      setError('Workspace name cannot exceed 100 characters');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createWorkspace({
      name: name.trim(),
      tier,
      settings: {
        allowMemberInvites: true,
        requireApprovalForLists: false,
        defaultNoteVisibility: 'team'
      }
    });

    setLoading(false);

    if (result.success) {
      // Reset form and close
      setName('');
      setTier('free');
      onClose();
    } else {
      setError(result.error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setTier('free');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Create New Workspace</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Workspace Name */}
          <div>
            <label htmlFor="workspace-name" className="block text-sm font-medium text-slate-300 mb-2">
              Workspace Name <span className="text-red-400">*</span>
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Legal Team"
              maxLength={100}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
            <p className="text-slate-400 text-xs mt-1">
              {name.length}/100 characters
            </p>
          </div>

          {/* Tier Selection */}
          <div>
            <label htmlFor="workspace-tier" className="block text-sm font-medium text-slate-300 mb-2">
              Plan
            </label>
            <select
              id="workspace-tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="free">Free</option>
              <option value="team">Team ($199/month)</option>
              <option value="enterprise">Enterprise (Custom)</option>
            </select>
          </div>

          {/* Info Text */}
          <div className="bg-blue-500 bg-opacity-10 border border-blue-500 px-4 py-3 rounded-lg">
            <p className="text-blue-400 text-sm">
              You'll be the owner of this workspace and can invite team members after creation.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
