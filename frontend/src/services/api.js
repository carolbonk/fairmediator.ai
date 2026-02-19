import axios from 'axios';

// In production (Netlify), use /api which redirects to /.netlify/functions/api
// In development, use VITE_API_URL (localhost:5001/api)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const sendChatMessage = async (message, history = []) => {
  const response = await api.post('/chat', {
    message,
    history: history.map(msg => ({ role: msg.role, content: msg.content }))
  });
  return response.data;
};

// Mediators API
export const getMediators = async (filters = {}) => {
  const response = await api.get('/mediators', { params: filters });
  return response.data;
};

export const getMediatorById = async (id) => {
  const response = await api.get(`/mediators/${id}`);
  return response.data;
};

/**
 * Hybrid Search API - Combines vector (semantic) + keyword (BM25) search
 * @param {string} query - Search query
 * @param {object} options - Search options { topK, filters, ideologyPreference }
 * @returns {Promise} Search results with hybrid scores
 */
export const hybridSearch = async (query, options = {}) => {
  const response = await api.post('/mediators/search/hybrid', {
    query,
    ...options
  });
  return response.data;
};

export const analyzeMediatorIdeology = async (id) => {
  const response = await api.post(`/mediators/${id}/analyze-ideology`);
  return response.data;
};

// Affiliations API
export const checkAffiliations = async (mediatorIds, parties) => {
  const response = await api.post('/affiliations/check', {
    mediatorIds,
    parties
  });
  return response.data;
};

export const checkAffiliationsQuick = async (mediatorIds, parties) => {
  const response = await api.post('/affiliations/quick-check', {
    mediatorIds,
    parties
  });
  return response.data;
};

export const getMediatorAffiliations = async (id) => {
  const response = await api.get(`/affiliations/mediator/${id}`);
  return response.data;
};

export const checkEnhancedAffiliations = async (mediatorId, parties, caseDescription) => {
  const response = await api.post('/affiliations/enhanced-check', {
    mediatorId,
    parties,
    caseDescription
  });
  return response.data;
};

// Subscription API
export const getSubscription = async () => {
  const response = await api.get('/subscription');
  return response.data;
};

export const createCheckoutSession = async (priceId) => {
  const response = await api.post('/subscription/checkout', {
    priceId,
    successUrl: window.location.origin + '/dashboard?upgrade=success',
    cancelUrl: window.location.origin + '/upgrade'
  });
  return response.data;
};

export const getBillingPortal = async () => {
  const response = await api.post('/subscription/portal', {
    returnUrl: window.location.origin + '/dashboard'
  });
  return response.data;
};

export const cancelSubscription = async () => {
  const response = await api.post('/subscription/cancel');
  return response.data;
};

// Dashboard & Analytics API
export const getUserStats = async (days = 30) => {
  const response = await api.get(`/dashboard/stats?days=${days}`);
  return response.data;
};

export const getSearchTrends = async (days = 30) => {
  const response = await api.get(`/dashboard/trends?days=${days}`);
  return response.data;
};

export const getPopularMediators = async (days = 30, limit = 10) => {
  const response = await api.get(`/dashboard/popular-mediators?days=${days}&limit=${limit}`);
  return response.data;
};

export const getPlatformStats = async (days = 30) => {
  const response = await api.get(`/dashboard/platform?days=${days}`);
  return response.data;
};

export const getConversionFunnel = async (days = 30) => {
  const response = await api.get(`/dashboard/conversion-funnel?days=${days}`);
  return response.data;
};

// Multi-Perspective AI Chat
export const getMultiPerspectiveChat = async (message, history = []) => {
  const response = await api.post('/chat/multi-perspective', {
    message,
    history: history.map(msg => ({ role: msg.role, content: msg.content }))
  });
  return response.data;
};

// Recommendation Scoring
export const scoreMediator = async (mediatorId, caseContext) => {
  const response = await api.post(`/mediators/${mediatorId}/score`, {
    caseContext
  });
  return response.data;
};

export const getRecommendations = async (caseContext, limit = 10) => {
  const response = await api.post('/mediators/recommendations', {
    caseContext,
    limit
  });
  return response.data;
};

// Learning & Tracking API - Smart AI improvement
export const trackMediatorSelection = async (selectionData) => {
  const response = await api.post('/learning/track-selection', selectionData);
  return response.data;
};

export const recordCaseOutcome = async (outcomeData) => {
  const response = await api.post('/learning/record-outcome', outcomeData);
  return response.data;
};

