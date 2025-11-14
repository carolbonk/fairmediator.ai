const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * JWT Service for token generation and verification
 * Handles access tokens and refresh tokens
 */

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '30d';

    if (!this.accessTokenSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  /**
   * Generate access token (short-lived)
   * @param {Object} payload - User data to encode in token
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    const tokenPayload = {
      userId: payload.userId || payload._id,
      email: payload.email,
      subscriptionTier: payload.subscriptionTier || 'free',
      type: 'access',
    };

    return jwt.sign(tokenPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'fairmediator',
      audience: 'fairmediator-api',
    });
  }

  /**
   * Generate refresh token (long-lived)
   * @param {Object} payload - User data to encode in token
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    const tokenPayload = {
      userId: payload.userId || payload._id,
      email: payload.email,
      type: 'refresh',
      // Add jti (JWT ID) for token revocation tracking
      jti: crypto.randomBytes(16).toString('hex'),
    };

    return jwt.sign(tokenPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'fairmediator',
      audience: 'fairmediator-api',
    });
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @returns {Object} { accessToken, refreshToken }
   */
  generateTokenPair(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'fairmediator',
        audience: 'fairmediator-api',
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'fairmediator',
        audience: 'fairmediator-api',
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for inspection)
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  decode(token) {
    return jwt.decode(token);
  }

  /**
   * Get token expiration date
   * @param {string} token - JWT token
   * @returns {Date} Expiration date
   */
  getExpiration(token) {
    const decoded = this.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isExpired(token) {
    const expiration = this.getExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration < new Date();
  }
}

// Export singleton instance
module.exports = new JWTService();
