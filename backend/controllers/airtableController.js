// controllers/airtableController.js
const airtableService = require('../services/airtableService');
const cloudinaryService = require('../services/cloudinaryService');

const sanitizeFilename = (name = 'document') =>
    name.replace(/[^a-z0-9.\-_]/gi, '_');

// Helper for handling async route errors
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next); // Pass errors to global handler
};

const handleGetAllSeasons = asyncHandler(async (req, res) => {
    const seasons = await airtableService.getAllSeasons();
    res.json(seasons);
});

const handleGetProjectsBySeason = asyncHandler(async (req, res) => {
    const { season } = req.params;
    if (!season) {
        return res.status(400).json({ message: 'Season parameter is required.' });
    }
    // Basic sanitization/validation could go here
    const encodedSeason = decodeURIComponent(season); // Handle URL encoding like %20 if needed
    const projects = await airtableService.getProjectsBySeason(encodedSeason);
    res.json(projects);
});

const handleGetProjectDetails = asyncHandler(async (req, res, next) => {
    const { recordId } = req.params;
    if (!recordId) {
        return res.status(400).json({ message: 'Record ID parameter is required.' });
    }

    try {
        // --- Permission Check ---
        if (req.user && !req.user.admin) {
            // Landowner accessing project. Verify ownership.
            if (!req.user.email) {
                return res.status(401).json({ message: "Unauthorized." });
            }
            
            // Use findAllProjectsByEmail to support landowners with multiple projects
            const landownerProjects = await airtableService.findAllProjectsByEmail(req.user.email);
            const hasAccess = landownerProjects.some(project => project.id === recordId);
            
            if (!hasAccess) {
                 // The requested project is not among user's projects
                 console.warn(`Unauthorized access attempt by ${req.user.email} for project ${recordId}`);
                 return res.status(403).json({ message: "Access denied. You do not have permission to view this project." });
            }
        }
        // --- End Permission Check ---

        const projectDetails = await airtableService.getProjectDetails(recordId);
        if (!projectDetails) {
            // This case might be handled by the service throwing an error now
            return res.status(404).json({ message: 'Project not found.' });
        }
        res.json(projectDetails);
    } catch (error) {
        // Catch specific 'Project not found' error from service
        if (error.message === 'Project not found.') {
            return res.status(404).json({ message: 'Project not found.' });
        }
        next(error); // Pass other errors to global handler
    }
});

const handleAddSeason = asyncHandler(async (req, res) => {
    const { seasonName } = req.body;
    if (!seasonName || typeof seasonName !== 'string' || seasonName.trim() === '') {
        return res.status(400).json({ message: 'Valid seasonName (string) is required in the request body.' });
    }
    try {
        const result = await airtableService.addSeasonOption(seasonName.trim());
        // Success is now indicated by the message, not checking for existing
        res.status(200).json(result); // Send the success message from the service
    } catch (error) {
        // Catch specific errors if needed, otherwise let the global handler manage
        console.error(`Controller error adding season '${seasonName}':`, error.message);
        // Send a generic error or pass to global handler
        res.status(500).json({ message: error.message || 'Failed to process season addition request.' });
        // Or just use next(error);
    }
});

const handleAddProject = asyncHandler(async (req, res) => {
    const projectData = req.body;

    // Basic validation (can be more sophisticated)
    if (!projectData || typeof projectData !== 'object' || Object.keys(projectData).length === 0) {
        return res.status(400).json({ message: 'Project data is required in the request body.' });
    }
    // You might add more specific checks here based on required fields from FIELD_MAP.apiToAirtable

    const newProject = await airtableService.addProject(projectData);
    res.status(201).json(newProject); // Respond with the newly created project data
});

const handleUpdateProject = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const projectData = req.body;

    // Basic validation
    if (!recordId) {
        return res.status(400).json({ message: 'Record ID parameter is required.' });
    }
    if (!projectData || typeof projectData !== 'object' || Object.keys(projectData).length === 0) {
        return res.status(400).json({ message: 'Project data is required in the request body.' });
    }

    try {
        const updatedProject = await airtableService.updateProject(recordId, projectData);
        res.json(updatedProject); // Respond with the updated project data
    } catch (error) {
        // Catch specific 'Project not found' error from service
        if (error.message.includes('Record not found')) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        throw error; // Re-throw other errors to be handled by asyncHandler
    }
});

