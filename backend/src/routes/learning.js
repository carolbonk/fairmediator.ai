const express = require('express');
const router = express.Router();
const contextBuilder = require('../services/learning/contextBuilder');
const { sendSuccess, sendValidationError, sendError, asyncHandler } = require('../utils/responseHandlers');

router.post('/track-selection', asyncHandler(async (req, res) => {
  const { mediatorId, action } = req.body;

  if (!mediatorId || !action) {
    return sendValidationError(res, { field: 'mediatorId, action', message: 'required' });
  }

  const selection = await contextBuilder.trackSelection({
    userId: req.user?.id,
    ...req.body
  });

  sendSuccess(res, { selectionId: selection._id });
}));

router.post('/record-outcome', asyncHandler(async (req, res) => {
  const { mediatorId, caseType, outcome } = req.body;

  if (!mediatorId || !caseType || !outcome) {
    return sendValidationError(res, { field: 'mediatorId, caseType, outcome', message: 'required' });
  }

  const data = { ...req.body, userId: req.user?.id };
  if (data.hiredDate) data.hiredDate = new Date(data.hiredDate);
  if (data.completedDate) data.completedDate = new Date(data.completedDate);

  const result = await contextBuilder.recordOutcome(data);
  sendSuccess(res, { outcomeId: result._id });
}));

router.get('/mediator-history/:mediatorId', asyncHandler(async (req, res) => {
  const history = await contextBuilder.getMediatorHistory(req.params.mediatorId);

  sendSuccess(res, { history }, 200, history ? null : 'No data available');
}));

module.exports = router;
