/**
 * Workspace API Routes
 *
 * Team collaboration workspaces for sharing mediator lists and notes.
 *
 * @module routes/workspaces
 */

const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const { authenticate } = require('../middleware/auth');
const { sanitizeInput } = require('../utils/sanitization');
const logger = require('../config/logger');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/workspaces
 * Get all workspaces where user is a member
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaces = await Workspace.findByMember(userId);

    res.json({
      success: true,
      count: workspaces.length,
      workspaces
    });

  } catch (error) {
    logger.error('[Workspaces API] Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspaces',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post('/', async (req, res) => {
  try {
    const { name, settings, tier } = req.body;
    const userId = req.user._id;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Workspace name is required'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Workspace name cannot exceed 100 characters'
      });
    }

    // Create workspace
    const workspace = new Workspace({
      name: sanitizeInput(name),
      ownerId: userId,
      settings: settings || {},
      tier: tier || 'free',
      members: [] // Owner is not in members array (tracked via ownerId)
    });

    await workspace.save();
    await workspace.populate('ownerId', 'name email');

    logger.info(`[Workspaces API] Workspace created: ${workspace._id} by user ${userId}`);

    res.status(201).json({
      success: true,
      workspace
    });

  } catch (error) {
    logger.error('[Workspaces API] Error creating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workspace',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/workspaces/:id
 * Get a specific workspace
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(id)
      .populate('ownerId', 'name email')
      .populate('members.userId', 'name email')
      .populate('members.addedBy', 'name');

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Verify user is a member
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this workspace'
      });
    }

    res.json({
      success: true,
      workspace
    });

  } catch (error) {
    logger.error('[Workspaces API] Error fetching workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/workspaces/:id
 * Update workspace settings
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, settings, tier } = req.body;
    const userId = req.user._id;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Only owner/admin can update workspace
    if (!workspace.hasPermission(userId, 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this workspace'
      });
    }

    // Update fields
    if (name !== undefined) {
      if (!name.trim() || name.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Workspace name must be 1-100 characters'
        });
      }
      workspace.name = sanitizeInput(name);
    }

    if (settings !== undefined) {
      workspace.settings = { ...workspace.settings, ...settings };
    }

    // Only owner can change tier (billing)
    if (tier !== undefined) {
      if (!workspace.hasPermission(userId, 'billing')) {
        return res.status(403).json({
          success: false,
          error: 'Only the workspace owner can change the subscription tier'
        });
      }
      workspace.tier = tier;
    }

    await workspace.save();
    await workspace.populate('ownerId', 'name email');
    await workspace.populate('members.userId', 'name email');

    logger.info(`[Workspaces API] Workspace updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      workspace
    });

  } catch (error) {
    logger.error('[Workspaces API] Error updating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workspace',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/workspaces/:id
 * Soft delete a workspace (set isActive = false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Only owner can delete workspace
    if (workspace.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the workspace owner can delete the workspace'
      });
    }

    // Soft delete
    workspace.isActive = false;
    await workspace.save();

    logger.info(`[Workspaces API] Workspace deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Workspace deleted successfully'
    });

  } catch (error) {
    logger.error('[Workspaces API] Error deleting workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workspace',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/workspaces/:id/members
 * Add a member to workspace
 */
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: newUserId, role } = req.body;
    const currentUserId = req.user._id;

    // Validation
    if (!newUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Check permissions
    const canInvite = workspace.hasPermission(currentUserId, 'admin') ||
                     (workspace.settings.allowMemberInvites && workspace.isMember(currentUserId));

    if (!canInvite) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to add members to this workspace'
      });
    }

    // Add member
    try {
      await workspace.addMember(newUserId, role || 'editor', currentUserId);
      await workspace.populate('members.userId', 'name email');
      await workspace.populate('members.addedBy', 'name');

      logger.info(`[Workspaces API] Member added to workspace ${id}: ${newUserId} by ${currentUserId}`);

      res.status(201).json({
        success: true,
        workspace
      });

    } catch (err) {
      // Handle duplicate member error
      if (err.message.includes('already a member')) {
        return res.status(409).json({
          success: false,
          error: err.message
        });
      }
      throw err;
    }

  } catch (error) {
    logger.error('[Workspaces API] Error adding member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/workspaces/:id/members/:userId
 * Remove a member from workspace
 */
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId: memberUserId } = req.params;
    const currentUserId = req.user._id;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Users can remove themselves, or admins can remove others
    const canRemove = memberUserId === currentUserId.toString() ||
                     workspace.hasPermission(currentUserId, 'admin');

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to remove this member'
      });
    }

    // Remove member
    try {
      await workspace.removeMember(memberUserId);
      await workspace.populate('members.userId', 'name email');

      logger.info(`[Workspaces API] Member removed from workspace ${id}: ${memberUserId} by ${currentUserId}`);

      res.json({
        success: true,
        workspace
      });

    } catch (err) {
      // Handle "cannot remove owner" error
      if (err.message.includes('Cannot remove')) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      throw err;
    }

  } catch (error) {
    logger.error('[Workspaces API] Error removing member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/workspaces/:id/members/:userId
 * Update member role
 */
router.patch('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId: memberUserId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user._id;

    // Validation
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const validRoles = ['admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Only admins can change roles
    if (!workspace.hasPermission(currentUserId, 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to change member roles'
      });
    }

    // Update role
    try {
      await workspace.updateMemberRole(memberUserId, role);
      await workspace.populate('members.userId', 'name email');

      logger.info(`[Workspaces API] Member role updated in workspace ${id}: ${memberUserId} to ${role} by ${currentUserId}`);

      res.json({
        success: true,
        workspace
      });

    } catch (err) {
      // Handle errors from model method
      if (err.message.includes('not a member') || err.message.includes('Cannot change')) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      throw err;
    }

  } catch (error) {
    logger.error('[Workspaces API] Error updating member role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member role',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/workspaces/:id/stats
 * Get workspace statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Verify user is a member
    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this workspace'
      });
    }

    const stats = await workspace.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('[Workspaces API] Error fetching workspace stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
