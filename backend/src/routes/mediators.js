/**
 * Mediator Routes
 * CRUD operations for mediator profiles
 * Now using FREE Hugging Face models!
 */

const express = require('express');
const router = express.Router();
const Mediator = require('../models/Mediator');
const ideologyClassifier = require('../services/huggingface/ideologyClassifier');

/**
 * GET /api/mediators
 * Get all mediators with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { 
      practiceArea, 
      location, 
      ideology, 
      minExperience,
      page = 1,
      limit = 20 
    } = req.query;
    
    const query = {};
    
    if (practiceArea) {
      query.practiceAreas = { $in: [practiceArea] };
    }
    
    if (location) {
      query['location.state'] = new RegExp(location, 'i');
    }
    
    if (ideology) {
      const ideologyMap = {
        'liberal': { $lte: -1 },
        'conservative': { $gte: 1 },
        'neutral': { $gt: -1, $lt: 1 }
      };
      query.ideologyScore = ideologyMap[ideology.toLowerCase()];
    }
    
    if (minExperience) {
      query.yearsExperience = { $gte: parseInt(minExperience) };
    }
    
    const mediators = await Mediator.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ rating: -1, yearsExperience: -1 });
    
    const total = await Mediator.countDocuments(query);
    
    res.json({
      success: true,
      data: mediators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get mediators error:', error);
    res.status(500).json({ error: 'Failed to fetch mediators' });
  }
});

/**
 * GET /api/mediators/:id
 * Get a single mediator by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const mediator = await Mediator.findById(req.params.id);
    
    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }
    
    res.json({
      success: true,
      data: mediator
    });
  } catch (error) {
    console.error('Get mediator error:', error);
    res.status(500).json({ error: 'Failed to fetch mediator' });
  }
});

/**
 * POST /api/mediators
 * Create a new mediator profile
 */
router.post('/', async (req, res) => {
  try {
    const mediator = new Mediator(req.body);
    mediator.calculateCompleteness();
    
    await mediator.save();
    
    res.status(201).json({
      success: true,
      data: mediator
    });
  } catch (error) {
    console.error('Create mediator error:', error);
    res.status(500).json({ error: 'Failed to create mediator' });
  }
});

/**
 * PUT /api/mediators/:id
 * Update a mediator profile
 */
router.put('/:id', async (req, res) => {
  try {
    const mediator = await Mediator.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }
    
    mediator.calculateCompleteness();
    await mediator.save();
    
    res.json({
      success: true,
      data: mediator
    });
  } catch (error) {
    console.error('Update mediator error:', error);
    res.status(500).json({ error: 'Failed to update mediator' });
  }
});

/**
 * POST /api/mediators/:id/analyze-ideology
 * Trigger ideology classification for a mediator
 */
router.post('/:id/analyze-ideology', async (req, res) => {
  try {
    const mediator = await Mediator.findById(req.params.id);
    
    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }
    
    const analysis = await ideologyClassifier.classifyIdeology(mediator);
    
    // Update mediator with analysis results
    mediator.ideologyScore = analysis.score;
    mediator.ideologyLabel = analysis.label;
    mediator.ideologyConfidence = analysis.confidence;
    mediator.ideologyAnalysis = {
      factors: analysis.factors,
      summary: analysis.summary,
      analyzedAt: new Date()
    };
    
    await mediator.save();
    
    res.json({
      success: true,
      data: {
        mediator,
        analysis
      }
    });
  } catch (error) {
    console.error('Ideology analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze ideology' });
  }
});

module.exports = router;
