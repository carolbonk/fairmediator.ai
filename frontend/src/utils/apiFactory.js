/**
 * API Factory Utilities
 * DRY utility to eliminate duplicate API endpoint patterns
 */

import api from '../services/api';

/**
 * Create a standardized API endpoint function
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} path - API endpoint path
 * @returns {Function} - API function that accepts params/data
 */
export const createApiEndpoint = (method, path) => {
  return async (data = null, config = {}) => {
    try {
      let response;

      if (method === 'get' || method === 'delete') {
        response = await api[method](path, { params: data, ...config });
      } else {
        response = await api[method](path, data, config);
      }

      return response.data;
    } catch (error) {
      console.error(`API Error [${method.toUpperCase()} ${path}]:`, error);
      throw error;
    }
  };
};

/**
 * Create a RESTful resource API
 * Generates standard CRUD operations for a resource
 * @param {string} resourcePath - Base path for the resource (e.g., '/mediators')
 * @returns {Object} - Object with getAll, getById, create, update, delete methods
 */
export const createResourceApi = (resourcePath) => {
  return {
    getAll: createApiEndpoint('get', resourcePath),
    getById: (id) => createApiEndpoint('get', `${resourcePath}/${id}`)(),
    create: createApiEndpoint('post', resourcePath),
    update: (id, data) => createApiEndpoint('put', `${resourcePath}/${id}`)(data),
    delete: (id) => createApiEndpoint('delete', `${resourcePath}/${id}`)()
  };
};

/**
 * Handle API errors consistently
 * @param {Error} error - Error object from API call
 * @param {string} defaultMessage - Default error message
 * @returns {string} - User-friendly error message
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.error || error.response.data?.message || defaultMessage;
  } else if (error.request) {
    // Request made but no response received
    return 'Unable to connect to server. Please check your connection.';
  } else {
    // Something else happened
    return error.message || defaultMessage;
  }
};

/**
 * Retry failed API requests
 * @param {Function} apiCall - API call function
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Promise that resolves with API response
 */
export const retryApiCall = async (apiCall, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};
