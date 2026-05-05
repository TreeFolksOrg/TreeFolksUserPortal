// services/airtableService.js
require('dotenv').config();
const Airtable = require('airtable');
const axios = require('axios'); // For Metadata API calls

// --- Configuration ---
const {
    AIRTABLE_PAT,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_SEASON_FIELD_ID, // Still useful for getAllSeasons
    AIRTABLE_API_URL
} = process.env;

const DEFAULT_AIRTABLE_API_HOST = 'https://api.airtable.com';
const resolveAirtableHost = (rawUrl) => {
    if (!rawUrl) {
        return DEFAULT_AIRTABLE_API_HOST;
    }
    try {
        return new URL(rawUrl).origin;
    } catch (error) {
        console.warn(`Invalid AIRTABLE_API_URL "${rawUrl}", falling back to ${DEFAULT_AIRTABLE_API_HOST}`);
        return DEFAULT_AIRTABLE_API_HOST;
    }
};

const airtableApiHost = resolveAirtableHost(AIRTABLE_API_URL);

// Configure Airtable client FOR DATA API
Airtable.configure({
    endpointUrl: airtableApiHost,
    apiKey: AIRTABLE_PAT
});

const base = Airtable.base(AIRTABLE_BASE_ID);
const table = base(AIRTABLE_TABLE_ID);

// --- Metadata API client ---
// Airtable Metadata API base URL: https://api.airtable.com/v0/meta/bases/{baseId}
const metadataApi = axios.create({
    baseURL: `${airtableApiHost}/v0/meta/bases/${AIRTABLE_BASE_ID}`,
    timeout: 20000,
    headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
    },
});

// --- Helper for Metadata API Calls ---
const resolveAttachmentFieldName = async (documentType) => {
    const preferred = DOCUMENT_FIELD_MAP[documentType];
    if (!preferred) {
        throw createServiceError(`Unsupported document type '${documentType}'.`, 400);
    }
    return preferred;
};

// --- Field Mappings (Keep as is, used by other functions) ---
// --- Field Mappings ---
// Single Source of Truth for Field Configuration
const FIELD_DEFINITIONS = [
    // Standard Identifiers & Contact Info
    { api: 'uniqueId', airtable: 'UniqueID' },
    { api: 'ownerFirstName', airtable: 'Owner First Name or Organization' },
    { api: 'ownerDisplayName', airtable: 'Owner Last Name or Site Name' },
    { api: 'address', airtable: 'Property Address' },
    { api: 'phone', airtable: 'Primary Phone Number' },
    { api: 'email', airtable: 'Email' },
    { api: 'city', airtable: 'City' },
    { api: 'zipCode', airtable: 'Zip Code' },
    { api: 'county', airtable: 'County' },

    // Project Details
    { api: 'season', airtable: 'Season' },
    { api: 'status', airtable: 'Current Status' },
    { api: 'landRegion', airtable: 'Land Region' },
    { api: 'propertyId', airtable: 'Property ID Number(s)' },
    { api: 'siteNumber', airtable: 'Site Number' },

    // Dates
    { api: 'Initial Contact Date', airtable: 'Initial Contact Date' },
    { api: 'consultationDate', airtable: 'Consultation Date' },
    { api: 'flaggingDate', airtable: 'Flagging Date' },
    { api: 'plantingDate', airtable: 'Planting Date' },
    { api: 'applicationDate', airtable: 'Application Date' },

    // Metrics
    { api: 'wetlandAcres', airtable: 'Wetland Acres' },
    { api: 'uplandAcres', airtable: 'Upland Acres' },
    { api: 'totalAcres', airtable: 'Total Acres' },
    { api: 'wetlandTrees', airtable: 'Wetland Trees' },
    { api: 'uplandTrees', airtable: 'Upland Trees' },
    { api: 'totalTrees', airtable: 'Total Trees' },
    { api: 'quizScorePreConsultation', airtable: 'Quiz Score - Pre-consult' },
    { api: 'quizScorePostPlanting', airtable: 'Quiz Score - Post-planting' },
    { api: 'participationStatus', airtable: 'Participation status' },

    // Maps & Documents (Using Url suffix to match Read logic and Attachment handling)
    { api: 'initialMapUrl', airtable: 'Initial Map' },
    { api: 'draftMapUrl', airtable: 'Draft Map' },
    { api: 'finalMapUrl', airtable: 'Final Map' },
    { api: 'replantingMapUrl', airtable: 'Replanting Map' },

    // Attachments / Collections
    { api: 'otherAttachments', airtable: 'Other Attachments' },
    { api: 'activeCarbonShapefiles', airtable: 'Active Carbon Shapefiles' },
    { api: 'plantingPhotoUrls', airtable: 'Planting Photos' },
    { api: 'beforePhotoUrls', airtable: 'Before Photos' },
    { api: 'propertyImageUrls', airtable: 'Landowner Photo Submissions' },
    { api: 'carbonDocs', airtable: 'Carbon docs (notarized)' },
    { api: 'postPlantingReports', airtable: 'Post-Planting Reports' },
    { api: 'draftMapComments', airtable: 'Draft Map Comments' },
];

