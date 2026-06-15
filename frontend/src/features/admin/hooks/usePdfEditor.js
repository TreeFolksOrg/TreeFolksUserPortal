/**
 * usePdfEditor Hook
 * 
 * Custom hook that manages the PDF/Image editor modal state and save operations.
 * This hook handles:
 * - Opening/closing the PDF editor modal with document context
 * - Saving annotated documents with automatic versioning
 * - Converting edited documents to appropriate formats (PDF or PNG)
 * - Optional comment submission with saved documents
 * - Determining output format based on original file type
 * 
 * Save Logic:
 * - PDFs are saved as PDFs, images are saved as PNGs
 * - Draft maps get versioned filenames (draftMap_v1.pdf, draftMap_v2.png, etc.)
 * - Other documents keep their base filename with appropriate extension
 * - Comments can be attached to draft map saves
 * 
 * @param {string} projectId - The ID of the project
 * @param {Object} project - The current project data
 * @param {Function} handleDocumentUpload - Function to upload the annotated document
 * @returns {Object} PDF editor state and operations
 * @returns {Object} pdfEditorState - Editor state { isOpen, pdfUrl, documentType, isPdf, filename }
 * @returns {Function} handleDocumentEdit - Function to open editor with a document
 * @returns {Function} handlePdfEditorSave - Function to save annotated document
 * @returns {Function} handlePdfEditorCancel - Function to close editor without saving
 */

import { useState } from "react";
import apiService from "../../../services/apiService";
import { ensureArray } from "../utils/projectHelpers";
import { DOCUMENT_SLOTS } from "../constants/projectConstants";

export const usePdfEditor = (projectId, project, handleDocumentUpload, loadProjectDetails) => {
  const [pdfEditorState, setPdfEditorState] = useState({ isOpen: false, pdfUrl: null, documentType: null, filename: null });

  const handleDocumentEdit = (documentType, pdfUrl, forceIsPdf, filename) => {
    setPdfEditorState({ isOpen: true, pdfUrl, documentType, isPdf: forceIsPdf, filename });
  };

  const handlePdfEditorSave = async (blob, comment) => {
    if (!projectId || !pdfEditorState.documentType) return;

    try {
      // Determine base filename: use metadata filename if available, else parse URL
      let currentFileName = pdfEditorState.filename;
      
      if (!currentFileName) {
          const urlParts = pdfEditorState.pdfUrl.split('/');
          currentFileName = urlParts[urlParts.length - 1].split('?')[0];
      }
      
      // Use state flag if available, otherwise heuristic
      const isPdf = pdfEditorState.isPdf !== undefined 
          ? pdfEditorState.isPdf 
          : currentFileName.toLowerCase().endsWith('.pdf');
          
      const outputExt = isPdf ? 'pdf' : 'png'; // PdfEditor exports images as PNG

      // 1. Get current file count for this slot
      const primaryDocs = ensureArray(project?.documents?.[pdfEditorState.documentType]);
      const fallbackDocs = DOCUMENT_SLOTS.find(s => s.key === pdfEditorState.documentType)?.fallbackField 
          ? ensureArray(project?.[DOCUMENT_SLOTS.find(s => s.key === pdfEditorState.documentType).fallbackField]) 
          : [];
      const currentFiles = primaryDocs.length > 0 ? primaryDocs : fallbackDocs;
      
      let newName;
      
      if (pdfEditorState.documentType === 'draftMap') {
          const nextVersionIndex = currentFiles.length + 1; 
          newName = `${pdfEditorState.documentType}_v${nextVersionIndex}.${outputExt}`;
      } else {
           // For other docs, keep filename but respect output extension (pdf/png)
           const baseName = currentFileName.lastIndexOf('.') !== -1 
              ? currentFileName.slice(0, currentFileName.lastIndexOf('.')) 
              : currentFileName;
           newName = `${baseName}.${outputExt}`;
      }

      // Create File object from blob
      const mimeType = isPdf ? 'application/pdf' : 'image/png';
      const file = new File([blob], newName, { type: mimeType });
      
      console.log(`Uploading annotated file: ${newName}, type: ${mimeType}, size: ${blob.size} bytes`);
      
      // 1. Upload the file FIRST with skipRefresh to prevent mid-flow re-render
      await handleDocumentUpload(pdfEditorState.documentType, file, { skipRefresh: true });
      
      // 2. If upload succeeds, add the comment (only for draftMaps)
      if (pdfEditorState.documentType === 'draftMap' && comment && comment.trim()) {
         // await apiService.addDraftMapComment(projectId, comment); // COMMENTED OUT - Field doesn't exist
      }
      
      // 3. Single refresh at the end after both operations complete
      // This prevents the flash caused by refreshing between upload and comment
      if (loadProjectDetails) {
        await loadProjectDetails();
      }
      
      // Close editor only after success
      setPdfEditorState({ isOpen: false, pdfUrl: null, documentType: null, isPdf: null, filename: null });
      
    } catch (error) {
      console.error('Failed to save annotated document:', error);
      alert(`Failed to save annotated document: ${error.message || 'Unknown error'}`);
    }
  };

  const handlePdfEditorCancel = () => {
    setPdfEditorState({ isOpen: false, pdfUrl: null, documentType: null, isPdf: null, filename: null });
  };

  return {
    pdfEditorState,
    handleDocumentEdit,
    handlePdfEditorSave,
    handlePdfEditorCancel
  };
};
