/**
 * SharedList Model - Shared mediator lists within workspaces
 *
 * Teams can create curated lists of mediators (vetted, blacklisted, favorites, etc.)
 * and share them across the workspace.
 *
 * @module models/SharedList
 */

const mongoose = require('mongoose');

const sharedListSchema = new mongoose.Schema({
  // Workspace this list belongs to
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },

  // List name
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // List description
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // List type/category
  type: {
    type: String,
    enum: ['vetted', 'blacklist', 'favorites', 'watching', 'custom'],
    default: 'custom'
  },

  // Mediators in this list
  mediators: [{
    mediatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mediator',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      maxlength: 500
    },
    tags: {
      type: [String],
      default: []
    }
  }],

  // Custom tags for this list
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.length <= 20 && tags.every(tag => tag.length <= 50);
      },
      message: 'Maximum 20 tags, each up to 50 characters'
    }
  },

  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // List settings
  settings: {
    allowMemberEdits: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
sharedListSchema.index({ workspaceId: 1, type: 1 });
sharedListSchema.index({ workspaceId: 1, createdAt: -1 });
sharedListSchema.index({ 'mediators.mediatorId': 1 });

/**
 * Add mediator to list
 *
 * @param {String} mediatorId - Mediator ID
 * @param {String} userId - User adding the mediator
 * @param {Object} options - Notes, tags
 * @returns {Object} Updated list
 */
sharedListSchema.methods.addMediator = async function(mediatorId, userId, options = {}) {
  // Check if mediator already in list
  const existing = this.mediators.find(m => m.mediatorId.toString() === mediatorId.toString());
  if (existing) {
    throw new Error('Mediator already in this list');
  }

  this.mediators.push({
    mediatorId,
    addedBy: userId,
    notes: options.notes || '',
    tags: options.tags || []
  });

  return this.save();
};

/**
 * Remove mediator from list
 *
 * @param {String} mediatorId - Mediator ID
 * @returns {Object} Updated list
 */
sharedListSchema.methods.removeMediator = async function(mediatorId) {
  this.mediators = this.mediators.filter(m => m.mediatorId.toString() !== mediatorId.toString());
  return this.save();
};

/**
 * Update mediator in list
 *
 * @param {String} mediatorId - Mediator ID
 * @param {Object} updates - Notes, tags to update
 * @returns {Object} Updated list
 */
sharedListSchema.methods.updateMediator = async function(mediatorId, updates) {
  const mediator = this.mediators.find(m => m.mediatorId.toString() === mediatorId.toString());

  if (!mediator) {
    throw new Error('Mediator not found in this list');
  }

  if (updates.notes !== undefined) mediator.notes = updates.notes;
  if (updates.tags !== undefined) mediator.tags = updates.tags;

  return this.save();
};

/**
 * Check if mediator is in list
 *
 * @param {String} mediatorId - Mediator ID
 * @returns {Boolean} True if in list
 */
sharedListSchema.methods.hasMediator = function(mediatorId) {
  return this.mediators.some(m => m.mediatorId.toString() === mediatorId.toString());
};

/**
 * Find lists by workspace
 *
 * @param {String} workspaceId - Workspace ID
 * @param {String} type - Optional list type filter
 * @returns {Array} Lists
 */
sharedListSchema.statics.findByWorkspace = async function(workspaceId, type = null) {
  const query = { workspaceId };
  if (type) query.type = type;

  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('mediators.addedBy', 'name')
    .sort({ updatedAt: -1 })
    .lean();
};

/**
 * Find lists containing mediator
 *
 * @param {String} mediatorId - Mediator ID
 * @param {String} workspaceId - Workspace ID
 * @returns {Array} Lists
 */
sharedListSchema.statics.findByMediator = async function(mediatorId, workspaceId) {
  return this.find({
    workspaceId,
    'mediators.mediatorId': mediatorId
  })
    .populate('createdBy', 'name')
    .select('name type tags')
    .lean();
};

/**
 * Get list statistics
 *
 * @returns {Object} Statistics
 */
sharedListSchema.methods.getStats = function() {
  const tagCounts = {};
  this.mediators.forEach(m => {
    m.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return {
    mediatorCount: this.mediators.length,
    uniqueTags: Object.keys(tagCounts).length,
    topTags: Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  };
};

const SharedList = mongoose.model('SharedList', sharedListSchema);

module.exports = SharedList;