const buildFieldMaps = () => {
    const apiToAirtable = {};
    const airtableToApi = {};

    FIELD_DEFINITIONS.forEach(def => {
        const { airtable, api } = def;
        if (airtable && api) {
            airtableToApi[airtable] = api;
            apiToAirtable[api] = airtable;
        }
    });

    return { apiToAirtable, airtableToApi };
};

const FIELD_MAP = buildFieldMaps();

const DOCUMENT_FIELD_MAP = {
    carbonDocs: FIELD_MAP.apiToAirtable.carbonDocs || 'Carbon docs (notarized)',
    draftMap: FIELD_MAP.apiToAirtable.draftMap || 'Draft Map',
    finalMap: FIELD_MAP.apiToAirtable.finalMap || 'Final Map',
    replantingMap: FIELD_MAP.apiToAirtable.replantingMap || 'Replanting Map',
    otherAttachments: FIELD_MAP.apiToAirtable.otherAttachments || 'Other Attachments',
    postPlantingReports: FIELD_MAP.apiToAirtable.postPlantingReports || 'Post-Planting Reports',
    plantingPhotoUrls: FIELD_MAP.apiToAirtable.plantingPhotoUrls || 'Planting Photos',
    beforePhotoUrls: FIELD_MAP.apiToAirtable.beforePhotoUrls || 'Before Photos',
    propertyImageUrls: FIELD_MAP.apiToAirtable.propertyImageUrls || 'Landowner Photo Submissions',
    activeCarbonShapefiles: FIELD_MAP.apiToAirtable.activeCarbonShapefiles || 'Active Carbon Shapefiles',
};

// --- Helper Function to Process Records (Keep as is) ---
const processRecord = (record) => {
    const processed = { id: record.id }; // Always include the Airtable record ID
    for (const airtableField in FIELD_MAP.airtableToApi) {
        const apiKey = FIELD_MAP.airtableToApi[airtableField];
        const value = record.get(airtableField);

        if (value !== undefined) {
            // Handle attachments specifically: extract URL(s)
            if (Array.isArray(value) && value[0]?.url) {
                // Determine if this is a "Photo" field that expects simple string URLs (for backward comp with Carousel)
                const isPhotoField = ['plantingPhotoUrls', 'beforePhotoUrls', 'propertyImageUrls'].includes(apiKey);

                if (isPhotoField) {
                     processed[apiKey] = value.map(att => ({
                         url: att.url,
                         thumbnail: att.thumbnails?.large?.url || att.thumbnails?.small?.url || att.url,
                         filename: att.filename,
                         type: att.type
                     }));
                } else {
                     // For Documents (Maps, Docs, Shapefiles), return full metadata for intelligent handling (versioning, types)
                     // Always return as Array of objects
                     processed[apiKey] = value.map(att => ({
                         url: att.url,
                         filename: att.filename,
                         id: att.id,
                         type: att.type
                     }));

                     // For backward compatibility (if any logic expects a single property not array),
                     // we might need to handle single-value fields, but our frontend ensuresArray mostly.
                     // The only potential break is if frontend accesses project.draftMapUrl direct expecting a string.
                     // But we are updating frontend.
                }
            } else {
                processed[apiKey] = value;
            }
        }
    }
    // Combine owner names if desired
    if (processed.ownerFirstName || processed.ownerDisplayName) {
        processed.ownerFullName = [processed.ownerFirstName, processed.ownerDisplayName].filter(Boolean).join(' ').trim();
    }
    return processed;
};


const SEASON_FIELD_NAME = FIELD_MAP.apiToAirtable.season || 'Season';

const createServiceError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const escapeFormulaValue = (value = '') =>
    String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const buildSeasonFilterFormula = (seasonName) =>
    `{${SEASON_FIELD_NAME}} = "${escapeFormulaValue(seasonName)}"`;


// --- Service Functions ---

// --- Keep getAllSeasons (uses Metadata API) ---
const getAllSeasons = async () => {
    try {
        console.log(`Fetching metadata via /tables for table ${AIRTABLE_TABLE_ID} to get seasons`);
        const response = await metadataApi.get(`/tables`); // Gets all tables
        const tablesData = response.data.tables;

        const targetTable = tablesData.find(t => t.id === AIRTABLE_TABLE_ID);
        if (!targetTable) {
            // Try finding by name if ID fails (less reliable)
            const tableByName = tablesData.find(t => t.name === "Application, status, and GIS data");
            if (!tableByName) {
                throw new Error(`Table with ID ${AIRTABLE_TABLE_ID} or name 'Application, status, and GIS data' not found in metadata.`);
            }
            console.warn(`Warning: Found table by name, configured ID ${AIRTABLE_TABLE_ID} might be incorrect.`);
            // If you want to proceed using the name match, uncomment below
            // targetTable = tableByName;
            // else { // If still not found
            //throw new Error(`Table with ID ${AIRTABLE_TABLE_ID} or name 'Application, status, and GIS data' not found in metadata.`);
            //}
        }


        const seasonField = targetTable.fields.find(f => f.id === AIRTABLE_SEASON_FIELD_ID || f.name === 'Season'); // Find field by ID or Name
        if (!seasonField) {
            throw new Error(`'Season' field (ID: ${AIRTABLE_SEASON_FIELD_ID} or name 'Season') not found in table ${targetTable.id}.`);
        }
        if (seasonField.type !== 'singleSelect') {
            throw new Error(`'Season' field (ID: ${seasonField.id}) is not a singleSelect.`);
        }

        const choices = seasonField.options?.choices?.map(choice => choice.name) || [];
        console.log(`Found Seasons: ${choices.join(', ')}`);
        return choices;
    } catch (error) {
        console.error('Error fetching seasons from metadata (/tables):', error.response?.data || error.message);
        throw new Error(`Failed to fetch seasons: ${error.message}`); // Re-throw for controller
    }
};


