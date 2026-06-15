// routes/airtableRoutes.js
const express = require('express');
const router = express.Router();
const airtableController = require('../controllers/airtableController');
const {
    authenticateRequest,
    requireAdmin,
} = require('../middleware/authMiddleware');

router.use(authenticateRequest);

// GET all available seasons (options from the 'Season' field)
// Corresponds to: GetAllSeason()
router.get('/seasons', airtableController.handleGetAllSeasons);

// POST a new season option (adds choice to 'Season' field)
// Corresponds to: AddNewFolder("24-25") - *Note: Modifies schema*
router.post('/seasons', requireAdmin, airtableController.handleAddSeason);

// DELETE an existing season option (removes choice from 'Season' field)
// Corresponds to: DeleteFolder("24-25")
router.delete('/seasons/:seasonId', requireAdmin, airtableController.handleDeleteSeason);

// GET projects filtered by a specific season
// Corresponds to: GetProjectsForSeason("24-25")
router.get('/projects/season/:season', airtableController.handleGetProjectsBySeason);

// GET detailed information for a specific project by its Airtable Record ID
// Corresponds to: GetLandownerInformation(), GetProjectStatus() (combined)
router.get('/projects/details/:recordId', airtableController.handleGetProjectDetails);

// POST a new project (creates a new record in Airtable)
// Corresponds to: AddNewProject(...)
router.post('/projects', requireAdmin, airtableController.handleAddProject);

// PATCH an existing project (updates a record in Airtable by its Record ID)
// Corresponds to: UpdateProject(recordId, projectData)
router.patch('/projects/:recordId', requireAdmin, airtableController.handleUpdateProject);

// Upload/replace a project document (attachments) - Permissions handled in controller
router.post('/projects/:recordId/documents', airtableController.handleUploadProjectDocument);
// Delete a project document (attachments) - Permissions handled in controller
router.delete('/projects/:recordId/documents/:documentType', airtableController.handleDeleteProjectDocument);

// Replace a specific document at index within a multi-file slot (admin only)
router.put('/projects/:recordId/documents/:documentType/:index', airtableController.handleReplaceProjectDocumentAtIndex);
// Delete a specific document at index within a multi-file slot (admin only)
router.delete('/projects/:recordId/documents/:documentType/:index', airtableController.handleDeleteProjectDocumentAtIndex);

// GET project associated with the logged-in landowner (legacy - returns first match)
router.get('/projects/my-project', airtableController.handleGetLandownerProject);

// GET ALL projects associated with the logged-in landowner (supports multiple projects per email)
router.get('/projects/my-projects', airtableController.handleGetLandownerProjects);

// PATCH update secondary emails for a project (landowners can update their own projects, admins can update any)
router.patch('/projects/:recordId/secondary-emails', airtableController.handleUpdateSecondaryEmails);

// POST a comment to the draft map - Landowner interaction
// COMMENTED OUT - Draft Map Comments field doesn't exist in Airtable
// router.post('/projects/:recordId/draft-map/comments', airtableController.handleAddDraftMapComment);

module.exports = router;
