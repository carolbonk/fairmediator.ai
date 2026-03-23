/**
 * Note Model - Collaborative Case Notes
 *
 * Allows team members to add private notes to mediator profiles.
 * Supports markdown formatting and full-text search.
 *
 * @module models/Note
 */

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  // User who created the note
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Mediator this note is about
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true,
    index: true
  },

  // Optional case reference
  caseId: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // Note content (supports markdown)
  content: {
    type: String,
    required: true,
    maxlength: 10000,
    trim: true
  },

  // Tags for categorization
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.length <= 10 && tags.every(tag => tag.length <= 50);
      },
      message: 'Maximum 10 tags, each up to 50 characters'
    }
  },

  // Visibility (private to user, or shared with team)
  visibility: {
    type: String,
    enum: ['private', 'team'],
    default: 'private'
  },

  // Workspace ID (for team notes)
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
noteSchema.index({ userId: 1, mediatorId: 1 });
noteSchema.index({ mediatorId: 1, createdAt: -1 });
noteSchema.index({ workspaceId: 1, mediatorId: 1 });

// Text index for full-text search
noteSchema.index({ content: 'text', tags: 'text' });

/**
 * Find notes by mediator
 *
 * @param {String} mediatorId - Mediator ID
 * @param {String} userId - User ID (for private notes)
 * @param {String} workspaceId - Workspace ID (for team notes)
 * @returns {Array} Notes
 */
noteSchema.statics.findByMediator = async function(mediatorId, userId, workspaceId = null) {
  const query = {
    mediatorId,
    $or: [
      { userId, visibility: 'private' },
      { workspaceId, visibility: 'team' }
    ]
  };

  // Remove workspace filter if not provided
  if (!workspaceId) {
    delete query.$or[1];
  }

  return this.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Search notes by content/tags
 *
 * @param {String} searchTerm - Search query
 * @param {String} userId - User ID
 * @param {String} workspaceId - Workspace ID (optional)
 * @returns {Array} Matching notes
 */
noteSchema.statics.searchNotes = async function(searchTerm, userId, workspaceId = null) {
  const query = {
    $text: { $search: searchTerm },
    $or: [
      { userId, visibility: 'private' },
      { workspaceId, visibility: 'team' }
    ]
  };

  if (!workspaceId) {
    delete query.$or[1];
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('userId', 'name email')
    .populate('mediatorId', 'name')
    .sort({ score: { $meta: 'textScore' } })
    .limit(50)
    .lean();
};

/**
 * Get note statistics for user
 *
 * @param {String} userId - User ID
 * @returns {Object} Statistics
 */
noteSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        uniqueMediators: { $addToSet: '$mediatorId' },
        totalTags: { $push: '$tags' }
      }
    },
    {
      $project: {
        _id: 0,
        totalNotes: 1,
        uniqueMediators: { $size: '$uniqueMediators' },
        totalTags: {
          $size: {
            $reduce: {
              input: '$totalTags',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          }
        }
      }
    }
  ]);

  return stats[0] || { totalNotes: 0, uniqueMediators: 0, totalTags: 0 };
};

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
