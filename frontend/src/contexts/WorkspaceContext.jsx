import { createContext, useContext, useState, useEffect } from 'react';
import {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
  getWorkspaceStats
} from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load workspaces on mount and when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load current workspace from localStorage
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      if (savedWorkspaceId) {
        const workspace = workspaces.find(w => w._id === savedWorkspaceId);
        if (workspace) {
          setCurrentWorkspace(workspace);
        } else {
          // Saved workspace not found, use first available
          setCurrentWorkspace(workspaces[0]);
          localStorage.setItem('currentWorkspaceId', workspaces[0]._id);
        }
      } else if (workspaces.length > 0) {
        // No saved workspace, use first one
        setCurrentWorkspace(workspaces[0]);
        localStorage.setItem('currentWorkspaceId', workspaces[0]._id);
      }
    }
  }, [workspaces, currentWorkspace]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWorkspaces();
      setWorkspaces(response.workspaces || []);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError(err.response?.data?.error || 'Failed to load workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId) => {
    try {
      const workspace = workspaces.find(w => w._id === workspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
        localStorage.setItem('currentWorkspaceId', workspaceId);
        return { success: true };
      } else {
        // Workspace not in list, try to fetch it
        const response = await getWorkspaceById(workspaceId);
        setCurrentWorkspace(response.workspace);
        localStorage.setItem('currentWorkspaceId', workspaceId);
        // Reload workspaces to include this one
        await loadWorkspaces();
        return { success: true };
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to switch workspace';
      setError(message);
      return { success: false, error: message };
    }
  };

  const createNewWorkspace = async (workspaceData) => {
    try {
      setError(null);
      const response = await createWorkspace(workspaceData);
      const newWorkspace = response.workspace;

      // Add to workspaces list
      setWorkspaces([newWorkspace, ...workspaces]);

      // Switch to new workspace
      setCurrentWorkspace(newWorkspace);
      localStorage.setItem('currentWorkspaceId', newWorkspace._id);

      return { success: true, workspace: newWorkspace };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to create workspace';
      setError(message);
      return { success: false, error: message };
    }
  };

  const updateCurrentWorkspace = async (updates) => {
    if (!currentWorkspace) {
      return { success: false, error: 'No workspace selected' };
    }

    try {
      setError(null);
      const response = await updateWorkspace(currentWorkspace._id, updates);
      const updatedWorkspace = response.workspace;

      // Update in workspaces list
      setWorkspaces(workspaces.map(w =>
        w._id === updatedWorkspace._id ? updatedWorkspace : w
      ));

      // Update current workspace
      setCurrentWorkspace(updatedWorkspace);

      return { success: true, workspace: updatedWorkspace };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update workspace';
      setError(message);
      return { success: false, error: message };
    }
  };

  const deleteCurrentWorkspace = async () => {
    if (!currentWorkspace) {
      return { success: false, error: 'No workspace selected' };
    }

    try {
      setError(null);
      await deleteWorkspace(currentWorkspace._id);

      // Remove from workspaces list
      const remainingWorkspaces = workspaces.filter(w => w._id !== currentWorkspace._id);
      setWorkspaces(remainingWorkspaces);

      // Switch to first remaining workspace or null
      if (remainingWorkspaces.length > 0) {
        setCurrentWorkspace(remainingWorkspaces[0]);
        localStorage.setItem('currentWorkspaceId', remainingWorkspaces[0]._id);
      } else {
        setCurrentWorkspace(null);
        localStorage.removeItem('currentWorkspaceId');
      }

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete workspace';
      setError(message);
      return { success: false, error: message };
    }
  };

  const inviteMember = async (userId, role = 'editor') => {
    if (!currentWorkspace) {
      return { success: false, error: 'No workspace selected' };
    }

    try {
      setError(null);
      const response = await addWorkspaceMember(currentWorkspace._id, { userId, role });
      const updatedWorkspace = response.workspace;

      // Update current workspace with new member
      setCurrentWorkspace(updatedWorkspace);

      // Update in workspaces list
      setWorkspaces(workspaces.map(w =>
        w._id === updatedWorkspace._id ? updatedWorkspace : w
      ));

      return { success: true, workspace: updatedWorkspace };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to add member';
      setError(message);
      return { success: false, error: message };
    }
  };

  const removeMember = async (userId) => {
    if (!currentWorkspace) {
      return { success: false, error: 'No workspace selected' };
    }

    try {
      setError(null);
      const response = await removeWorkspaceMember(currentWorkspace._id, userId);
      const updatedWorkspace = response.workspace;

      // Update current workspace
      setCurrentWorkspace(updatedWorkspace);

      // Update in workspaces list
      setWorkspaces(workspaces.map(w =>
        w._id === updatedWorkspace._id ? updatedWorkspace : w
      ));

      return { success: true, workspace: updatedWorkspace };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to remove member';
      setError(message);
      return { success: false, error: message };
    }
  };

  const changeMemberRole = async (userId, newRole) => {
    if (!currentWorkspace) {
      return { success: false, error: 'No workspace selected' };
    }

    try {
      setError(null);
      const response = await updateMemberRole(currentWorkspace._id, userId, newRole);
      const updatedWorkspace = response.workspace;

      // Update current workspace
      setCurrentWorkspace(updatedWorkspace);

      // Update in workspaces list
      setWorkspaces(workspaces.map(w =>
        w._id === updatedWorkspace._id ? updatedWorkspace : w
      ));

      return { success: true, workspace: updatedWorkspace };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update member role';
      setError(message);
      return { success: false, error: message };
    }
  };

  const getStats = async () => {
    if (!currentWorkspace) {
      return { success: false, error: 'No workspace selected' };
    }

    try {
      const response = await getWorkspaceStats(currentWorkspace._id);
      return { success: true, stats: response.stats };
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to get workspace stats';
      return { success: false, error: message };
    }
  };

  const value = {
    workspaces,
    currentWorkspace,
    loading,
    error,
    switchWorkspace,
    createWorkspace: createNewWorkspace,
    updateWorkspace: updateCurrentWorkspace,
    deleteWorkspace: deleteCurrentWorkspace,
    inviteMember,
    removeMember,
    changeMemberRole,
    getStats,
    refreshWorkspaces: loadWorkspaces,
    hasWorkspaces: workspaces.length > 0
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceContext;
