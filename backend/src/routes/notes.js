/**
 * Notes API Routes
 *
 * CRUD operations for collaborative case notes on mediators.
 * Notes are primarily used by attorneys to track mediator evaluations and case details.
 *
 * @module routes/notes
 */

const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { authenticateWithRole } = require('../middleware/roleAuth');
const { sanitizeInput } = require('../utils/sanitization');
const logger = require('../config/logger');

// Notes are available to attorneys and admins
router.use(authenticateWithRole(['attorney', 'admin']));

/**
 * GET /api/notes
 * Get notes for a mediator or search notes
 */
router.get('/', async (req, res) => {
  try {
    const { mediatorId, q, workspaceId } = req.query;
    const userId = req.user._id;

    // Search notes if query provided
    if (q) {
      const searchTerm = sanitizeInput(q);
      const notes = await Note.searchNotes(searchTerm, userId, workspaceId);

      return res.json({
        success: true,
        count: notes.length,
        notes
      });
    }

    // Get notes for specific mediator
    if (mediatorId) {
      const notes = await Note.findByMediator(mediatorId, userId, workspaceId);

      return res.json({
        success: true,
        count: notes.length,
        notes
      });
    }

    // Get all user's notes
    const notes = await Note.find({
      $or: [
        { userId, visibility: 'private' },
        { workspaceId, visibility: 'team' }
      ]
    })
      .populate('mediatorId', 'name')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      count: notes.length,
      notes
    });

  } catch (error) {
    logger.error('[Notes API] Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', async (req, res) => {
  try {
    const { mediatorId, content, caseId, tags, visibility, workspaceId } = req.body;
    const userId = req.user._id;

    // Validation
    if (!mediatorId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Mediator ID and content are required'
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Note content cannot exceed 10,000 characters'
      });
    }

    // Team notes require workspace
    if (visibility === 'team' && !workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'Workspace ID required for team notes'
      });
    }

    // Sanitize input
    const sanitizedContent = sanitizeInput(content);
    const sanitizedTags = tags ? tags.map(tag => sanitizeInput(tag)) : [];

    // Create note
    const note = new Note({
      userId,
      mediatorId,
      content: sanitizedContent,
      caseId: caseId ? sanitizeInput(caseId) : undefined,
      tags: sanitizedTags,
      visibility: visibility || 'private',
      workspaceId: workspaceId || undefined
    });

    await note.save();

    // Populate user info
    await note.populate('userId', 'name email');

    logger.info(`[Notes API] Note created: ${note._id} by user ${userId}`);

    res.status(201).json({
      success: true,
      note
    });

  } catch (error) {
    logger.error('[Notes API] Error creating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/notes/:id
 * Update a note
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, caseId, tags, visibility } = req.body;
    const userId = req.user._id;

    // Find note and verify ownership
    const note = await Note.findOne({ _id: id, userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found or you do not have permission to edit it'
      });
    }

    // Update fields
    if (content !== undefined) {
      if (content.length > 10000) {
        return res.status(400).json({
          success: false,
          error: 'Note content cannot exceed 10,000 characters'
        });
      }
      note.content = sanitizeInput(content);
    }

    if (caseId !== undefined) {
      note.caseId = caseId ? sanitizeInput(caseId) : null;
    }

    if (tags !== undefined) {
      note.tags = tags.map(tag => sanitizeInput(tag));
    }

    if (visibility !== undefined) {
      note.visibility = visibility;
    }

    await note.save();
    await note.populate('userId', 'name email');

    logger.info(`[Notes API] Note updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      note
    });

  } catch (error) {
    logger.error('[Notes API] Error updating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find and delete note (verify ownership)
    const note = await Note.findOneAndDelete({ _id: id, userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found or you do not have permission to delete it'
      });
    }

    logger.info(`[Notes API] Note deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    logger.error('[Notes API] Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/notes/stats
 * Get note statistics for current user
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await Note.getStats(userId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('[Notes API] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
