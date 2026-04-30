/**
 * Project Constants
 * 
 * This file contains constant definitions used across project detail pages.
 * These constants define the structure and metadata for various project-related
 * data that is displayed and managed in the application.
 */

/**
 * DOCUMENT_SLOTS
 * 
 * Defines the different types of documents that can be associated with a project.
 * Each slot represents a document category with its own upload/management rules.
 * 
 * Structure:
 * - key: Unique identifier for the document type
 * - label: Human-readable display name
 * - description: Explanation of what this document type contains
 * - fallbackField: Legacy field name for backward compatibility with old data
 * 
 * Special Handling:
 * - 'draftMap' slot supports versioning (v1, v2, v3, etc.)
 * - 'draftMap' slot supports comments from landowners
 */
export const DOCUMENT_SLOTS = [
  {
    key: "carbonDocs",
    label: "Carbon Docs (Notarized)",
    description: "Signed documentation verifying carbon credits.",
    fallbackField: "carbonDocs",
  },
  {
    key: "draftMap",
    label: "Draft Map",
    description: "Latest GIS draft map uploaded for review.",
    fallbackField: "draftMapUrl",
  },
  {
    key: "finalMap",
    label: "Final Map",
    description: "Approved planting map for this site.",
    fallbackField: "finalMapUrl",
  },
  {
    key: "replantingMap",
    label: "Replanting Map",
    description: "Map for replanting scope and revisions.",
    fallbackField: "replantingMapUrl",
  },
  {
    key: "otherAttachments",
    label: "Other Attachments",
    description: "Supplemental project documents.",
    fallbackField: "otherAttachments",
  },
  {
    key: "postPlantingReports",
    label: "Post-Planting Reports",
    description: "Reports documenting post-planting observations.",
    fallbackField: "postPlantingReports",
  },
];

/**
 * TIMELINE_PHASES
 * 
 * Defines the seasonal timeline phases for the tree planting project.
 * Used to display expectations and key activities for landowners throughout the year.
 * 
 * Structure:
 * - title: Time period (e.g., "June — August")
 * - points: Array of activities/milestones expected during this phase
 * 
 * This helps landowners understand what to expect at each stage of their project.
 */
export const TIMELINE_PHASES = [
  {
    title: "January — August",
    points: [
      "On-site consultations with TreeFolks' experts & create draft maps",
      'Establish "Grow Zones" in planting areas',
      "Fence out livestock from grow zones",
      "Flag off planting areas & finalize maps"
    ],
  },
  {
    title: "October — January",
    points: [
      "Trees are planted by contractors or volunteers",
      "Pick up Groasis boxes",
      "Ideal time for seeding wildflowers & naive grasses",
      "Drop off Groasis boxes"
    ],
  },
  {
    title: "January — May",
    points: [
      "Carbon+ Credit docs filed w/ county clerks (if applicable)",
      "Landowners submit photo points annually (Optional)",
    ],
  },
];
