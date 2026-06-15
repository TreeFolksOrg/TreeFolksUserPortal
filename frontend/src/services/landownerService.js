// src/services/landownerService.js
import { apiClient } from './apiClient';
import { normalizeProjectRecord } from './apiHelpers';

/**
 * Fetches the PRIMARY project associated with the logged-in landowner.
 * Used for single-project views.
 * 
 * @returns {Promise<object|null>} Normalized project record or null if not found
 */
export const getLandownerProject = async () => {
    try {
      const response = await apiClient.get('/projects/my-project');
      if (!response?.data) {
        return null;
      }
      return normalizeProjectRecord(response.data);
    } catch (error) {
      console.error(`API Call: getLandownerProject() -> Failed.`, error);
      if (error.response?.status === 404) {
          return null;
      }
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch landowner project.'
      );
    }
  };
  
  /**
   * Fetches ALL projects associated with the logged-in landowner's email.
   * Supports landowners with multiple projects.
   * @returns {Promise<Array>} Array of normalized project records
   */
  export const getLandownerProjects = async () => {
    try {
      const response = await apiClient.get('/projects/my-projects');
      if (!response?.data || !Array.isArray(response.data)) {
        return [];
      }
      return response.data.map(normalizeProjectRecord);
    } catch (error) {
      console.error(`API Call: getLandownerProjects() -> Failed.`, error);
      if (error.response?.status === 404) {
          return [];
      }
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch landowner projects.'
      );
    }
  };

/**
 * Syncs Firebase secondary emails to all user's Airtable projects.
 * Merges Firebase secondary emails with existing Airtable secondary emails.
 * 
 * @returns {Promise<object>} Sync result with updated project count
 */
export const syncSecondaryEmailsToProjects = async () => {
  try {
    const response = await apiClient.post('/sync-secondary-emails');
    return response.data;
  } catch (error) {
    console.error('API Call: syncSecondaryEmailsToProjects() -> Failed.', error);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to sync secondary emails to projects.'
    );
  }
};
