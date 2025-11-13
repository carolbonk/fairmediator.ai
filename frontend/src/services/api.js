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

export default api;