// --- Keep getProjectsBySeason (uses Data API) ---
const getProjectsBySeason = async (season) => {
    return new Promise((resolve, reject) => {
        const projects = [];
        // Select fields needed for list view - update based on your FIELD_MAP.airtableToApi
        const fieldsToSelect = Object.keys(FIELD_MAP.airtableToApi); // Select all mapped fields for simplicity or curate as before
        const normalizedSeason = String(season || '').trim();
        const escapedSeason = escapeFormulaValue(normalizedSeason.toLowerCase());
        const seasonFilterFormula = `LOWER(TRIM({${SEASON_FIELD_NAME}} & "")) = "${escapedSeason}"`;

        console.log(`Fetching projects for season: ${normalizedSeason}`); // Removed long fields list log
        console.log(`Using season filter formula: ${seasonFilterFormula}`);

        table.select({
            // maxRecords: 100, // Consider pagination for large bases
            // Intentionally do not set view so records hidden by a specific Airtable view are still returned.
            filterByFormula: seasonFilterFormula,
            fields: fieldsToSelect // Only fetch necessary fields
        }).eachPage(
            (records, fetchNextPage) => {
                records.forEach((record) => {
                    projects.push(processRecord(record));
                });

                fetchNextPage(); // IMPORTANT: Call this to get the next page
            },
            (err) => {
                if (err) {
                    console.error('Error fetching projects by season:', err);
                    return reject(new Error(`Failed to fetch projects for season ${normalizedSeason}: ${err.message}`));
                }
                console.log(`Found ${projects.length} projects for season ${normalizedSeason}`);
                resolve(projects); // Resolve the promise when done
            }
        );
    });
};

// --- Keep getProjectDetails (uses Data API) ---
const getProjectDetails = async (recordId) => {
    try {
        console.log(`Fetching details for record: ${recordId}`);
        const record = await table.find(recordId);
        if (!record) {
            throw new Error('Project not found.');
        }

        return processRecord(record);
    } catch (error) {
        console.error(`Error fetching project details for ${recordId}:`, error);
        if (error.message && error.message.includes('NOT_FOUND')) {
            throw new Error('Project not found.');
        }
        throw new Error(`Failed to fetch project details: ${error.message}`);
    }
};

const findProjectByEmail = async (email) => {
    if (!email) throw new Error('Email is required to find project.');

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Searching for project with email: ${normalizedEmail}`);

    // Escape email for Airtable formula to prevent injection/formula breakage
    const emailField = FIELD_MAP.apiToAirtable.email || 'Email';
    const escapedEmail = escapeFormulaValue(normalizedEmail);
    const filterFormula = `LOWER({${emailField}}) = "${escapedEmail}"`;

    console.log(`Using filter formula: ${filterFormula}`);

    try {
        const records = await table.select({
            maxRecords: 1,
            filterByFormula: filterFormula,
        }).firstPage();

        if (records.length === 0) {
            console.log(`No project found for email: ${normalizedEmail}`);
            return null;
        }

        const foundRecord = processRecord(records[0]);

        // CRITICAL: Post-fetch verification to prevent data leaks
        // Double-check that the returned record's email actually matches
        const recordEmail = (foundRecord.email || '').toLowerCase().trim();
        if (recordEmail !== normalizedEmail) {
            console.error(`DATA LEAK PREVENTED: Requested email '${normalizedEmail}' but Airtable returned record with email '${recordEmail}'. Record ID: ${foundRecord.id}`);
            return null;
        }

        return foundRecord;
    } catch (error) {
        console.error(`Error finding project by email ${normalizedEmail}:`, error);
        throw new Error(`Failed to find project by email.`);
    }
};

/**
 * Finds ALL projects associated with a given email address.
 * Used for landowners who may have multiple projects.
 * @param {string} email - The email address to search for
 * @returns {Promise<Array>} - Array of normalized project records
 */
const findAllProjectsByEmail = async (email) => {
    if (!email) throw new Error('Email is required to find projects.');

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Searching for ALL projects with email: ${normalizedEmail}`);

    const emailField = FIELD_MAP.apiToAirtable.email || 'Email';
    const escapedEmail = escapeFormulaValue(normalizedEmail);
    const filterFormula = `LOWER({${emailField}}) = "${escapedEmail}"`;

    console.log(`Using filter formula: ${filterFormula}`);

    try {
        const allRecords = [];

        await new Promise((resolve, reject) => {
            table.select({
                filterByFormula: filterFormula,
                fields: Object.keys(FIELD_MAP.airtableToApi),
            }).eachPage(
                (records, fetchNextPage) => {
                    records.forEach((record) => {
                        const processed = processRecord(record);
                        // Verify email matches to prevent data leaks
                        const recordEmail = (processed.email || '').toLowerCase().trim();
                        if (recordEmail === normalizedEmail) {
                            allRecords.push(processed);
                        } else {
                            console.warn(`DATA LEAK PREVENTED: Skipping record ${processed.id} with mismatched email`);
                        }
                    });
                    fetchNextPage();
                },
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });

        console.log(`Found ${allRecords.length} projects for email: ${normalizedEmail}`);
        return allRecords;
    } catch (error) {
        console.error(`Error finding all projects by email ${normalizedEmail}:`, error);
        throw new Error(`Failed to find projects by email.`);
    }
};

