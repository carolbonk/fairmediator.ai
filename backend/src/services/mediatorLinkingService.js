/**
 * Mediator Linking Service
 * Links User accounts to Mediator profiles
 */

const User = require('../models/User');
const Mediator = require('../models/Mediator');
const logger = require('../config/logger');

/**
 * Link a user to a mediator profile by email match
 * @param {string} userId - User ObjectId
 * @returns {Object} { success: boolean, mediator?: Mediator, message?: string }
 */
async function linkUserToMediatorProfile(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.accountType !== 'mediator') {
      return { success: false, message: 'User is not a mediator account' };
    }

    // Check if already linked
    const existingMediator = await Mediator.findOne({ userId });
    if (existingMediator) {
      return {
        success: true,
        mediator: existingMediator,
        message: 'Already linked to mediator profile'
      };
    }

    // Find mediator by email match
    const mediator = await Mediator.findOne({
      email: user.email.toLowerCase(),
      userId: { $exists: false } // Only match unlinked mediators
    });

    if (!mediator) {
      return {
        success: false,
        message: 'No mediator profile found with matching email. You may need to create a profile first.'
      };
    }

    // Link the mediator profile to the user
    mediator.userId = userId;
    await mediator.save();

    logger.info('Mediator profile linked to user', {
      userId,
      mediatorId: mediator._id,
      email: user.email
    });

    return {
      success: true,
      mediator,
      message: 'Successfully linked to mediator profile'
    };
  } catch (error) {
    logger.error('Error linking user to mediator profile', {
      userId,
      error: error.message
    });
    return {
      success: false,
      message: 'An error occurred while linking profile'
    };
  }
}

/**
 * Create a new mediator profile for a user
 * @param {string} userId - User ObjectId
 * @param {Object} profileData - Mediator profile data
 * @returns {Object} { success: boolean, mediator?: Mediator, message?: string }
 */
async function createMediatorProfile(userId, profileData) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.accountType !== 'mediator') {
      return { success: false, message: 'User is not a mediator account' };
    }

    // Check if already has a profile
    const existingMediator = await Mediator.findOne({ userId });
    if (existingMediator) {
      return {
        success: false,
        message: 'User already has a mediator profile'
      };
    }

    // Create new mediator profile
    const mediator = await Mediator.create({
      userId,
      name: profileData.name || user.name,
      email: profileData.email || user.email,
      ...profileData
    });

    logger.info('Mediator profile created', {
      userId,
      mediatorId: mediator._id
    });

    return {
      success: true,
      mediator,
      message: 'Mediator profile created successfully'
    };
  } catch (error) {
    logger.error('Error creating mediator profile', {
      userId,
      error: error.message
    });
    return {
      success: false,
      message: 'An error occurred while creating profile'
    };
  }
}

/**
 * Get mediator profile for a user
 * @param {string} userId - User ObjectId
 * @returns {Mediator|null}
 */
async function getMediatorProfileByUserId(userId) {
  try {
    return await Mediator.findOne({ userId });
  } catch (error) {
    logger.error('Error fetching mediator profile', {
      userId,
      error: error.message
    });
    return null;
  }
}

/**
 * Unlink a user from their mediator profile
 * @param {string} userId - User ObjectId
 * @returns {Object} { success: boolean, message?: string }
 */
async function unlinkMediatorProfile(userId) {
  try {
    const mediator = await Mediator.findOne({ userId });
    if (!mediator) {
      return { success: false, message: 'No linked mediator profile found' };
    }

    mediator.userId = undefined;
    await mediator.save();

    logger.info('Mediator profile unlinked from user', {
      userId,
      mediatorId: mediator._id
    });

    return {
      success: true,
      message: 'Mediator profile unlinked successfully'
    };
  } catch (error) {
    logger.error('Error unlinking mediator profile', {
      userId,
      error: error.message
    });
    return {
      success: false,
      message: 'An error occurred while unlinking profile'
    };
  }
}

module.exports = {
  linkUserToMediatorProfile,
  createMediatorProfile,
  getMediatorProfileByUserId,
  unlinkMediatorProfile
};
