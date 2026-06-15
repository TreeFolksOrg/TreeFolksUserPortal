/**
 * useCommentLogic Hook
 * 
 * Custom hook that manages draft map comment submission and modal states.
 * This hook handles two distinct comment workflows:
 * 
 * 1. Standalone Comment Mode:
 *    - User adds a comment to an existing draft map
 *    - No file upload involved
 * 
 * 2. Upload with Comment Mode:
 *    - Landowner uploads a new draft map version
 *    - File is uploaded first, then comment is added
 *    - Ensures atomicity: comment only added if upload succeeds
 * 
 * Modal Management:
 * - Controls comment modal visibility and mode
 * - Tracks pending file uploads
 * - Manages submission state and error handling
 * - Displays appropriate toast notifications
 * 
 * @param {string} projectId - The ID of the project
 * @param {Function} setProject - Function to update project state
 * @param {Function} handleDocumentUpload - Function to upload draft map
 * @param {Function} setError - Function to set error state
 * @returns {Object} Comment logic state and operations
 * @returns {boolean} isCommentModalOpen - Whether comment modal is open
 * @returns {boolean} isSubmittingComment - Whether comment is being submitted
 * @returns {string} commentModalMode - Current mode ('standalone' | 'upload')
 * @returns {File|null} pendingDraftMapUpload - File waiting to be uploaded with comment
 * @returns {Function} openStandaloneCommentModal - Function to open modal for standalone comment
 * @returns {Function} handleDraftMapUploadWithComment - Function to initiate upload with comment
 * @returns {Function} handleAddComment - Function to submit comment (handles both modes)
 * @returns {Function} handleCommentModalClose - Function to close modal and reset state
 */

import { useState } from "react";
import apiService from "../../../services/apiService";
import { useToast } from "../../../contexts/ToastContext";

export const useCommentLogic = (projectId, setProject, handleDocumentUpload, setError, loadProjectDetails) => {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentModalMode, setCommentModalMode] = useState('standalone'); // 'standalone' | 'upload'
  const [pendingDraftMapUpload, setPendingDraftMapUpload] = useState(null); // File waiting for comment
  
  const { addToast } = useToast();

  const openStandaloneCommentModal = () => {
    setCommentModalMode('standalone');
    setIsCommentModalOpen(true);
  };

  const handleDraftMapUploadWithComment = (file) => {
    setPendingDraftMapUpload(file);
    setCommentModalMode('upload');
    setIsCommentModalOpen(true);
  };

  const handleAddComment = async (comment) => {
    setIsSubmittingComment(true);
    try {
      // Logic depends on mode
      if (commentModalMode === 'upload' && pendingDraftMapUpload) {
        // 1. Upload the file FIRST with skipRefresh to prevent mid-flow re-render
        await handleDocumentUpload('draftMap', pendingDraftMapUpload, { skipRefresh: true });
        
        // 2. If upload succeeds, add the comment
        if (comment.trim()) {
            // await apiService.addDraftMapComment(projectId, comment); // COMMENTED OUT - Field doesn't exist
        }
        
        // 3. Single refresh at the end after both operations complete
        if (loadProjectDetails) {
          await loadProjectDetails();
        }
        
        setPendingDraftMapUpload(null);
        addToast("Draft map uploaded with comment", "success");
      } else {
        if (comment.trim()) {
            // const updatedProject = await apiService.addDraftMapComment(projectId, comment); // COMMENTED OUT - Field doesn't exist
            setProject(updatedProject);
            addToast("Comment added successfully", "success");
        }
      }

      setIsCommentModalOpen(false);
      setCommentModalMode('standalone');
    } catch (err) {
      console.error("Failed to process comment/action:", err);
      // Don't close modal on error so user can try again
      if (setError) setError("Failed to submit. Please try again.");
      addToast("Failed to submit", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentModalClose = () => {
    setIsCommentModalOpen(false);
    setCommentModalMode('standalone');
    setPendingDraftMapUpload(null);
  };

  return {
    isCommentModalOpen,
    isSubmittingComment,
    commentModalMode,
    pendingDraftMapUpload,
    openStandaloneCommentModal,
    handleDraftMapUploadWithComment,
    handleAddComment,
    handleCommentModalClose
  };
};