/**
 * Attempts to add a new season option by creating and deleting a dummy record.
 * Requires 'data.records:write' scope for the PAT.
 */
const addSeasonOption = async (newSeasonName) => {
    const trimmedSeason = String(newSeasonName || '').trim();
    if (!trimmedSeason) {
        throw createServiceError('Season name is required to add option.', 400);
    }

    console.log(`Attempting to add season option '${trimmedSeason}' via Metadata API...`);

    let targetTable;
    let seasonField;

    try {
        const response = await metadataApi.get(`/tables`);
        const tablesData = response?.data?.tables ?? [];

        targetTable = tablesData.find(t => t.id === AIRTABLE_TABLE_ID) ||
            tablesData.find(t => t.name === "Application, status, and GIS data");

        if (!targetTable) {
            throw createServiceError(
                `Table with ID ${AIRTABLE_TABLE_ID} or name 'Application, status, and GIS data' not found in metadata.`,
                500
            );
        }

        seasonField = targetTable.fields.find(f => f.id === AIRTABLE_SEASON_FIELD_ID || f.name === SEASON_FIELD_NAME);
        if (!seasonField) {
            throw createServiceError(
                `'Season' field (ID: ${AIRTABLE_SEASON_FIELD_ID} or name '${SEASON_FIELD_NAME}') not found in table ${targetTable.id}.`,
                500
            );
        }
    } catch (error) {
        console.error(`Error fetching metadata for season addition '${trimmedSeason}':`, error.response?.data || error.message);
        throw createServiceError(
            `Failed to fetch Airtable metadata for season addition: ${error.message}`,
            500
        );
    }

    const existingChoices = seasonField.options?.choices ?? [];

    // Check for duplicates (case-insensitive)
    const normalizedNewName = trimmedSeason.toLowerCase();
    const exists = existingChoices.some(choice => choice.name.trim().toLowerCase() === normalizedNewName);

    if (exists) {
        console.log(`Season option '${trimmedSeason}' already exists. Skipping addition.`);
        return { message: `Season option '${trimmedSeason}' already exists.` };
    }

    // Append new choice
    // Note: We don't provide an ID for the new choice; Airtable generates it.
    // We also don't include 'choiceOrder' to avoid messing up order for new items we don't have IDs for yet.
    // However, Airtable requires we send ALL choices we want to keep.
    const newChoice = { name: trimmedSeason };
    const newChoices = [...existingChoices, newChoice];

    const metadataPayload = {
        name: seasonField.name,
        type: seasonField.type,
        description: seasonField.description ?? undefined,
        options: {
            choices: newChoices,
             // We intentionally omit choiceOrder because we can't add the new ID to it yet.
             // Airtable should append the new choice.
        },
    };

    try {
        console.log('Metadata Field PATCH payload for adding season:', JSON.stringify(metadataPayload, null, 2));
        await metadataApi.patch(`/tables/${targetTable.id}/fields/${seasonField.id}`, metadataPayload);

        console.log(`Season option '${trimmedSeason}' added to Airtable.`);
        return {
            success: true,
            season: trimmedSeason,
            message: `Season option '${trimmedSeason}' added to Airtable.`
        };
    } catch (error) {
        const responseData = error.response?.data;
        console.error(`Error adding season option '${trimmedSeason}':`, responseData || error.message);
        throw createServiceError(
            `Failed to add season option '${trimmedSeason}': ${responseData?.error?.message || error.message}`,
            error.response?.status || 500
        );
    }
};


