/**
 * Analysis Routes
 * NEW FEATURE: Document analysis and bulk conflict checking endpoints
 * Handles file uploads for text/PDF/DOCX analysis and CSV/TXT bulk checks
 */

const express = require('express');
const router = express.Router();
const multer = require('multer'); // NOTE: Install with: npm install multer
const documentParser = require('../services/documentParser');
const bulkConflictChecker = require('../services/bulkConflictChecker');
const chatService = require('../services/huggingface/chatService');
const { sendSuccess, sendError, sendValidationError, asyncHandler } = require('../utils/responseHandlers');

/**
 * Configure multer for file uploads
 * Stores files in memory as buffers (no disk writes)
 * Max file size: 1MB
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 // 1MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload .txt, .pdf, .docx, or .csv files'));
    }
  }
});

/**
 * POST /api/analysis/document
 * Upload and analyze a legal document
 * Extracts: case type, jurisdiction, opposing parties, sentiment
 *
 * BODY: multipart/form-data with 'document' field
 * RESPONSE: {
 *   success: boolean,
 *   analysis: {
 *     caseType: string,
 *     jurisdiction: {city, state},
 *     opposingParties: string[],
 *     sentiment: {...},
 *     keywords: string[]
 *   }
 * }
 */
router.post('/document', upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendValidationError(res, 'No file uploaded. Please upload a document');
  }

  // Parse the uploaded file
  const analysis = await documentParser.parseFile(
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname
  );

  sendSuccess(res, { analysis });
}));

/**
 * POST /api/analysis/text
 * Analyze text content directly (no file upload)
 * Useful for analyzing chat messages or pasted text
 *
 * BODY: { text: string }
 * RESPONSE: Same as /document endpoint
 */
router.post('/text', asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return sendValidationError(res, 'Text content is required');
  }

  // Parse the text
  const analysis = await documentParser.parseText(text);

  sendSuccess(res, { analysis });
}));

/**
 * POST /api/analysis/bulk-conflict
 * Bulk conflict checker - upload CSV or TXT with party names
 * Checks all parties against mediator affiliations
 *
 * BODY: multipart/form-data with 'parties' field (CSV or TXT file)
 * RESPONSE: {
 *   success: boolean,
 *   results: {
 *     conflicts: Array<{party, mediator, matches, severity}>,
 *     totalParties: number,
 *     totalConflicts: number,
 *     summary: {...}
 *   }
 * }
 */
router.post('/bulk-conflict', upload.single('parties'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendValidationError(res, 'No file uploaded. Please upload a CSV or TXT file');
  }

  // Validate file
  bulkConflictChecker.validateFile(req.file.size, req.file.mimetype);

  // Parse file content
  const fileContent = req.file.buffer.toString('utf-8');
  let parties;

  if (req.file.mimetype.includes('csv')) {
    parties = bulkConflictChecker.parseCSV(fileContent);
  } else {
    parties = bulkConflictChecker.parseText(fileContent);
  }

  // Check conflicts
  const results = await bulkConflictChecker.checkConflicts(parties);

  sendSuccess(res, { results });
}));

/**
 * POST /api/analysis/chat-enhanced
 * NEW FEATURE: Enhanced chat with automatic case analysis
 * Integrates document parsing with chat for case-type-aware suggestions
 *
 * BODY: {
 *   message: string,
 *   history: Array<{role, content}>
 * }
 * RESPONSE: Enhanced chat response with case analysis and mediator suggestions
 */
router.post('/chat-enhanced', asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return sendValidationError(res, 'Message is required and must be a string');
  }

  // Use enhanced chat service with case analysis
  const result = await chatService.processQueryWithCaseAnalysis(message, history);

  sendSuccess(res, result);
}));

/**
 * Error handling middleware for file upload errors
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendValidationError(res, 'File too large. Maximum size is 1MB');
    }
    return sendValidationError(res, error.message);
  }

  if (error.message) {
    return sendValidationError(res, error.message);
  }

  next(error);
});

module.exports = router;
