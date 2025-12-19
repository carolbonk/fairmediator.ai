import axios from 'axios';

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

export default api;