// --- Keep addProject (uses Data API) ---
const addProject = async (projectData) => {
    try {
        // 1. Map incoming API data to Airtable field names/IDs
        const airtableRecordData = {};
        for (const apiKey in projectData) {
            const airtableField = FIELD_MAP.apiToAirtable[apiKey];
            if (airtableField) {
                airtableRecordData[airtableField] = projectData[apiKey];
            } else if (apiKey === 'season') { // Handle season specifically if not directly mapped
                airtableRecordData[FIELD_MAP.apiToAirtable.season || 'Season'] = projectData.season;
            }
        }

        // Basic validation
        if (!airtableRecordData[FIELD_MAP.apiToAirtable.season || 'Season']) {
            throw new Error("Season is required to add a project.");
        }
        // Ensure fields needed for UniqueID are present if creating
        if (!airtableRecordData[FIELD_MAP.apiToAirtable.ownerLastName || 'Owner Last Name or Site Name']) {
            throw new Error("Owner Last Name/Site Name is required.");
        }
        if (!airtableRecordData[FIELD_MAP.apiToAirtable.propertyId || 'Property ID Number(s)']) {
            console.warn("Warning: 'Property ID Number(s)' is missing, UniqueID may not calculate correctly.");
            // Consider throwing error if it's strictly required for UniqueID:
            // throw new Error("Property ID Number(s) is required.");
        }
        if (airtableRecordData[FIELD_MAP.apiToAirtable.siteNumber || 'Site Number'] === undefined) { // Check for undefined specifically
            console.warn("Warning: 'Site Number' is missing, UniqueID may not calculate correctly.");
            // Consider throwing error if it's strictly required for UniqueID:
            // throw new Error("Site Number is required.");
        }
        // Add other required field checks as needed based on Airtable UI
        if (!airtableRecordData[FIELD_MAP.apiToAirtable.address || 'Property Address']) {
            throw new Error("Property Address is required."); // Example check
        }


        console.log('Creating Airtable record with data:', airtableRecordData);

        // 2. Use the Airtable client to create the record
        const createdRecords = await table.create([{ fields: airtableRecordData }], { typecast: true });

        if (!createdRecords || createdRecords.length === 0) {
            throw new Error('Record creation failed, no record returned.');
        }

        console.log(`Successfully created record ID: ${createdRecords[0].id}`);
        // 3. Return the newly created record (processed)
        return processRecord(createdRecords[0]);

    } catch (error) {
        console.error('Error adding project:', error);
        const errMsg = error.message || 'Failed to add project.';
        if (errMsg.includes('UNKNOWN_FIELD_NAME')) {
            throw new Error(`Failed to add project: Invalid field name provided. Check FIELD_MAP. ${errMsg}`);
        }
        if (errMsg.includes('INVALID_VALUE_FOR_COLUMN')) {
            throw new Error(`Failed to add project: Invalid value for a field. ${errMsg}`);
        }
        if (errMsg.includes('REQUIRED_FIELD_MISSING')) { // Common Airtable error type
            throw new Error(`Failed to add project: A required field is missing. ${errMsg}`);
        }
        throw new Error(`Failed to add project: ${errMsg}`);
    }
};


// --- Update Project ---
const updateProject = async (recordId, projectData) => {
    try {
        // 1. Map incoming API data to Airtable field names/IDs
        const airtableRecordData = {};
        for (const apiKey in projectData) {
            const airtableField = FIELD_MAP.apiToAirtable[apiKey];
            if (airtableField) {
                airtableRecordData[airtableField] = projectData[apiKey];
            } else if (apiKey === 'season') { // Handle season specifically if not directly mapped
                airtableRecordData[FIELD_MAP.apiToAirtable.season || 'Season'] = projectData.season;
            }
        }

        // Basic validation - ensure we're not updating critical fields that shouldn't change
        if (Object.keys(airtableRecordData).length === 0) {
            throw new Error("No valid fields provided to update.");
        }

        console.log(`Updating Airtable record ${recordId} with data:`, airtableRecordData);

        // 2. Use the Airtable client to update the record
        const updatedRecords = await table.update([
            {
                id: recordId,
                fields: airtableRecordData
            }
        ], { typecast: true });

        if (!updatedRecords || updatedRecords.length === 0) {
            throw new Error('Record update failed, no record returned.');
        }

        console.log(`Successfully updated record ID: ${updatedRecords[0].id}`);
        // 3. Return the updated record (processed)
        return processRecord(updatedRecords[0]);

    } catch (error) {
        console.error(`Error updating project ${recordId}:`, error);
        const errMsg = error.message || 'Failed to update project.';
        if (errMsg.includes('UNKNOWN_FIELD_NAME')) {
            throw new Error(`Failed to update project: Invalid field name provided. Check FIELD_MAP. ${errMsg}`);
        }
        if (errMsg.includes('INVALID_VALUE_FOR_COLUMN')) {
            throw new Error(`Failed to update project: Invalid value for a field. ${errMsg}`);
        }
        if (errMsg.includes('NOT_FOUND')) {
            throw new Error(`Failed to update project: Record not found. ${errMsg}`);
        }
        throw new Error(`Failed to update project: ${errMsg}`);
    }
};


const normalizeSeasonName = (value = '') => {
    const dashed = String(value ?? '')
        .trim()
        .replace(/\s*-\s*/g, '-') // enforce simple hyphen only
        .replace(/\s+/g, ' '); // collapse internal whitespace
    return dashed.toLowerCase();
};