const handleDeleteSeason = asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    if (!seasonId) {
        return res.status(400).json({ message: 'Season ID parameter is required.' });
    }

    const normalizedSeason = decodeURIComponent(seasonId).trim();
    if (!normalizedSeason) {
        return res.status(400).json({ message: 'Season ID parameter must be a non-empty string.' });
    }

    try {
        const result = await airtableService.deleteSeasonOption(normalizedSeason);
        res.json(result);
    } catch (error) {
        console.error(`Controller error deleting season '${seasonId}':`, error.message);
        const statusCode = error.statusCode ?? 500;
        res.status(statusCode).json({ message: error.message || 'Failed to delete season.' });
    }
});

const handleGetLandownerProject = asyncHandler(async (req, res) => {
    // req.user is set by authentication middleware
    if (!req.user || !req.user.email) {
        return res.status(401).json({ message: "User email not found in token." });
    }

    const { email, secondaryEmails } = req.user;
    try {
        const project = await airtableService.findProjectByEmail(email, secondaryEmails || '');
        if (!project) {
            return res.status(404).json({ message: "No project found for this email." });
        }
        res.json(project);
    } catch (error) {
        console.error(`Error fetching project for email ${email}:`, error);
        res.status(500).json({ message: "Failed to fetch landowner project." });
    }
});

// Returns ALL projects for the logged-in landowner (supports multiple projects per email)
const handleGetLandownerProjects = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.email) {
        return res.status(401).json({ message: "User email not found in token." });
    }

    const { email, secondaryEmails } = req.user;
    try {
        const projects = await airtableService.findAllProjectsByEmail(email, secondaryEmails || '');
        // Return empty array with 200 if no projects found (not 404)
        res.json(projects || []);
    } catch (error) {
        console.error(`Error fetching projects for email ${email}:`, error);
        res.status(500).json({ message: "Failed to fetch landowner projects." });
    }
});

