/**
 * Shared Lists API Routes
 *
 * Collaborative mediator lists within team workspaces.
 * Teams can create vetted lists, blacklists, favorites, and custom lists.
 * Shared lists are attorney-specific features for team collaboration.
 *
 * @module routes/sharedLists
 */

const express = require('express');
const router = express.Router();
const SharedList = require('../models/SharedList');
const Workspace = require('../models/Workspace');
const { authenticateWithRole } = require('../middleware/roleAuth');
const { sanitizeInput } = require('../utils/sanitization');
const logger = require('../config/logger');

// Shared lists are attorney-only features
router.use(authenticateWithRole(['attorney', 'admin']));

/**
 * GET /api/shared-lists
 * Get all lists for a workspace, optionally filtered by type
 */
router.get('/', async (req, res) => {
  try {
    const { workspaceId, type } = req.query;
    const userId = req.user._id;

    // Workspace ID is required
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Workspace ID is required'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this workspace'
      });
    }

    // Get lists
    const lists = await SharedList.findByWorkspace(workspaceId, type || null);

    res.json({
      success: true,
      count: lists.length,
      lists
    });

  } catch (error) {
    logger.error('[SharedLists API] Error fetching lists:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lists',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/shared-lists
 * Create a new shared list
 */
router.post('/', async (req, res) => {
  try {
    const { workspaceId, name, description, type, tags, settings } = req.body;
    const userId = req.user._id;

    // Validation
    if (!workspaceId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Workspace ID and list name are required'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'List name cannot exceed 100 characters'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    if (!workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this workspace'
      });
    }

    // Check write permissions
    if (!workspace.hasPermission(userId, 'write')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to create lists in this workspace'
      });
    }

    // Create list
    const list = new SharedList({
      workspaceId,
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
      type: type || 'custom',
      tags: tags ? tags.map(tag => sanitizeInput(tag)) : [],
      createdBy: userId,
      settings: settings || {},
      mediators: []
    });

    await list.save();
    await list.populate('createdBy', 'name email');

    logger.info(`[SharedLists API] List created: ${list._id} in workspace ${workspaceId} by user ${userId}`);

    res.status(201).json({
      success: true,
      list
    });

  } catch (error) {
    logger.error('[SharedLists API] Error creating list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/shared-lists/:id
 * Get a specific shared list
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const list = await SharedList.findById(id)
      .populate('createdBy', 'name email')
      .populate('mediators.addedBy', 'name')
      .populate('mediators.mediatorId', 'name organization');

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(list.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this list'
      });
    }

    res.json({
      success: true,
      list
    });

  } catch (error) {
    logger.error('[SharedLists API] Error fetching list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/shared-lists/:id
 * Update list metadata (name, description, tags, settings)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, tags, settings } = req.body;
    const userId = req.user._id;

    const list = await SharedList.findById(id);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(list.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this list'
      });
    }

    // Check edit permissions
    const canEdit = workspace.hasPermission(userId, 'write') &&
                   (list.settings.allowMemberEdits || list.createdBy.toString() === userId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this list'
      });
    }

    // Update fields
    if (name !== undefined) {
      if (!name.trim() || name.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'List name must be 1-100 characters'
        });
      }
      list.name = sanitizeInput(name);
    }

    if (description !== undefined) {
      list.description = description ? sanitizeInput(description) : '';
    }

    if (type !== undefined) {
      list.type = type;
    }

    if (tags !== undefined) {
      list.tags = tags.map(tag => sanitizeInput(tag));
    }

    if (settings !== undefined) {
      list.settings = { ...list.settings, ...settings };
    }

    await list.save();
    await list.populate('createdBy', 'name email');

    logger.info(`[SharedLists API] List updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      list
    });

  } catch (error) {
    logger.error('[SharedLists API] Error updating list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/shared-lists/:id
 * Delete a shared list
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const list = await SharedList.findById(id);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(list.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this list'
      });
    }

    // Only creator or workspace admins can delete
    const canDelete = list.createdBy.toString() === userId.toString() ||
                     workspace.hasPermission(userId, 'admin');

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this list'
      });
    }

    await SharedList.findByIdAndDelete(id);

    logger.info(`[SharedLists API] List deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'List deleted successfully'
    });

  } catch (error) {
    logger.error('[SharedLists API] Error deleting list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete list',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/shared-lists/:id/mediators
 * Add a mediator to the list
 */
router.post('/:id/mediators', async (req, res) => {
  try {
    const { id } = req.params;
    const { mediatorId, notes, tags } = req.body;
    const userId = req.user._id;

    // Validation
    if (!mediatorId) {
      return res.status(400).json({
        success: false,
        error: 'Mediator ID is required'
      });
    }

    const list = await SharedList.findById(id);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(list.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this list'
      });
    }

    // Check edit permissions
    const canEdit = workspace.hasPermission(userId, 'write') &&
                   (list.settings.allowMemberEdits || list.createdBy.toString() === userId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this list'
      });
    }

    // Add mediator
    try {
      await list.addMediator(mediatorId, userId, {
        notes: notes ? sanitizeInput(notes) : '',
        tags: tags ? tags.map(tag => sanitizeInput(tag)) : []
      });

      await list.populate('mediators.mediatorId', 'name organization');
      await list.populate('mediators.addedBy', 'name');

      logger.info(`[SharedLists API] Mediator added to list ${id}: ${mediatorId} by user ${userId}`);

      res.status(201).json({
        success: true,
        list
      });

    } catch (err) {
      // Handle duplicate mediator error
      if (err.message.includes('already in this list')) {
        return res.status(409).json({
          success: false,
          error: err.message
        });
      }
      throw err;
    }

  } catch (error) {
    logger.error('[SharedLists API] Error adding mediator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add mediator',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/shared-lists/:id/mediators/:mediatorId
 * Update mediator notes/tags in the list
 */
router.patch('/:id/mediators/:mediatorId', async (req, res) => {
  try {
    const { id, mediatorId } = req.params;
    const { notes, tags } = req.body;
    const userId = req.user._id;

    const list = await SharedList.findById(id);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(list.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this list'
      });
    }

    // Check edit permissions
    const canEdit = workspace.hasPermission(userId, 'write') &&
                   (list.settings.allowMemberEdits || list.createdBy.toString() === userId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this list'
      });
    }

    // Update mediator
    try {
      const updates = {};
      if (notes !== undefined) updates.notes = sanitizeInput(notes);
      if (tags !== undefined) updates.tags = tags.map(tag => sanitizeInput(tag));

      await list.updateMediator(mediatorId, updates);
      await list.populate('mediators.mediatorId', 'name organization');
      await list.populate('mediators.addedBy', 'name');

      logger.info(`[SharedLists API] Mediator updated in list ${id}: ${mediatorId} by user ${userId}`);

      res.json({
        success: true,
        list
      });

    } catch (err) {
      // Handle "mediator not found" error
      if (err.message.includes('not found in this list')) {
        return res.status(404).json({
          success: false,
          error: err.message
        });
      }
      throw err;
    }

  } catch (error) {
    logger.error('[SharedLists API] Error updating mediator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update mediator',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/shared-lists/:id/mediators/:mediatorId
 * Remove a mediator from the list
 */
router.delete('/:id/mediators/:mediatorId', async (req, res) => {
  try {
    const { id, mediatorId } = req.params;
    const userId = req.user._id;

    const list = await SharedList.findById(id);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(list.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this list'
      });
    }

    // Check edit permissions
    const canEdit = workspace.hasPermission(userId, 'write') &&
                   (list.settings.allowMemberEdits || list.createdBy.toString() === userId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this list'
      });
    }

    // Remove mediator
    await list.removeMediator(mediatorId);

    logger.info(`[SharedLists API] Mediator removed from list ${id}: ${mediatorId} by user ${userId}`);

    res.json({
      success: true,
      list
    });

  } catch (error) {
    logger.error('[SharedLists API] Error removing mediator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove mediator',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/shared-lists/:id/stats
 * Get list statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const list = await SharedList.findById(id);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(list.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this list'
      });
    }

    const stats = list.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('[SharedLists API] Error fetching list stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/shared-lists/mediator/:mediatorId
 * Find all lists containing a specific mediator
 */
router.get('/mediator/:mediatorId', async (req, res) => {
  try {
    const { mediatorId } = req.params;
    const { workspaceId } = req.query;
    const userId = req.user._id;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Workspace ID is required'
      });
    }

    // Verify user has access to workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this workspace'
      });
    }

    const lists = await SharedList.findByMediator(mediatorId, workspaceId);

    res.json({
      success: true,
      count: lists.length,
      lists
    });

  } catch (error) {
    logger.error('[SharedLists API] Error fetching lists by mediator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lists',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
