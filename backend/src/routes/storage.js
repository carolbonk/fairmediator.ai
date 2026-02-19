/**
 * Storage Routes
 * File upload/download using Netlify Blobs
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const netlifyBlobs = require('../services/storage/netlifyBlobs');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/responseHandlers');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX'));
    }
  }
});

/**
 * POST /api/storage/mediator/:mediatorId/image
 * Upload mediator profile image
 * Admin or mediator owner only
 */
router.post(
  '/mediator/:mediatorId/image',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    try {
      const { mediatorId } = req.params;

      if (!req.file) {
        return sendError(res, 'No image file provided', 400);
      }

      // Authorization check: User must be admin OR own this mediator profile
      const isAdmin = req.user && req.user.role === 'admin';
      const isMediatorOwner = req.user && req.user.mediatorId && req.user.mediatorId.toString() === mediatorId;

      if (!isAdmin && !isMediatorOwner) {
        return sendError(res, 'Unauthorized: You can only upload images for your own mediator profile', 403);
      }

      const url = await netlifyBlobs.uploadMediatorImage(
        mediatorId,
        req.file.buffer,
        req.file.mimetype
      );

      if (!url) {
        return sendError(res, 'Failed to upload image. Netlify Blobs may not be configured.', 500);
      }

      sendSuccess(res, {
        url,
        mediatorId,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size
      });
    } catch (error) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * POST /api/storage/mediator/:mediatorId/document
 * Upload mediator document (CV, certification, etc.)
 * Admin or mediator owner only
 */
router.post(
  '/mediator/:mediatorId/document',
  authenticate,
  upload.single('document'),
  async (req, res) => {
    try {
      const { mediatorId } = req.params;
      const { documentType } = req.body; // cv, certification, etc.

      if (!req.file) {
        return sendError(res, 'No document file provided', 400);
      }

      if (!documentType) {
        return sendError(res, 'Document type required (cv, certification, etc.)', 400);
      }

      // Authorization check: User must be admin OR own this mediator profile
      const isAdmin = req.user && req.user.role === 'admin';
      const isMediatorOwner = req.user && req.user.mediatorId && req.user.mediatorId.toString() === mediatorId;

      if (!isAdmin && !isMediatorOwner) {
        return sendError(res, 'Unauthorized: You can only upload documents for your own mediator profile', 403);
      }

      const document = await netlifyBlobs.uploadMediatorDocument(
        mediatorId,
        documentType,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      if (!document) {
        return sendError(res, 'Failed to upload document. Netlify Blobs may not be configured.', 500);
      }

      sendSuccess(res, document);
    } catch (error) {
      sendError(res, error.message, 500);
    }
  }
);

/**
 * GET /api/storage/mediator/:mediatorId/documents
 * List all documents for a mediator
 * Requires authentication — documents may contain PII/confidential files
 */
router.get('/mediator/:mediatorId/documents', authenticate, async (req, res) => {
  try {
    const { mediatorId } = req.params;
    const { type } = req.query;

    const documents = await netlifyBlobs.listMediatorDocuments(mediatorId, type);

    sendSuccess(res, {
      mediatorId,
      documents,
      total: documents.length
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

/**
 * DELETE /api/storage/mediator/:mediatorId/image
 * Delete mediator profile image
 * Admin or mediator owner only
 */
router.delete('/mediator/:mediatorId/image', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { mediatorId } = req.params;

    const success = await netlifyBlobs.deleteMediatorImage(mediatorId);

    if (!success) {
      return sendError(res, 'Failed to delete image', 500);
    }

    sendSuccess(res, {
      message: 'Image deleted successfully',
      mediatorId
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

/**
 * DELETE /api/storage/document/:key
 * Delete a specific document
 * Admin only
 */
router.delete('/document/:key(*)', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;

    const success = await netlifyBlobs.deleteDocument(key);

    if (!success) {
      return sendError(res, 'Failed to delete document', 500);
    }

    sendSuccess(res, {
      message: 'Document deleted successfully',
      key
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

/**
 * GET /api/storage/stats
 * Get storage statistics
 * Admin only
 */
router.get('/stats', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await netlifyBlobs.getStats();
    sendSuccess(res, stats);
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

module.exports = router;