const handleUploadProjectDocument = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const { documentType, filename, contentType, data } = req.body || {};

    // --- Permission Check ---
    // If not admin, ensure they own the project AND are only uploading 'draftMap'
    if (req.user && !req.user.admin) {
        if (!req.user.email) {
             return res.status(401).json({ message: "Unauthorized." });
        }
        
        // Strict check: Landowners can upload draft maps, photos, and other attachments
        const allowedTypes = ['draftMap', 'plantingPhotoUrls', 'beforePhotoUrls', 'propertyImageUrls', 'otherAttachments'];
        if (!allowedTypes.includes(documentType)) {
            return res.status(403).json({ message: "Landowners can only edit the Draft Map, upload photos, or add additional documents." });
        }

        // Use findAllProjectsByEmail to support landowners with multiple projects
        const landownerProjects = await airtableService.findAllProjectsByEmail(req.user.email, req.user.secondaryEmails || '');
        const hasAccess = landownerProjects.some(project => project.id === recordId);
        if (!hasAccess) {
            return res.status(403).json({ message: "Access denied to this project." });
        }
    }
    // --- End Permission Check ---

    if (!recordId) {
        return res.status(400).json({ message: 'Record ID parameter is required.' });
    }
    if (!documentType) {
        return res.status(400).json({ message: 'documentType is required.' });
    }
    if (!data) {
        return res.status(400).json({ message: 'File data is required.' });
    }

    // --- Auto-Renaming for Draft Maps ---
    // User Requirement: [Owner Last Name or Site Name]_DraftMap_v0 (v1, v2...)
    let finalFilename = filename;
    
    if (documentType === 'draftMap') {
        try {
            // Need current project state to calculate version
            const currentProject = await airtableService.getProjectDetails(recordId);
            // ownerDisplayName maps to "Owner Last Name or Site Name" field
            const ownerName = currentProject.ownerDisplayName || currentProject.ownerFirstName || 'Project';
            const safeOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '');
            
            const existingAttachments = currentProject.draftMapUrl || [];
            // Version = count of existing attachments + 1 (Version 1, Version 2, etc.)
            const version = existingAttachments.length + 1;
            
            // finalFilename: OwnerName_DraftMap_vX.pdf
            // We assume the extension from the original filename or contentType
            const originalExt = filename?.split('.').pop() || (contentType === 'application/pdf' ? 'pdf' : 'dat');
            
            finalFilename = `${safeOwnerName}_DraftMap_v${version}.${originalExt}`;
            console.log(`[DraftMap] Renaming upload to: ${finalFilename} (Version ${version})`);
        } catch (err) {
            console.error("Failed to generate versioned filename:", err);
            // Fallback to original name if fetch fails
        }
    }

    const safeName = sanitizeFilename(finalFilename || `${documentType}-${Date.now()}`);
    const cleanedContentType = contentType || 'application/octet-stream';

    if (!cloudinaryService.isConfigured()) {
        return res.status(500).json({ message: 'Cloudinary is not configured. Set CLOUDINARY_URL or cloud name/key/secret.' });
    }

    let cloudinaryAsset = null;

    try {
        console.log(`[Upload] Starting upload for record ${recordId}, documentType: ${documentType}`);
        const buffer = Buffer.from(data, 'base64');
        console.log(`[Upload] Buffer size: ${buffer.length} bytes`);
        
        // Check if file is PDF based on detected type or extension
        const isPdf = cleanedContentType === 'application/pdf' || (filename && filename.toLowerCase().endsWith('.pdf'));
        const resourceType = isPdf ? 'raw' : 'auto';

        console.log(`[Upload] Uploading to Cloudinary - filename: ${safeName}, resource_type: ${resourceType}`);
        cloudinaryAsset = await cloudinaryService.uploadBuffer(buffer, {
            folder: 'project-uploads',
            filename: safeName,
            resource_type: resourceType,
        });

        // Use public secureUrl directly (Security settings now allow PDF delivery)
        const attachmentUrl = cloudinaryAsset.secureUrl;
        console.log(`[Upload] Cloudinary upload successful - URL: ${attachmentUrl}`);

        console.log(`[Upload] Attaching to Airtable record...`);
        const {
            project: updatedProject,
            apiKey: projectFieldKey,
            attachmentUrl: finalAttachmentUrl,
            hosted,
        } = await airtableService.attachDocumentToProject(recordId, documentType, {
            url: attachmentUrl,
            filename: finalFilename || safeName, // Use the versioned name here
            contentType: cleanedContentType,
        });

        console.log(`[Upload] Airtable attachment successful, hosted: ${hosted}`);

        const resolvedFieldKey = projectFieldKey || documentType;
        const projectFieldValue = updatedProject?.[resolvedFieldKey];
        const projectFileUrl = Array.isArray(projectFieldValue)
            ? projectFieldValue[0]
            : projectFieldValue;
        const finalFileUrl = projectFileUrl || attachmentUrl || cloudinaryAsset.secureUrl;

        // Give Airtable time to fetch the file before cleanup (longer for slower file types)
        const baseDeleteDelay = Number(process.env.CLOUDINARY_DELETE_DELAY_MS || 60000);
        const slowDeleteDelay = Number(process.env.CLOUDINARY_DELETE_DELAY_MS_SLOW || 300000);
        const deleteDelayMs = hosted ? baseDeleteDelay : slowDeleteDelay;
        if (cloudinaryAsset.publicId) {
            setTimeout(() => {
                cloudinaryService.deleteAsset(cloudinaryAsset.publicId);
            }, deleteDelayMs);
        }

        res.json({
            success: true,
            documentType,
            hosted: Boolean(hosted),
            fileUrl: finalFileUrl,
            project: updatedProject,
        });
    } catch (error) {
        console.error(`Controller error uploading document for ${recordId}:`, error);
        // Cleanup temp asset if Airtable failed after upload
        if (cloudinaryAsset?.publicId) {
            await cloudinaryService.deleteAsset(cloudinaryAsset.publicId);
        }
        res.status(500).json({ message: error.message || 'Failed to upload project document.' });
    }
});