const deleteSeasonOption = async (seasonName) => {
    const trimmedSeason = String(seasonName || '').trim();
    if (!trimmedSeason) {
        throw createServiceError('Season name is required to delete option.', 400);
    }

    console.log(`Attempting to delete season option '${trimmedSeason}'`);

    let existingRecords = [];
    try {
        const ownerNameField = FIELD_MAP.apiToAirtable.ownerLastName || 'Owner Last Name or Site Name';
        const seasonFormula = buildSeasonFilterFormula(trimmedSeason);
        const filterFormula = seasonFormula;

        existingRecords = await table.select({
            maxRecords: 1,
            filterByFormula: filterFormula,
            fields: ['UniqueID'],
        }).firstPage();
    } catch (error) {
        console.error(`Error verifying existing projects for season '${trimmedSeason}':`, error);
        throw createServiceError(
            `Failed to verify projects for season '${trimmedSeason}': ${error.message}`,
            500
        );
    }

    if (Array.isArray(existingRecords) && existingRecords.length > 0) {
        throw createServiceError(
            `Cannot delete season '${trimmedSeason}' because it still has projects. Please reassign or delete those projects first.`,
            409
        );
    }

    let targetTable;
    let seasonField;
    try {
        console.log(`Fetching metadata to locate season options...`);
        const response = await metadataApi.get(`/tables`);
        const tablesData = response?.data?.tables ?? [];

        targetTable = tablesData.find(t => t.id === AIRTABLE_TABLE_ID) ||
            tablesData.find(t => t.name === "Application, status, and GIS data");

        if (!targetTable) {
            throw createServiceError(
                `Table with ID ${AIRTABLE_TABLE_ID} or name 'Application, status, and GIS data' not found in metadata.`,
                500
            );
        }

        seasonField = targetTable.fields.find(f => f.id === AIRTABLE_SEASON_FIELD_ID || f.name === SEASON_FIELD_NAME);
        if (!seasonField) {
            throw createServiceError(
                `'Season' field (ID: ${AIRTABLE_SEASON_FIELD_ID} or name '${SEASON_FIELD_NAME}') not found in table ${targetTable.id}.`,
                500
            );
        }
        console.log(`Season field metadata:`, JSON.stringify(seasonField.options, null, 2));
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        console.error(`Error fetching metadata for season deletion '${trimmedSeason}':`, error.response?.data || error.message);
        throw createServiceError(
            `Failed to fetch Airtable metadata for season deletion: ${error.message}`,
            500
        );
    }

    const existingChoices = seasonField.options?.choices ?? [];
    const normalizedTargetName = normalizeSeasonName(trimmedSeason);
    const targetChoice = existingChoices.find(choice => normalizeSeasonName(choice?.name) === normalizedTargetName);

    if (!targetChoice) {
        throw createServiceError(
            `Season option '${trimmedSeason}' does not exist in Airtable.`,
            404
        );
    }

    const originalChoices = Array.isArray(seasonField.options?.choices)
        ? seasonField.options.choices
        : [];

    // --- FIX 2: Use Field-Specific Endpoint & Strict Sanitization ---
    // 1. Rebuild choices array - removing 'icon' which causes validation errors if invalid
    const newChoices = originalChoices
        .filter(choice => choice.id !== targetChoice.id)
        .map(choice => {
            const clean = {
                id: choice.id,
                name: choice.name,
            };
            // Only include color if it's a valid string (Airtable strictness)
            if (choice.color && typeof choice.color === 'string') {
                clean.color = choice.color;
            }
            return clean;
        });

    const updatedOptions = {
        choices: newChoices
    };

    // 2. Handle choiceOrder if it exists
    if (Array.isArray(seasonField.options?.choiceOrder)) {
        const newOrder = seasonField.options.choiceOrder.filter(id => id !== targetChoice.id);
        if (newOrder.length > 0) {
            updatedOptions.choiceOrder = newOrder;
        }
    }

    console.log(
        `Updated season options payload (removing '${trimmedSeason}') - using strict sanitization:`,
        JSON.stringify(updatedOptions, null, 2)
    );

    try {
        // Attempt 2 Revision: Include 'name' and 'type' in the payload.
        // Even for PATCH, Airtable Metadata API often complains if 'name' is missing,
        // or treats it as an "unknown" request if key identifiers are absent.
        const metadataPayload = {
            name: seasonField.name,
            type: seasonField.type,
            description: seasonField.description ?? undefined,
            options: updatedOptions,
        };
        console.log('Metadata Field PATCH payload:', JSON.stringify(metadataPayload, null, 2));

        // Target the specific FIELD endpoint
        await metadataApi.patch(`/tables/${targetTable.id}/fields/${seasonField.id}`, metadataPayload);

        console.log(`Season option '${trimmedSeason}' removed from Airtable.`);
        return {
            success: true,
            season: trimmedSeason,
            message: `Season option '${trimmedSeason}' removed from Airtable.`,
        };
    } catch (error) {
        const responseData = error.response?.data;
        console.error(`Error removing season option '${trimmedSeason}':`, responseData || error.message);
        const responseMessage =
            responseData?.message ||
            responseData?.error?.message ||
            responseData?.error?.type;
        const detailedMessage = responseMessage
            ? `${responseMessage} | full payload: ${JSON.stringify(responseData)}`
            : error.message;
        throw createServiceError(
            `Failed to delete season option '${trimmedSeason}': ${detailedMessage}`,
            error.response?.status || 500
        );
    }
};