export const getMediatorHistory = async (mediatorId) => {
  const response = await api.get(`/learning/mediator-history/${mediatorId}`);
  return response.data;
};

// State Mediation API
export const getStateMediationData = async (stateCode) => {
  const response = await api.get(`/state-mediation/${stateCode}`);
  return response.data;
};

export const getSupportedStates = async () => {
  const response = await api.get('/state-mediation');
  return response.data;
};

// Monitoring API (Free Tier Tracking)
export const getMonitoringStats = async () => {
  const response = await api.get('/monitoring/stats');
  return response.data;
};

export const getDatabaseSize = async () => {
  const response = await api.get('/monitoring/database-size');
  return response.data;
};

export const getUsageMetrics = async (service) => {
  const response = await api.get(`/monitoring/usage/${service}`);
  return response.data;
};

export const getRecentErrors = async (limit = 10) => {
  const response = await api.get(`/monitoring/errors?limit=${limit}`);
  return response.data;
};

// Storage API (Netlify Blobs)
export const uploadMediatorImage = async (mediatorId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post(`/storage/mediator-image/${mediatorId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getMediatorImage = async (mediatorId) => {
  const response = await api.get(`/storage/mediator-image/${mediatorId}`);
  return response.data;
};

export const deleteMediatorImage = async (mediatorId) => {
  const response = await api.delete(`/storage/mediator-image/${mediatorId}`);
  return response.data;
};

export const uploadMediatorDocument = async (mediatorId, documentType, documentFile) => {
  const formData = new FormData();
  formData.append('document', documentFile);
  formData.append('documentType', documentType);

  const response = await api.post(`/storage/mediator-document/${mediatorId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const listMediatorDocuments = async (mediatorId, documentType = null) => {
  const params = documentType ? { documentType } : {};
  const response = await api.get(`/storage/mediator-documents/${mediatorId}`, { params });
  return response.data;
};

export const deleteDocument = async (documentKey) => {
  const response = await api.delete(`/storage/document/${encodeURIComponent(documentKey)}`);
  return response.data;
};

export const getStorageStats = async () => {
  const response = await api.get('/storage/stats');
  return response.data;
};

// Conflict Detection API (Graph-based)
/**
 * Check for conflicts between a mediator and parties
 * @param {string} mediatorId - Mediator's ID
 * @param {Array<string>} parties - Array of party names
 * @returns {Promise} Conflict analysis with paths and risk score
 */
export const checkConflicts = async (mediatorId, parties) => {
  const response = await api.post('/graph/check-conflicts', {
    mediatorId,
    parties
  });
  return response.data;
};

/**
 * Batch check conflicts for multiple mediators
 * @param {Array<string>} mediatorIds - Array of mediator IDs
 * @param {Array<string>} parties - Array of party names
 * @returns {Promise} Map of mediatorId -> conflict results
 */
export const batchCheckConflicts = async (mediatorIds, parties) => {
  const response = await api.post('/graph/batch-check-conflicts', {
    mediatorIds,
    parties
  });
  return response.data;
};

/**
 * Get detailed relationship paths between entities
 * @param {string} entity1 - First entity name
 * @param {string} entity2 - Second entity name
 * @returns {Promise} Detailed relationship paths
 */
export const getRelationshipPaths = async (entity1, entity2) => {
  const response = await api.get('/graph/relationships', {
    params: { entity1, entity2 }
  });
  return response.data;
};

// Settlement Prediction API
/**
 * Predict settlement amount and likelihood for a case
 * @param {object} caseData - Case details (type, disputeValue, etc.)
 * @returns {Promise} Prediction with confidence intervals
 */
export const predictSettlement = async (caseData) => {
  const response = await api.post('/settlement/predict', caseData);
  return response.data;
};

// ── ConflictAlerts ────────────────────────────────────────────────────────────

export const getAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data;
};

export const getUnreadAlertCount = async () => {
  const response = await api.get('/alerts/unread-count');
  return response.data;
};

export const markAlertRead = async (alertId) => {
  const response = await api.patch(`/alerts/${alertId}/read`);
  return response.data;
};

export const markAllAlertsRead = async () => {
  const response = await api.patch('/alerts/read-all');
  return response.data;
};

/**
 * Download a PDF conflict/bias report for a mediator.
 * Returns a Blob so the caller can trigger a browser download.
 */
export const downloadConflictReport = async (mediatorId) => {
  const response = await api.get(`/graph/conflict-report/${mediatorId}`, {
    responseType: 'blob',
  });
  return response.data; // Blob
};

export default api;
