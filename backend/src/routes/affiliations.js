/**
 * Affiliation Routes
 * Handles conflict of interest detection
 * Now using FREE Hugging Face models!
 */

const express = require('express');
const router = express.Router();
const affiliationDetector = require('../services/huggingface/affiliationDetector');
const Mediator = require('../models/Mediator');

/**
 * POST /api/affiliations/check
 * Check affiliations for one or more mediators
 */
router.post('/check', async (req, res) => {
  try {
    const { mediatorIds, parties } = req.body;
    
    if (!mediatorIds || !Array.isArray(mediatorIds) || mediatorIds.length === 0) {
      return res.status(400).json({ 
        error: 'mediatorIds array is required' 
      });
    }
    
    if (!parties || !Array.isArray(parties) || parties.length === 0) {
      return res.status(400).json({ 
        error: 'parties array is required' 
      });
    }
    
    // Fetch mediator profiles
    const mediators = await Mediator.find({ _id: { $in: mediatorIds } });
    
    if (mediators.length === 0) {
      return res.status(404).json({ error: 'No mediators found' });
    }
    
    // Perform affiliation detection
    const results = await affiliationDetector.batchDetect(mediators, parties);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Affiliation check error:', error);
    res.status(500).json({ 
      error: 'Failed to check affiliations',
      message: error.message 
    });
  }
});

/**
 * POST /api/affiliations/quick-check
 * Quick affiliation check for UI flags (red/yellow/green)
 */
router.post('/quick-check', async (req, res) => {
  try {
    const { mediatorIds, parties } = req.body;
    
    if (!mediatorIds || !Array.isArray(mediatorIds)) {
      return res.status(400).json({ error: 'mediatorIds array is required' });
    }
    
    if (!parties || !Array.isArray(parties)) {
      return res.status(400).json({ error: 'parties array is required' });
    }
    
    const mediators = await Mediator.find({ _id: { $in: mediatorIds } });
    
    const quickChecks = await Promise.all(
      mediators.map(mediator => 
        affiliationDetector.quickCheck(mediator, parties)
      )
    );
    
    res.json({
      success: true,
      data: quickChecks
    });
  } catch (error) {
    console.error('Quick check error:', error);
    res.status(500).json({ error: 'Failed to perform quick check' });
  }
});

/**
 * GET /api/affiliations/mediator/:id
 * Get stored affiliation data for a mediator
 */
router.get('/mediator/:id', async (req, res) => {
  try {
    const mediator = await Mediator.findById(req.params.id)
      .select('name knownAffiliations');
    
    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }
    
    res.json({
      success: true,
      data: {
        mediatorId: mediator._id,
        mediatorName: mediator.name,
        affiliations: mediator.knownAffiliations || []
      }
    });
  } catch (error) {
    console.error('Get affiliations error:', error);
    res.status(500).json({ error: 'Failed to fetch affiliations' });
  }
});

module.exports = router;