const attachDocumentToProject = async (recordId, documentType, attachment) => {
    const fieldName = await resolveAttachmentFieldName(documentType);
    const apiKeyForField = FIELD_MAP.airtableToApi[fieldName] || documentType;
    if (!attachment?.url) {
        throw createServiceError('Attachment URL is required.', 400);
    }

    try {
        const isLikelyLargeDoc = /pdf|doc|xls|ppt|zip|shp/i.test(
            String(attachment?.contentType || attachment?.filename || '')
        );
        const hostWaitMs = Number(
            process.env.AIRTABLE_ATTACHMENT_HOST_WAIT_MS ||
            (isLikelyLargeDoc ? 20000 : 12000)
        );
        const shouldAppend =
            documentType === 'plantingPhotoUrls' ||
            documentType === 'beforePhotoUrls' ||
            documentType === 'propertyImageUrls' ||
            documentType === 'finalMap' || // Allow multiple Final Maps
            documentType === 'draftMap'; // Enable versioning for Draft Map PDFs

        let existingAttachments = [];
        if (shouldAppend) {
            try {
                const currentRecord = await table.find(recordId);
                const currentFieldValue = currentRecord?.get(fieldName);
                if (Array.isArray(currentFieldValue)) {
                    existingAttachments = currentFieldValue
                        .filter(att => att?.id)
                        .map(att => ({ id: att.id }));
                }
            } catch (lookupError) {
                throw createServiceError(
                    lookupError?.message || `Failed to read existing attachments for '${fieldName}'.`,
                    lookupError?.statusCode || 500
                );
            }
        }

        const attachmentPayload = shouldAppend
            ? [
                ...existingAttachments,
                {
                    url: attachment.url,
                    filename: attachment.filename,
                },
            ]
            : [
                {
                    url: attachment.url,
                    filename: attachment.filename,
                },
            ];

        const updatePayload = [{
            id: recordId,
            fields: {
                [fieldName]: attachmentPayload,
            },
        }];

        const updatedRecords = await table.update(updatePayload, { typecast: true });
        if (!updatedRecords || updatedRecords.length === 0) {
            throw new Error('Record update failed, no record returned.');
        }
        const updatedRecord = updatedRecords[0];

        // For single-file fields, wait briefly for Airtable to host the attachment and return the CDN URL.
        if (!shouldAppend) {
            const delayMs = isLikelyLargeDoc ? 1500 : 1000;
            const maxAttempts = Math.max(1, Math.ceil(hostWaitMs / delayMs));
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const fieldValue = updatedRecord.get(fieldName);
                const firstAttachment = Array.isArray(fieldValue) ? fieldValue[0] : null;
                const url = firstAttachment?.url;
                if (url && url.includes('airtableusercontent.com')) {
                    break;
                }
                await wait(delayMs);
                const latest = await table.find(recordId);
                updatedRecord.fields = latest.fields;
            }
            if (maxAttempts > 1) {
                console.log(
                    `Attachment host wait complete for ${recordId}/${fieldName} after ${maxAttempts} attempt(s)`
                );
            }
        }

        const fieldValue = updatedRecord.get(fieldName);
        const firstAttachment = Array.isArray(fieldValue) ? fieldValue[0] : null;
        const attachmentUrl = firstAttachment?.url || null;
        const hosted = Boolean(attachmentUrl && attachmentUrl.includes('airtableusercontent.com'));
        const processedProject = processRecord(updatedRecord);

        return {
            project: processedProject,
            apiKey: apiKeyForField,
            attachmentUrl,
            hosted,
        };
    } catch (error) {
        console.error(`Error attaching document (${documentType}) to record ${recordId}:`, error);

        if (error.statusCode) {
            throw error;
        }
        throw createServiceError(error.message || 'Failed to attach document to project.');
    }
};

const detachDocumentFromProject = async (recordId, documentType) => {
    const fieldName = await resolveAttachmentFieldName(documentType);
    try {
        let updateValue = []; // Default to clearing the field

        // Handling for versioned documents (Draft Map)
        if (documentType === 'draftMap') {
             const currentRecord = await table.find(recordId);
             const currentFieldValue = currentRecord?.get(fieldName);

             if (Array.isArray(currentFieldValue) && currentFieldValue.length > 0) {
                 // Remove the last item (newest version)
                 const keptAttachments = currentFieldValue.slice(0, -1);
                 // important: map back to the format Airtable expects for writing (array of objects with id, or partial)
                 // Actually, writing back existing attachments just needs their ID or partial object.
                 // Ideally, we map to { id: att.id } to be safe and efficient.
                 updateValue = keptAttachments.map(att => ({ id: att.id }));
             }
        }

        const updatePayload = [{
            id: recordId,
            fields: {
                [fieldName]: updateValue,
            },
        }];

        const updatedRecords = await table.update(updatePayload, { typecast: true });
        if (!updatedRecords || updatedRecords.length === 0) {
            throw new Error('Record update failed, no record returned.');
        }
        return processRecord(updatedRecords[0]);
    } catch (error) {
        console.error(`Error removing document (${documentType}) from record ${recordId}:`, error);
        if (error.statusCode) {
            throw error;
        }
        throw createServiceError(error.message || 'Failed to remove document from project.');
    }
};


