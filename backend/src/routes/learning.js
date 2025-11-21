const express = require('express');
const router = express.Router();
const contextBuilder = require('../services/learning/contextBuilder');

router.post('/track-selection', async (req, res) => {
  try {
    const { mediatorId, action } = req.body;

    if (!mediatorId || !action) {
      return res.status(400).json({ error: 'mediatorId and action required' });
    }

    const selection = await contextBuilder.trackSelection({
      userId: req.user?.id,
      ...req.body
    });

    res.json({ success: true, selectionId: selection._id });
  } catch (err) {
    console.error('track-selection error:', err);
    res.status(500).json({ error: 'Failed to track selection' });
  }
});

router.post('/record-outcome', async (req, res) => {
  try {
    const { mediatorId, caseType, outcome } = req.body;

    if (!mediatorId || !caseType || !outcome) {
      return res.status(400).json({ error: 'mediatorId, caseType, and outcome required' });
    }

    const data = { ...req.body, userId: req.user?.id };
    if (data.hiredDate) data.hiredDate = new Date(data.hiredDate);
    if (data.completedDate) data.completedDate = new Date(data.completedDate);

    const result = await contextBuilder.recordOutcome(data);
    res.json({ success: true, outcomeId: result._id });
  } catch (err) {
    console.error('record-outcome error:', err);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

router.get('/mediator-history/:mediatorId', async (req, res) => {
  try {
    const history = await contextBuilder.getMediatorHistory(req.params.mediatorId);

    res.json({
      success: true,
      message: history ? null : 'No data available',
      history
    });
  } catch (err) {
    console.error('mediator-history error:', err);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

module.exports = router;
