/**
 * Intelligent Document Processing Routes
 * Extract structured data from PDFs and documents
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const idpService = require('../services/ai/idpService');
const logger = require('../config/logger');
const Mediator = require('../models/Mediator');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

/**
 * POST /api/idp/process-pdf
 * Process a PDF and extract mediator information
 *
 * Form data:
 * - file: PDF file
 */
router.post('/process-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    logger.info(`Processing PDF: ${req.file.originalname}`);

    const result = await idpService.processPDF(req.file.buffer);

    return res.json(result);
  } catch (error) {
    logger.error('PDF processing failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/idp/process-text
 * Process plain text and extract mediator information
 *
 * Body:
 * {
 *   "text": "mediator bio or profile text..."
 * }
 */
router.post('/process-text', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text'
      });
    }

    logger.info('Processing text document');

    const result = await idpService.processDocument(text);

    return res.json(result);
  } catch (error) {
    logger.error('Text processing failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/idp/process-and-save
 * Process PDF/text and automatically create mediator profile
 *
 * Form data:
 * - file: PDF file (optional if text provided)
 * - text: Plain text (optional if file provided)
 * - autoSave: boolean (default: true)
 */
router.post('/process-and-save', upload.single('file'), async (req, res) => {
  try {
    let result;

    // Process file or text
    if (req.file) {
      logger.info(`Processing and saving PDF: ${req.file.originalname}`);
      result = await idpService.processPDF(req.file.buffer);
    } else if (req.body.text) {
      logger.info('Processing and saving text document');
      result = await idpService.processDocument(req.body.text);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either file or text must be provided'
      });
    }

    // Check if extraction was successful
    if (!result.success || !result.data.name) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract mediator data. Confidence too low or missing required fields.',
        result
      });
    }

    // Auto-save if enabled (default: true)
    const autoSave = req.body.autoSave !== 'false';
    let savedMediator = null;

    if (autoSave) {
      // Check if mediator already exists
      const existing = await Mediator.findOne({ name: result.data.name });

      if (existing) {
        // Update existing mediator
        Object.assign(existing, {
          barNumber: result.data.barNumber || existing.barNumber,
          location: result.data.location || existing.location,
          specializations: [...new Set([...(existing.specializations || []), ...(result.data.specializations || [])])],
          yearsExperience: result.data.yearsExperience || existing.yearsExperience,
          education: result.data.education || existing.education,
          email: result.data.contact?.email || existing.email,
          phone: result.data.contact?.phone || existing.phone,
          practiceAreas: [...new Set([...(existing.practiceAreas || []), ...(result.data.practiceAreas || [])])]
        });

        savedMediator = await existing.save();
        logger.info(`Updated existing mediator: ${result.data.name}`);
      } else {
        // Create new mediator
        savedMediator = await Mediator.create({
          name: result.data.name,
          barNumber: result.data.barNumber,
          location: result.data.location?.city ? `${result.data.location.city}, ${result.data.location.state}` : null,
          state: result.data.location?.state,
          specializations: result.data.specializations || [],
          yearsExperience: result.data.yearsExperience,
          education: result.data.education || [],
          email: result.data.contact?.email,
          phone: result.data.contact?.phone,
          practiceAreas: result.data.practiceAreas || [],
          ideology: 0, // Neutral by default
          ideologyScore: 0,
          dataSource: 'IDP - Automated extraction',
          lastUpdated: new Date()
        });

        logger.info(`Created new mediator: ${result.data.name}`);
      }
    }

    return res.json({
      success: true,
      extracted: result,
      saved: autoSave,
      mediator: savedMediator ? {
        id: savedMediator._id,
        name: savedMediator.name,
        barNumber: savedMediator.barNumber
      } : null,
      message: autoSave
        ? (savedMediator.id ? 'Mediator profile created successfully' : 'Mediator profile updated successfully')
        : 'Data extracted successfully (not saved)'
    });
  } catch (error) {
    logger.error('Process and save failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/idp/batch-process
 * Process multiple PDFs in batch
 *
 * Form data:
 * - files[]: Multiple PDF files
 */
router.post('/batch-process', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    logger.info(`Batch processing ${req.files.length} files`);

    const results = await Promise.all(
      req.files.map(async (file) => {
        try {
          const result = await idpService.processPDF(file.buffer);
          return {
            filename: file.originalname,
            ...result
          };
        } catch (error) {
          return {
            filename: file.originalname,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      processed: req.files.length,
      successful,
      failed,
      results
    });
  } catch (error) {
    logger.error('Batch processing failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