const handleDeleteProjectDocument = asyncHandler(async (req, res) => {
    const { recordId, documentType } = req.params;

    // --- Permission Check ---
    if (req.user && !req.user.admin) {
        // User requested: "make it so that the landowner cannot delete anything"
        return res.status(403).json({ message: "Landowners cannot delete documents. Please upload a new version instead." });
    }
    // --- End Permission Check ---

    if (!recordId) {
        return res.status(400).json({ message: 'Record ID parameter is required.' });
    }
    if (!documentType) {
        return res.status(400).json({ message: 'documentType is required.' });
    }

    try {
        const updatedProject = await airtableService.detachDocumentFromProject(recordId, documentType);
        res.json({
            success: true,
            documentType,
            project: updatedProject,
        });
    } catch (error) {
        console.error(`Controller error deleting document for ${recordId}:`, error);
        res.status(500).json({ message: error.message || 'Failed to delete project document.' });
    }
});

// COMMENTED OUT - Draft Map Comments field doesn't exist in Airtable
// const handleAddDraftMapComment = asyncHandler(async (req, res) => {
//     const { recordId } = req.params;
//     const { comment } = req.body;

//     // --- Permission Check ---
//     // User requested: "I want only the landwoner to be able to send comments to the admin."
//     // Admin should view but NOT send.
//     if (req.user && req.user.admin) {
//         return res.status(403).json({ message: "Admins cannot post comments here." });
//     }
    
//     // Landowner check:
//     if (!req.user || !req.user.email) {
//         return res.status(401).json({ message: "Unauthorized." });
//     }
    
//     // Use findAllProjectsByEmail to support landowners with multiple projects
//     const landownerProjects = await airtableService.findAllProjectsByEmail(req.user.email);
//     const hasAccess = landownerProjects.some(project => project.id === recordId);
//     if (!hasAccess) {
//         return res.status(403).json({ message: "Access denied to this project." });
//     }
//     // --- End Permission Check ---

//     if (!comment || typeof comment !== 'string' || comment.trim() === '') {
//         return res.status(400).json({ message: "Comment is required." });
//     }

//     try {
//         // 1. Fetch current project to get existing comments
//         const currentProject = await airtableService.getProjectDetails(recordId);
//         const existingComments = currentProject.draftMapComments || "";

//         // 2. Format new comment entry
//         const dateStr = new Date().toLocaleString('en-US', {
//             month: 'short', day: 'numeric', year: 'numeric',
//             hour: 'numeric', minute: '2-digit', hour12: true
//         });
//         const newEntry = `[${dateStr}] ${comment.trim()}\n\n`;

//         // 3. Prepend to existing text
//         const updatedComments = newEntry + existingComments;

//         // 4. Update Airtable
//         const updatedProject = await airtableService.updateProject(recordId, {
//             draftMapComments: updatedComments
//         });

//         res.json({
//             success: true,
//             project: updatedProject
//         });

//     } catch (error) {
//         console.error(`Error adding draft map comment for ${recordId}:`, error);
//         res.status(500).json({ message: "Failed to add comment." });
//     }
// });

/**
 * Handles replacing a specific document at an index within a multi-file slot.
 * Admin only - used for Final Map individual file replacement.
 */
