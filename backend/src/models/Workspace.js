/**
 * Workspace Model - Team collaboration spaces
 *
 * Allows organizations to create shared workspaces where team members
 * can collaborate on mediator lists, notes, and conflict checks.
 *
 * @module models/Workspace
 */

const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  // Workspace name
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Owner (creator) of workspace
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Team members with roles
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'editor'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Workspace settings
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApprovalForLists: {
      type: Boolean,
      default: false
    },
    defaultNoteVisibility: {
      type: String,
      enum: ['private', 'team'],
      default: 'team'
    }
  },

  // Subscription tier (for billing)
  tier: {
    type: String,
    enum: ['free', 'team', 'enterprise'],
    default: 'free'
  },

  // Billing information
  billing: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      default: 'trialing'
    }
  },

  // Workspace status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
workspaceSchema.index({ 'members.userId': 1 });
workspaceSchema.index({ ownerId: 1, createdAt: -1 });

/**
 * Add member to workspace
 *
 * @param {String} userId - User ID to add
 * @param {String} role - Role (owner, admin, editor, viewer)
 * @param {String} addedBy - User ID who added this member
 * @returns {Object} Updated workspace
 */
workspaceSchema.methods.addMember = async function(userId, role = 'editor', addedBy = null) {
  // Check if already a member
  const existing = this.members.find(m => m.userId.toString() === userId.toString());
  if (existing) {
    throw new Error('User is already a member of this workspace');
  }

  this.members.push({
    userId,
    role,
    addedBy: addedBy || this.ownerId
  });

  return this.save();
};

/**
 * Remove member from workspace
 *
 * @param {String} userId - User ID to remove
 * @returns {Object} Updated workspace
 */
workspaceSchema.methods.removeMember = async function(userId) {
  // Cannot remove owner
  if (userId.toString() === this.ownerId.toString()) {
    throw new Error('Cannot remove workspace owner');
  }

  this.members = this.members.filter(m => m.userId.toString() !== userId.toString());
  return this.save();
};

/**
 * Update member role
 *
 * @param {String} userId - User ID
 * @param {String} newRole - New role
 * @returns {Object} Updated workspace
 */
workspaceSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => m.userId.toString() === userId.toString());

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  // Cannot change owner role
  if (member.role === 'owner') {
    throw new Error('Cannot change owner role');
  }

  member.role = newRole;
  return this.save();
};

/**
 * Check if user is member of workspace
 *
 * @param {String} userId - User ID
 * @returns {Boolean} True if member
 */
workspaceSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.userId.toString() === userId.toString()) ||
         this.ownerId.toString() === userId.toString();
};

/**
 * Get member role
 *
 * @param {String} userId - User ID
 * @returns {String} Role or null
 */
workspaceSchema.methods.getMemberRole = function(userId) {
  if (this.ownerId.toString() === userId.toString()) {
    return 'owner';
  }

  const member = this.members.find(m => m.userId.toString() === userId.toString());
  return member ? member.role : null;
};

/**
 * Check if user has permission
 *
 * @param {String} userId - User ID
 * @param {String} permission - Permission to check (read, write, admin)
 * @returns {Boolean} True if has permission
 */
workspaceSchema.methods.hasPermission = function(userId, permission) {
  const role = this.getMemberRole(userId);
  if (!role) return false;

  const permissions = {
    owner: ['read', 'write', 'admin', 'billing'],
    admin: ['read', 'write', 'admin'],
    editor: ['read', 'write'],
    viewer: ['read']
  };

  return permissions[role]?.includes(permission) || false;
};

/**
 * Find workspaces by member
 *
 * @param {String} userId - User ID
 * @returns {Array} Workspaces
 */
workspaceSchema.statics.findByMember = async function(userId) {
  return this.find({
    $or: [
      { ownerId: userId },
      { 'members.userId': userId }
    ],
    isActive: true
  })
    .populate('ownerId', 'name email')
    .populate('members.userId', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
};

/**
 * Get workspace statistics
 *
 * @returns {Object} Statistics
 */
workspaceSchema.methods.getStats = async function() {
  const SharedList = mongoose.model('SharedList');
  const Note = mongoose.model('Note');

  const [lists, notes] = await Promise.all([
    SharedList.countDocuments({ workspaceId: this._id }),
    Note.countDocuments({ workspaceId: this._id, visibility: 'team' })
  ]);

  return {
    memberCount: this.members.length + 1, // +1 for owner
    listCount: lists,
    noteCount: notes,
    createdAt: this.createdAt,
    tier: this.tier
  };
};

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;
