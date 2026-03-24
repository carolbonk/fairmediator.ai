import { useState } from 'react';
import { FaTimes, FaUserPlus } from 'react-icons/fa';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTranslation } from 'react-i18next';

/**
 * InviteMemberModal - Modal for inviting team members to workspaces
 *
 * Allows workspace admins to invite new members by user ID and assign roles.
 */
const InviteMemberModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { inviteMember, currentWorkspace } = useWorkspace();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    if (!currentWorkspace) {
      setError('No workspace selected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await inviteMember(userId.trim(), role);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setUserId('');
      setRole('editor');

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setUserId('');
      setRole('editor');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FaUserPlus className="text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Invite Team Member</h2>
          </div>
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

          {/* Success Display */}
          {success && (
            <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
              Member invited successfully!
            </div>
          )}

          {/* Workspace Info */}
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-300 text-sm">
              <span className="text-slate-400">Workspace:</span>{' '}
              <span className="font-medium">{currentWorkspace?.name}</span>
            </p>
          </div>

          {/* User ID Input */}
          <div>
            <label htmlFor="user-id" className="block text-sm font-medium text-slate-300 mb-2">
              User ID or Email <span className="text-red-400">*</span>
            </label>
            <input
              id="user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user@example.com or user-id"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
            <p className="text-slate-400 text-xs mt-1">
              Enter the user's email address or User ID from their profile
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="member-role" className="block text-sm font-medium text-slate-300 mb-2">
              Role
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="viewer">Viewer - Can view lists and notes</option>
              <option value="editor">Editor - Can edit lists and add notes</option>
              <option value="admin">Admin - Can manage members and settings</option>
            </select>
          </div>

          {/* Role Descriptions */}
          <div className="bg-blue-500 bg-opacity-10 border border-blue-500 px-4 py-3 rounded-lg">
            <p className="text-blue-400 text-sm font-medium mb-2">Role Permissions:</p>
            <ul className="text-blue-300 text-xs space-y-1">
              <li>• <strong>Viewer:</strong> Read-only access to workspace</li>
              <li>• <strong>Editor:</strong> Can create and edit lists, add notes</li>
              <li>• <strong>Admin:</strong> Full access including member management</li>
            </ul>
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
              disabled={loading || !userId.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Inviting...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Invite Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
