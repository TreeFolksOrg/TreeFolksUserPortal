// src/services/apiHelpers.js

// --- Cache ---
export const seasonProjectsCache = new Map(); // Map<string, Array<NormalizedProject>>
export const fullyLoadedSeasons = new Set(); // Tracks which seasons have a complete project list cached

export const resetSeasonProjectsCache = () => {
  seasonProjectsCache.clear();
  fullyLoadedSeasons.clear();
};

export const normalizeSeasonKey = (value) => String(value ?? '').trim();

export const getCachedProject = (projectId) => {
  for (const projects of seasonProjectsCache.values()) {
    const match = projects.find(project => `${project.id}` === `${projectId}`);
    if (match) {
      return match;
    }
  }
  return null;
};

// --- Normalization ---

/**
 * Normalizes a raw project record from the backend into a standardized format for the frontend.
 * 
 * Handles:
 * - Field mapping (backend -> frontend)
 * - Default value assignment
 * - Data transformation (e.g., ensuring arrays, formatting metrics)
 * 
 * @param {object} record - Raw project record from API
 * @param {object} context - Additional context (e.g., { seasonYear })
 * @returns {object} Normalized project object
 */
export const normalizeProjectRecord = (record = {}, { seasonYear } = {}) => {
  const computedSeasonYear = record.seasonYear ?? record.season ?? seasonYear ?? '';

  const ensureMetrics = (metrics) => ({
    canopyGrowth: metrics?.canopyGrowth ?? (record.totalTrees ? `${record.totalTrees} trees` : 'N/A'),
    biodiversity: metrics?.biodiversity ?? 'N/A',
    carbonOffset: metrics?.carbonOffset ?? 'N/A',
    treesSurvival: metrics?.treesSurvival ?? 'N/A',
  });

  const ensureContact = (contact) => ({
    phone: contact?.phone ?? record.phone ?? 'N/A',
    email: contact?.email ?? record.email ?? 'N/A',
  });

  const toArray = (value) => Array.isArray(value) ? value : (value ? [value] : []);

  if (record.name && record.seasonYear) {
    const normalizedContact = ensureContact(record.contact);
    const normalizedMetrics = ensureMetrics(record.metrics);
    return {
      ...record,
      seasonYear: computedSeasonYear || record.seasonYear,
      contact: normalizedContact,
      metrics: normalizedMetrics,
    };
  }

  const primaryImage =
    record.image ??
    (Array.isArray(record.plantingPhotoUrls) && record.plantingPhotoUrls[0]) ??
    (Array.isArray(record.beforePhotoUrls) && record.beforePhotoUrls[0]) ??
    record.finalMapUrl ??
    null;

  const displayNameCandidate =
    record.title ??
    record.ownerDisplayName ??
    record.ownerFullName ??
    record.ownerFirstName ??
    record.landowner ??
    undefined;

  const landowner =
    record.landowner ??
    record.ownerFullName ??
    record.ownerDisplayName ??
    record.ownerFirstName ??
    'N/A';

  const fallbackIdBase =
    record.uniqueId ??
    displayNameCandidate ??
    record.propertyId ??
    record.siteNumber ??
    'project';

  const documentLinks = {
    carbonDocs: toArray(record.carbonDocs),
    draftMap: toArray(record.draftMapUrl),
    finalMap: toArray(record.finalMapUrl),
    replantingMap: toArray(record.replantingMapUrl),
    otherAttachments: toArray(record.otherAttachments),
    postPlantingReports: toArray(record.postPlantingReports),
  };

  return {
    id: record.id ?? record.uniqueId ?? `${fallbackIdBase}-${computedSeasonYear || 'unknown'}`,
    seasonYear: computedSeasonYear,
    landowner,
    location: record.location ?? record.city ?? '',
    address: record.address ?? '',
    zipCode: record.zipCode ?? '',
    siteNumber: record.siteNumber ?? '',
    image: primaryImage,
    contact: ensureContact(record.contact),
    metrics: ensureMetrics(record.metrics),
    ownerFirstName: record.ownerFirstName ?? '',
    ownerDisplayName: record.ownerDisplayName ?? '',
    phone: record.phone ?? record.contact?.phone ?? '',
    email: record.email ?? record.contact?.email ?? '',
    applicationDate: record.applicationDate ?? '',
    consultationDate: record.consultationDate ?? '',
    flaggingDate: record.flaggingDate ?? '',
    plantingDate: record.plantingDate ?? '',
    quizScorePreConsultation: record.quizScorePreConsultation ?? '',
    quizScorePostPlanting: record.quizScorePostPlanting ?? '',
    beforePhotoUrls: toArray(record.beforePhotoUrls),
    plantingPhotoUrls: toArray(record.plantingPhotoUrls),
    propertyImageUrls: toArray(record.propertyImageUrls),
    activeCarbonShapefiles: toArray(record.activeCarbonShapefiles),
    wetlandAcres: record.wetlandAcres ?? "",
    uplandAcres: record.uplandAcres ?? "",
    totalAcres: record.totalAcres ?? "",
    wetlandTrees: record.wetlandTrees ?? "",
    uplandTrees: record.uplandTrees ?? "",
    totalTrees: record.totalTrees ?? "",
    status: record.status ?? 'Unknown',
    // draftMapComments: record.draftMapComments ?? "", // COMMENTED OUT - Field doesn't exist in Airtable
    documents: documentLinks,
    raw: record.raw ?? record,
  };
};

// --- File Utils ---

/**
 * Converts a File object to a Base64 string.
 * 
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 string of the file content
 */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",").pop();
        resolve(base64 || "");
      } else {
        reject(new Error("Unable to read file as base64."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file for upload."));
    };
    reader.readAsDataURL(file);
  });
