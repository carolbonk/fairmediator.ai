import { useState, useEffect } from 'react';
import { FaPlus, FaStar, FaBan, FaCheckCircle, FaList, FaEdit, FaTrash } from 'react-icons/fa';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { getSharedLists, createSharedList, deleteSharedList } from '../../services/api';
import { useTranslation } from 'react-i18next';

/**
 * SharedListsPanel - Manage shared mediator lists within workspaces
 *
 * Displays all shared lists in the current workspace and allows creating,
 * editing, and deleting lists. Users can filter by list type.
 */
const SharedListsPanel = () => {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const [lists, setLists] = useState([]);
  const [filteredLists, setFilteredLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load lists when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      loadLists();
    } else {
      setLists([]);
      setFilteredLists([]);
      setLoading(false);
    }
  }, [currentWorkspace]);

  // Filter lists when selectedType or lists change
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredLists(lists);
    } else {
      setFilteredLists(lists.filter(list => list.type === selectedType));
    }
  }, [selectedType, lists]);

  const loadLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSharedLists(currentWorkspace._id);
      setLists(response.lists || []);
    } catch (err) {
      console.error('Failed to load lists:', err);
      setError(err.response?.data?.error || 'Failed to load lists');
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (listData) => {
    try {
      await createSharedList({
        ...listData,
        workspaceId: currentWorkspace._id
      });
      await loadLists();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create list:', err);
      alert(err.response?.data?.error || 'Failed to create list');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSharedList(listId);
      await loadLists();
    } catch (err) {
      console.error('Failed to delete list:', err);
      alert(err.response?.data?.error || 'Failed to delete list');
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Please select a workspace to view shared lists</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const LIST_TYPE_ICONS = {
    vetted: <FaCheckCircle className="text-green-400" />,
    blacklist: <FaBan className="text-red-400" />,
    favorites: <FaStar className="text-yellow-400" />,
    watching: <FaList className="text-blue-400" />,
    custom: <FaList className="text-slate-400" />
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Shared Lists</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FaPlus /> Create List
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'vetted', 'blacklist', 'favorites', 'watching', 'custom'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Lists Grid */}
      {filteredLists.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <FaList className="text-slate-600 text-5xl mx-auto mb-4" />
          <p className="text-slate-400 mb-4">
            {selectedType === 'all'
              ? 'No shared lists yet'
              : `No ${selectedType} lists yet`}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Your First List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => (
            <div
              key={list._id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
            >
              {/* List Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {LIST_TYPE_ICONS[list.type]}
                  <h3 className="text-white font-semibold">{list.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                    aria-label="Edit list"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteList(list._id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    aria-label="Delete list"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* List Description */}
              {list.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                  {list.description}
                </p>
              )}

              {/* List Stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {list.mediators?.length || 0} mediators
                </span>
                <span className="text-slate-500">
                  {list.type}
                </span>
              </div>

              {/* Tags */}
              {list.tags && list.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {list.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {list.tags.length > 3 && (
                    <span className="px-2 py-1 text-slate-400 text-xs">
                      +{list.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create List Modal (Simple Version) */}
      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateList}
        />
      )}
    </div>
  );
};

// Simple Create List Modal Component
const CreateListModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('custom');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      type,
      tags: []
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Create Shared List</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                List Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vetted Mediators"
                maxLength={100}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mediators we've worked with successfully"
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                List Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="custom">Custom</option>
                <option value="vetted">Vetted</option>
                <option value="blacklist">Blacklist</option>
                <option value="favorites">Favorites</option>
                <option value="watching">Watching</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create List
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SharedListsPanel;
