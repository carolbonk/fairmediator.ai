/**
 * Netlify Functions API Service
 *
 * This service calls Netlify Functions instead of your backend.
 * Use this when deploying to Netlify to keep API keys secure.
 *
 * Usage:
 * - In production (Netlify): Calls /.netlify/functions/*
 * - In development: Falls back to backend API
 */

import axios from 'axios';

const isNetlify = window.location.hostname.includes('netlify.app') ||
                  window.location.hostname === 'fairmediator.ai' ||
                  window.location.hostname === 'www.fairmediator.ai';

// Use Netlify Functions in production, backend API in development
const API_BASE = isNetlify ? '/.netlify/functions' : (import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send chat message using Netlify Function
 */
export const sendChatMessage = async (message, history = []) => {
  if (isNetlify) {
    // Call Netlify Function
    const response = await api.post('/chat', {
      message,
      history: history.map(msg => ({ role: msg.role, content: msg.content }))
    });
    return response.data;
  } else {
    // Fall back to backend API
    const { sendChatMessage: backendChat } = await import('./api.js');
    return backendChat(message, history);
  }
};

/**
 * Check affiliations using Netlify Function
 */
export const checkAffiliations = async (mediatorName, mediatorBio, parties) => {
  if (isNetlify) {
    // Call Netlify Function
    const response = await api.post('/check-affiliations', {
      mediatorName,
      mediatorBio,
      parties
    });
    return response.data;
  } else {
    // Fall back to backend API
    const { checkAffiliations: backendCheck } = await import('./api.js');
    return backendCheck(mediatorName, mediatorBio, parties);
  }
};

/**
 * Helper to determine if using Netlify Functions
 */
export const isUsingNetlifyFunctions = () => isNetlify;

export default api;
