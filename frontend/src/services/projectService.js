// src/services/projectService.js
import { apiClient } from './apiClient';
import { 
    normalizeSeasonKey, 
    normalizeProjectRecord, 
    seasonProjectsCache, 
    fullyLoadedSeasons,
    resetSeasonProjectsCache,
    getCachedProject
} from './apiHelpers';
import { getSeasons } from './seasonService';

// --- Fetching ---

const fetchProjectsBySeasonFromApi = async (seasonYear, { useCache = true } = {}) => {
  const normalizedSeason = normalizeSeasonKey(seasonYear);
  if (!normalizedSeason) {
    return [];
  }

  if (useCache && fullyLoadedSeasons.has(normalizedSeason) && seasonProjectsCache.has(normalizedSeason)) {
    return seasonProjectsCache.get(normalizedSeason);
  }

  const response = await apiClient.get(`/projects/season/${encodeURIComponent(normalizedSeason)}`);
  const records = Array.isArray(response.data) ? response.data : [];
  const normalizedProjects = records.map(record =>
    normalizeProjectRecord({ ...record, seasonYear: record.season ?? normalizedSeason }, { seasonYear: normalizedSeason })
  );

  seasonProjectsCache.set(normalizedSeason, normalizedProjects);
  if (normalizedProjects.length > 0) {
    fullyLoadedSeasons.add(normalizedSeason);
  } else {
    fullyLoadedSeasons.delete(normalizedSeason);
  }
  return normalizedProjects;
};

/**
 * Fetch projects for a specific season.
 * 
 * @param {string} seasonYear - The season year (e.g., '2024')
 * @param {object} options
 * @param {boolean} [options.forceFresh=false] - If true, bypasses cache
 * @returns {Promise<Array>} Array of normalized project records
 */
export const getProjectsBySeason = async (seasonYear, { forceFresh = false } = {}) => {
  const normalizedSeason = normalizeSeasonKey(seasonYear);
  if (!normalizedSeason) {
    return [];
  }

  try {
    const useCache = !forceFresh;
    return await fetchProjectsBySeasonFromApi(normalizedSeason, { useCache });
  } catch (error) {
    console.error(`API Call: getProjectsBySeason(${normalizedSeason}) -> Failed.`, error);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      `Failed to fetch projects for season ${seasonYear}.`
    );
  }
};

/**
 * Fetch ALL projects across ALL available seasons.
 * 
 * USE WITH CAUTION: This can be expensive if there are many seasons/projects.
 * It iterates through all seasons and fetches projects for each.
 * 
 * @returns {Promise<Array>} Flattened array of all projects
 */
export const getAllProjects = async () => {
  try {
    const seasons = await getSeasons();
    const seasonYears = [...new Set(seasons)].filter(Boolean);

    if (seasonYears.length === 0) {
      return [];
    }

    const projectLists = await Promise.all(
      seasonYears.map(async (seasonYear) => {
        try {
          return await fetchProjectsBySeasonFromApi(seasonYear, { useCache: true });
        } catch (error) {
          console.error(`API Call: getAllProjects -> Failed to fetch projects for season ${seasonYear}`, error);
          return [];
        }
      })
    );

    const flattened = projectLists.flat();
    if (flattened.length > 0) {
      return flattened;
    }
    return [];
  } catch (error) {
    console.error('API Call: getAllProjects -> Failed.', error);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch projects from backend.'
    );
  }
};

/**
 * Fetch detailed information for a single project.
 * 
 * Checks cache first (if details are complete), otherwise hits API.
 * Updates cache with the fetched result.
 * 
 * @param {string} projectId 
 * @returns {Promise<object|null>} Project record or null
 */
