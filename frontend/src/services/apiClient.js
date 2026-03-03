// src/services/apiClient.js
import axios from 'axios';
import { auth } from '../firebase';

// --- Configuration ---
// For combined Heroku deployment, use relative URL (empty string)
// For separate deployments, use full URL from environment variable
const getApiBase = () => {
  // If VITE_API_BASE_URL is explicitly set, use it
  if (import.meta?.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  // In production without explicit URL, assume combined deployment (relative URL)
  if (import.meta.env.MODE === 'production') {
    return '';
  }
  // Local development default
  return 'http://localhost:3000';
};

const apiBaseFromEnv = getApiBase();
const apiPrefix = import.meta?.env?.VITE_API_PREFIX ?? '/api';

console.log('API Configuration:', {
  envValue: import.meta?.env?.VITE_API_BASE_URL,
  finalBase: apiBaseFromEnv || '(relative - same origin)',
  fullURL: `${apiBaseFromEnv}${apiPrefix}`
});

/**
 * Axios instance configured for API requests.
 * 
 * - Base URL: Configured via environment variables
 * - Timeout: 45s
 * - Interceptors: Automatically attaches Firebase auth token if user is signed in
 */
export const apiClient = axios.create({
  baseURL: `${apiBaseFromEnv}${apiPrefix}`,
  timeout: 45000,
});

apiClient.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error("Unable to attach auth token:", error);
    }
  }
  return config;
});

export default apiClient;