/**
 * Replaces a specific document at a given index within a document array field.
 * Used for individual file replacement in multi-file slots like Final Map.
 *
 * @param {string} recordId - Airtable record ID
 * @param {string} documentType - Document type key (e.g., 'finalMap')
 * @param {number} index - Index of file to replace (0-based)
 * @param {object} attachment - New attachment { url, filename, contentType }
 * @returns {object} - Processed updated project record
 */
const replaceDocumentAtIndex = async (recordId, documentType, index, attachment) => {
    const fieldName = await resolveAttachmentFieldName(documentType);

    if (!attachment?.url) {
        throw createServiceError('Attachment URL is required.', 400);
    }

    if (typeof index !== 'number' || index < 0) {
        throw createServiceError('Valid index is required.', 400);
    }

    try {
        // Fetch current record to get existing attachments
        const currentRecord = await table.find(recordId);
        const currentFieldValue = currentRecord?.get(fieldName);

        if (!Array.isArray(currentFieldValue) || currentFieldValue.length === 0) {
            throw createServiceError('No documents exist in this slot to replace.', 400);
        }

        if (index >= currentFieldValue.length) {
            throw createServiceError(`Index ${index} is out of bounds. Only ${currentFieldValue.length} file(s) exist.`, 400);
        }

        // Build new attachments array: keep existing by ID except at index, insert new one
        const newAttachments = currentFieldValue.map((att, i) => {
            if (i === index) {
                // Replace this one with new attachment
                return {
                    url: attachment.url,
                    filename: attachment.filename,
                };
            }
            // Keep existing attachment by ID
            return { id: att.id };
        });

        const updatePayload = [{
            id: recordId,
            fields: {
                [fieldName]: newAttachments,
            },
        }];

        const updatedRecords = await table.update(updatePayload, { typecast: true });
        if (!updatedRecords || updatedRecords.length === 0) {
            throw new Error('Record update failed, no record returned.');
        }

        return processRecord(updatedRecords[0]);
    } catch (error) {
        console.error(`Error replacing document at index ${index} (${documentType}) for record ${recordId}:`, error);
        if (error.statusCode) {
            throw error;
        }
        throw createServiceError(error.message || 'Failed to replace document at index.');
    }
};

/**
 * Removes a specific document at a given index within a document array field.
 * Used for individual file deletion in multi-file slots like Final Map.
 *
 * @param {string} recordId - Airtable record ID
 * @param {string} documentType - Document type key (e.g., 'finalMap')
 * @param {number} index - Index of file to remove (0-based)
 * @returns {object} - Processed updated project record
 */
const detachDocumentAtIndex = async (recordId, documentType, index) => {
    const fieldName = await resolveAttachmentFieldName(documentType);

    if (typeof index !== 'number' || index < 0) {
        throw createServiceError('Valid index is required.', 400);
    }

    try {
        // Fetch current record to get existing attachments
        const currentRecord = await table.find(recordId);
        const currentFieldValue = currentRecord?.get(fieldName);

        if (!Array.isArray(currentFieldValue) || currentFieldValue.length === 0) {
            throw createServiceError('No documents exist in this slot to delete.', 400);
        }

        if (index >= currentFieldValue.length) {
            throw createServiceError(`Index ${index} is out of bounds. Only ${currentFieldValue.length} file(s) exist.`, 400);
        }

        // Build new attachments array excluding the one at index
        const newAttachments = currentFieldValue
            .filter((_, i) => i !== index)
            .map(att => ({ id: att.id }));

        const updatePayload = [{
            id: recordId,
            fields: {
                [fieldName]: newAttachments,
            },
        }];

        const updatedRecords = await table.update(updatePayload, { typecast: true });
        if (!updatedRecords || updatedRecords.length === 0) {
            throw new Error('Record update failed, no record returned.');
        }

        return processRecord(updatedRecords[0]);
    } catch (error) {
        console.error(`Error removing document at index ${index} (${documentType}) from record ${recordId}:`, error);
        if (error.statusCode) {
            throw error;
        }
        throw createServiceError(error.message || 'Failed to remove document at index.');
    }
};


// --- Exports ---
module.exports = {
    getAllSeasons,
    getProjectsBySeason,
    getProjectDetails,
    addSeasonOption, // Export the new workaround function
    addProject,
    updateProject,
    deleteSeasonOption,
    attachDocumentToProject,
    detachDocumentFromProject,
    replaceDocumentAtIndex,
    detachDocumentAtIndex,
    findProjectByEmail,
    findAllProjectsByEmail,
};