export const getProjectDetails = async (projectId) => {
  if (!projectId) {
    return null;
  }

  const cachedProject = getCachedProject(projectId);
  if (cachedProject && cachedProject.wetlandAcres !== undefined) {
    return cachedProject;
  }

  try {
    const response = await apiClient.get(`/projects/details/${encodeURIComponent(projectId)}`);
    if (!response.data) {
      return null;
    }

    const normalized = normalizeProjectRecord(response.data);
    if (normalized.seasonYear) {
      const seasonKey = normalizeSeasonKey(normalized.seasonYear);
      const existing = seasonProjectsCache.get(seasonKey) || [];
      if (!existing.some(project => `${project.id}` === `${normalized.id}`)) {
        seasonProjectsCache.set(seasonKey, [...existing, normalized]);
      }
    }

    return normalized;
  } catch (error) {
    console.error(`API Call: getProjectDetails(${projectId}) -> Failed.`, error);
    throw error;
  }
};

// --- CRUD ---

/**
 * Create a new project.
 * 
 * @param {object} projectData - Project fields
 * @returns {Promise<object>} The newly created (and normalized) project
 */
export const addProject = async (projectData) => {
  if (!projectData || typeof projectData !== 'object') {
    throw new Error('Project data is required to create a project.');
  }

  try {
    const response = await apiClient.post('/projects', projectData);
    resetSeasonProjectsCache();

    if (!response?.data) {
      return null;
    }

    const normalized = normalizeProjectRecord(response.data, {
      seasonYear: projectData.seasonYear || projectData.season,
    });

    return normalized;
  } catch (error) {
    console.error('API Call: addProject -> Failed.', error);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      'Failed to create project.'
    );
  }
};

/**
 * Update an existing project.
 * 
 * @param {string} projectId 
 * @param {object} projectData - Fields to update
 * @returns {Promise<object>} The updated project record
 */
export const updateProject = async (projectId, projectData) => {
  if (!projectId) {
    throw new Error('Project ID is required to update a project.');
  }
  if (!projectData || typeof projectData !== 'object' || Object.keys(projectData).length === 0) {
    throw new Error('Project update payload must include at least one field.');
  }

  try {
    const response = await apiClient.patch(`/projects/${encodeURIComponent(projectId)}`, projectData);
    resetSeasonProjectsCache();

    if (!response?.data) {
      return null;
    }

    return normalizeProjectRecord(response.data);
  } catch (error) {
    console.error(`API Call: updateProject(${projectId}) -> Failed.`, error);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      `Failed to update project ${projectId}.`
    );
  }
};

/**
 * Delete a project.
 * 
 * @param {string} projectId 
 * @returns {Promise<object>} Success response
 */
export const deleteProject = async (projectId) => {
  if (!projectId) {
    throw new Error('Project ID is required to delete a project.');
  }

  try {
    const response = await apiClient.delete(`/projects/${encodeURIComponent(projectId)}`);
    resetSeasonProjectsCache();

    return response?.data ?? { success: true };
  } catch (error) {
    console.error(`API Call: deleteProject(${projectId}) -> Failed.`, error);
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      `Failed to delete project ${projectId}.`
    );
  }
};

/**
 * COMMENTED OUT - Draft Map Comments field doesn't exist in Airtable
 * Add a comment to the draft map of a project.
 * 
 * @param {string} projectId 
 * @param {string} comment - The comment text
 * @returns {Promise<object>} Updated project record
 */
// export const addDraftMapComment = async (projectId, comment) => {
//   try {
//     const response = await apiClient.post(`/projects/${projectId}/draft-map/comments`, { comment });
//     if (!response?.data?.success) {
//       throw new Error(response?.data?.message || 'Failed to add comment');
//     }
//     // Return relevant data, possibly updated project
//     return normalizeProjectRecord(response.data.project);
//   } catch (error) {
//     console.error(`API Call: addDraftMapComment(${projectId}) -> Failed.`, error);
//     throw new Error(
//       error?.response?.data?.message ||
//       error?.message ||
//       'Failed to submit comment.'
//     );
//   }
// };
