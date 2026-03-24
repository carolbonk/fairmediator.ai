import { useState, useRef, useEffect } from 'react';
import { FaBuilding, FaChevronDown, FaPlus, FaCheck } from 'react-icons/fa';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTranslation } from 'react-i18next';

/**
 * WorkspaceSwitcher - Dropdown to switch between team workspaces
 *
 * Displays current workspace and allows switching to other workspaces.
 * Users can also create new workspaces from this menu.
 */
const WorkspaceSwitcher = ({ onCreateWorkspace }) => {
  const { t } = useTranslation();
  const { workspaces, currentWorkspace, switchWorkspace, loading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSwitchWorkspace = async (workspaceId) => {
    if (workspaceId === currentWorkspace?._id) {
      setIsOpen(false);
      return;
    }

    const result = await switchWorkspace(workspaceId);
    if (result.success) {
      setIsOpen(false);
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onCreateWorkspace) {
      onCreateWorkspace();
    }
  };

  // Don't render if no workspaces available
  if (!workspaces || workspaces.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg animate-pulse">
        <FaBuilding className="text-slate-400" />
        <div className="h-4 w-24 bg-slate-600 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Workspace Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white text-sm font-medium"
        aria-label="Switch workspace"
        aria-expanded={isOpen}
      >
        <FaBuilding className="text-slate-300" aria-hidden="true" />
        <span className="max-w-32 truncate">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>
        <FaChevronDown
          className={`text-slate-400 text-xs transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Workspaces List */}
          <div className="max-h-80 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace._id}
                onClick={() => handleSwitchWorkspace(workspace._id)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors text-left ${
                  workspace._id === currentWorkspace?._id ? 'bg-slate-700' : ''
                }`}
                aria-label={`Switch to ${workspace.name}`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-white font-medium truncate">
                    {workspace.name}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {workspace.members?.length + 1 || 1} {workspace.members?.length === 0 ? 'member' : 'members'}
                  </span>
                </div>
                {workspace._id === currentWorkspace?._id && (
                  <FaCheck className="text-green-400 ml-2 flex-shrink-0" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700"></div>

          {/* Create New Workspace */}
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700 transition-colors text-blue-400 hover:text-blue-300"
            aria-label="Create new workspace"
          >
            <FaPlus aria-hidden="true" />
            <span className="font-medium">Create New Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