const handleReplaceProjectDocumentAtIndex = asyncHandler(async (req, res) => {
    const { recordId, documentType, index } = req.params;
    const { filename, contentType, data } = req.body || {};

    // --- Permission Check: Admin only ---
    if (!req.user?.admin) {
        return res.status(403).json({ message: "Only admins can replace individual documents." });
    }

    if (!recordId) {
        return res.status(400).json({ message: 'Record ID parameter is required.' });
    }
    if (!documentType) {
        return res.status(400).json({ message: 'documentType is required.' });
    }
    if (!data) {
        return res.status(400).json({ message: 'File data is required.' });
    }

    const parsedIndex = parseInt(index, 10);
    if (isNaN(parsedIndex) || parsedIndex < 0) {
        return res.status(400).json({ message: 'Valid file index is required.' });
    }

    const safeName = sanitizeFilename(filename || `${documentType}-${Date.now()}`);
    const cleanedContentType = contentType || 'application/octet-stream';

    if (!cloudinaryService.isConfigured()) {
        return res.status(500).json({ message: 'Cloudinary is not configured.' });
    }

    let cloudinaryAsset = null;

    try {
        const buffer = Buffer.from(data, 'base64');
        const isPdf = cleanedContentType === 'application/pdf' || (filename && filename.toLowerCase().endsWith('.pdf'));
        const resourceType = isPdf ? 'raw' : 'auto';

        cloudinaryAsset = await cloudinaryService.uploadBuffer(buffer, {
            folder: 'project-uploads',
            filename: safeName,
            resource_type: resourceType,
        });

        const attachmentUrl = cloudinaryAsset.secureUrl;

        const updatedProject = await airtableService.replaceDocumentAtIndex(
            recordId,
            documentType,
            parsedIndex,
            {
                url: attachmentUrl,
                filename: filename || safeName,
                contentType: cleanedContentType,
            }
        );

        // Schedule cleanup of temp Cloudinary asset after Airtable hosts it
        const deleteDelayMs = Number(process.env.CLOUDINARY_DELETE_DELAY_MS || 60000);
        if (cloudinaryAsset.publicId) {
            setTimeout(() => {
                cloudinaryService.deleteAsset(cloudinaryAsset.publicId);
            }, deleteDelayMs);
        }

        res.json({
            success: true,
            documentType,
            index: parsedIndex,
            project: updatedProject,
        });
    } catch (error) {
        console.error(`Controller error replacing document at index ${parsedIndex} for ${recordId}:`, error);
        if (cloudinaryAsset?.publicId) {
            await cloudinaryService.deleteAsset(cloudinaryAsset.publicId);
        }
        res.status(error.statusCode || 500).json({ 
            message: error.message || 'Failed to replace document at index.' 
        });
    }
});

/**
 * Handles deleting a specific document at an index within a multi-file slot.
 * Admin only - used for Final Map individual file deletion.
 */
const handleDeleteProjectDocumentAtIndex = asyncHandler(async (req, res) => {
    const { recordId, documentType, index } = req.params;

    // --- Permission Check: Admin only ---
    if (!req.user?.admin) {
        return res.status(403).json({ message: "Only admins can delete individual documents." });
    }

    if (!recordId) {
        return res.status(400).json({ message: 'Record ID parameter is required.' });
    }
    if (!documentType) {
        return res.status(400).json({ message: 'documentType is required.' });
    }

    const parsedIndex = parseInt(index, 10);
    if (isNaN(parsedIndex) || parsedIndex < 0) {
        return res.status(400).json({ message: 'Valid file index is required.' });
    }

    try {
        const updatedProject = await airtableService.detachDocumentAtIndex(
            recordId,
            documentType,
            parsedIndex
        );

        res.json({
            success: true,
            documentType,
            index: parsedIndex,
            project: updatedProject,
        });
    } catch (error) {
        console.error(`Controller error deleting document at index ${parsedIndex} for ${recordId}:`, error);
        res.status(error.statusCode || 500).json({ 
            message: error.message || 'Failed to delete document at index.' 
        });
    }
});

/**
 * Allow landowners to update secondary emails for their own project(s)
 */
