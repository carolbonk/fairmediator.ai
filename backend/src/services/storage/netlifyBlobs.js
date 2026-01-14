/**
 * Netlify Blobs Storage Service
 * Free tier: 100GB bandwidth/month, unlimited storage
 *
 * Use cases:
 * - Mediator profile images
 * - Uploaded documents (CVs, certifications)
 * - Case documents
 * - Static assets
 */

const { getStore } = require('@netlify/blobs');
const logger = require('../../config/logger');

class NetlifyBlobsService {
  constructor() {
    this.stores = {};
    this.enabled = process.env.NETLIFY_BLOBS_ENABLED === 'true';

    if (!this.enabled) {
      logger.info('Netlify Blobs disabled. Set NETLIFY_BLOBS_ENABLED=true to enable.');
    }
  }

  /**
   * Get or create a store for a specific type
   */
  getStoreInstance(storeName) {
    if (!this.enabled) {
      logger.warn('Netlify Blobs not enabled');
      return null;
    }

    if (!this.stores[storeName]) {
      try {
        this.stores[storeName] = getStore({
          name: storeName,
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_TOKEN
        });
        logger.debug(`Created Netlify Blobs store: ${storeName}`);
      } catch (error) {
        logger.error(`Failed to create Netlify Blobs store ${storeName}:`, error);
        return null;
      }
    }

    return this.stores[storeName];
  }

  /**
   * Upload mediator profile image
   * @param {string} mediatorId - Mediator ID
   * @param {Buffer} imageBuffer - Image data
   * @param {string} contentType - MIME type (e.g., 'image/jpeg')
   * @returns {Promise<string>} - URL to access the image
   */
  async uploadMediatorImage(mediatorId, imageBuffer, contentType = 'image/jpeg') {
    const store = this.getStoreInstance('mediator-images');
    if (!store) return null;

    try {
      const key = `${mediatorId}/profile.${this.getExtension(contentType)}`;

      await store.set(key, imageBuffer, {
        metadata: {
          mediatorId,
          contentType,
          uploadedAt: new Date().toISOString()
        }
      });

      // Generate public URL
      const url = `https://${process.env.NETLIFY_SITE_ID}.netlify.app/.netlify/blobs/${key}`;

      logger.info(`Uploaded mediator image: ${key}`);
      return url;
    } catch (error) {
      logger.error('Failed to upload mediator image:', error);
      throw error;
    }
  }

  /**
   * Upload mediator document (CV, certification, etc.)
   * @param {string} mediatorId - Mediator ID
   * @param {string} documentType - Type of document (cv, certification, etc.)
   * @param {Buffer} documentBuffer - Document data
   * @param {string} contentType - MIME type (e.g., 'application/pdf')
   * @param {string} filename - Original filename
   * @returns {Promise<object>} - Document metadata with URL
   */
  async uploadMediatorDocument(mediatorId, documentType, documentBuffer, contentType, filename) {
    const store = this.getStoreInstance('mediator-documents');
    if (!store) return null;

    try {
      const timestamp = Date.now();
      const extension = this.getExtension(contentType) || this.getFileExtension(filename);
      const key = `${mediatorId}/${documentType}/${timestamp}.${extension}`;

      await store.set(key, documentBuffer, {
        metadata: {
          mediatorId,
          documentType,
          contentType,
          originalFilename: filename,
          uploadedAt: new Date().toISOString()
        }
      });

      const url = `https://${process.env.NETLIFY_SITE_ID}.netlify.app/.netlify/blobs/${key}`;

      logger.info(`Uploaded mediator document: ${key}`);

      return {
        url,
        key,
        filename,
        contentType,
        uploadedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to upload mediator document:', error);
      throw error;
    }
  }

  /**
   * Get mediator profile image
   * @param {string} mediatorId - Mediator ID
   * @returns {Promise<Buffer|null>} - Image data
   */
  async getMediatorImage(mediatorId) {
    const store = this.getStoreInstance('mediator-images');
    if (!store) return null;

    try {
      // Try common extensions
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];

      for (const ext of extensions) {
        const key = `${mediatorId}/profile.${ext}`;
        const data = await store.get(key);

        if (data) {
          logger.debug(`Retrieved mediator image: ${key}`);
          return data;
        }
      }

      logger.debug(`No image found for mediator: ${mediatorId}`);
      return null;
    } catch (error) {
      logger.error('Failed to get mediator image:', error);
      return null;
    }
  }

  /**
   * List all documents for a mediator
   * @param {string} mediatorId - Mediator ID
   * @param {string} documentType - Optional type filter
   * @returns {Promise<Array>} - List of document metadata
   */
  async listMediatorDocuments(mediatorId, documentType = null) {
    const store = this.getStoreInstance('mediator-documents');
    if (!store) return [];

    try {
      const prefix = documentType ? `${mediatorId}/${documentType}/` : `${mediatorId}/`;
      const { blobs } = await store.list({ prefix });

      return blobs.map(blob => ({
        key: blob.key,
        url: `https://${process.env.NETLIFY_SITE_ID}.netlify.app/.netlify/blobs/${blob.key}`,
        metadata: blob.metadata,
        size: blob.size
      }));
    } catch (error) {
      logger.error('Failed to list mediator documents:', error);
      return [];
    }
  }

  /**
   * Delete mediator image
   * @param {string} mediatorId - Mediator ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteMediatorImage(mediatorId) {
    const store = this.getStoreInstance('mediator-images');
    if (!store) return false;

    try {
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];

      for (const ext of extensions) {
        const key = `${mediatorId}/profile.${ext}`;
        await store.delete(key);
      }

      logger.info(`Deleted mediator image: ${mediatorId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete mediator image:', error);
      return false;
    }
  }

  /**
   * Delete mediator document
   * @param {string} key - Document key
   * @returns {Promise<boolean>} - Success status
   */
  async deleteDocument(key) {
    const store = this.getStoreInstance('mediator-documents');
    if (!store) return false;

    try {
      await store.delete(key);
      logger.info(`Deleted document: ${key}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete document:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<object>} - Storage stats
   */
  async getStats() {
    if (!this.enabled) {
      return {
        enabled: false,
        message: 'Netlify Blobs not enabled'
      };
    }

    try {
      const stats = {
        enabled: true,
        stores: {}
      };

      // Get stats for each store
      for (const storeName of ['mediator-images', 'mediator-documents']) {
        const store = this.getStoreInstance(storeName);
        if (store) {
          const { blobs } = await store.list();
          const totalSize = blobs.reduce((sum, blob) => sum + (blob.size || 0), 0);

          stats.stores[storeName] = {
            count: blobs.length,
            totalSize: this.formatBytes(totalSize),
            totalSizeBytes: totalSize
          };
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      return {
        enabled: true,
        error: error.message
      };
    }
  }

  /**
   * Helper: Get file extension from content type
   */
  getExtension(contentType) {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };

    return extensions[contentType] || 'bin';
  }

  /**
   * Helper: Get file extension from filename
   */
  getFileExtension(filename) {
    if (!filename) return 'bin';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'bin';
  }

  /**
   * Helper: Format bytes to human-readable
   */
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const netlifyBlobs = new NetlifyBlobsService();

module.exports = netlifyBlobs;