const handleUpdateSecondaryEmails = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const { secondaryEmails } = req.body;

    // Permission Check - only allow landowners to update their own projects
    if (!req.user || !req.user.email) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    // Admins can update any project's secondary emails
    if (!req.user.admin) {
        // Landowners can only update their own projects
        const landownerProjects = await airtableService.findAllProjectsByEmail(req.user.email);
        const hasAccess = landownerProjects.some(project => project.id === recordId);
        
        if (!hasAccess) {
            return res.status(403).json({ message: "Access denied to this project." });
        }
    }

    // Validate secondaryEmails format (should be comma-separated emails or empty string)
    if (secondaryEmails !== undefined && typeof secondaryEmails !== 'string') {
        return res.status(400).json({ message: "Secondary emails must be a string." });
    }

    try {
        const updatedProject = await airtableService.updateProject(recordId, {
            secondaryEmails: secondaryEmails || ''
        });
        
        res.json({
            success: true,
            project: updatedProject
        });
    } catch (error) {
        console.error(`Error updating secondary emails for ${recordId}:`, error);
        if (error.message.includes('Record not found')) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        res.status(500).json({ message: "Failed to update secondary emails." });
    }
});

/**
 * Sync Firebase secondary emails to user's Airtable projects
 * Merges Firebase secondary emails with existing Airtable secondary emails
 */
const handleSyncSecondaryEmails = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.email) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    console.log('[SYNC CONTROLLER] User object:', {
        email: req.user.email,
        secondaryEmails: req.user.secondaryEmails,
        uid: req.user.uid
    });

    try {
        const primaryEmail = req.user.email;
        const firebaseSecondaryEmails = req.user.secondaryEmails || '';
        
        console.log('[SYNC CONTROLLER] Calling syncSecondaryEmailsToProjects with:', {
            primaryEmail,
            firebaseSecondaryEmails
        });
        
        const result = await airtableService.syncSecondaryEmailsToProjects(
            primaryEmail,
            firebaseSecondaryEmails
        );
        
        console.log('[SYNC CONTROLLER] Sync result:', result);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error(`[SYNC CONTROLLER] Error syncing secondary emails for ${req.user.email}:`, error);
        res.status(500).json({ message: "Failed to sync secondary emails." });
    }
});

/**
 * Approve or unapprove a map (Draft or Final)
 * Landowners can approve their own maps
 */
const handleApproveMap = asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const { mapType, approved } = req.body;

    // Validate mapType
    if (!['draft', 'final'].includes(mapType)) {
        return res.status(400).json({ message: "Map type must be 'draft' or 'final'." });
    }

    // Validate approved value
    if (typeof approved !== 'boolean') {
        return res.status(400).json({ message: "Approved value must be a boolean." });
    }

    // Permission Check - must be authenticated
    if (!req.user || !req.user.email) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    // Admins can approve any project's maps
    if (!req.user.admin) {
        // Landowners can only approve their own projects
        const landownerProjects = await airtableService.findAllProjectsByEmail(req.user.email, req.user.secondaryEmails || '');
        const hasAccess = landownerProjects.some(project => project.id === recordId);
        
        if (!hasAccess) {
            return res.status(403).json({ message: "Access denied to this project." });
        }
    }

    try {
        const fieldName = mapType === 'draft' ? 'draftMapApproved' : 'finalMapApproved';
        const updatedProject = await airtableService.updateProject(recordId, {
            [fieldName]: approved
        });
        
        res.json({
            success: true,
            project: updatedProject,
            message: `${mapType === 'draft' ? 'Draft' : 'Final'} map ${approved ? 'approved' : 'unapproved'} successfully.`
        });
    } catch (error) {
        console.error(`Error approving ${mapType} map for ${recordId}:`, error);
        if (error.message.includes('Record not found')) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        res.status(500).json({ message: `Failed to approve ${mapType} map.` });
    }
});

module.exports = {
    handleGetAllSeasons,
    handleGetProjectsBySeason,
    handleGetProjectDetails,
    handleAddSeason,
    handleAddProject,
    handleUpdateProject,
    handleDeleteSeason,
    handleUploadProjectDocument,
    handleDeleteProjectDocument,
    handleReplaceProjectDocumentAtIndex,
    handleDeleteProjectDocumentAtIndex,
    handleGetLandownerProject,
    handleGetLandownerProjects,
    handleUpdateSecondaryEmails,
    handleSyncSecondaryEmails,
    handleApproveMap,
    // handleAddDraftMapComment, // COMMENTED OUT - Draft Map Comments field doesn't exist
};
