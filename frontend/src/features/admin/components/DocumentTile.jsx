import { useRef, useState } from "react";
import { Loader2, Plus, Pencil, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

/**
 * DocumentTile - Manages document uploads, versions, and permissions
 * 
 * This complex component handles:
 * - Document display with versioning support
 * - Upload/Replace/Delete/Edit actions with permission checks
 * - Special handling for draft maps (landowner upload, comments)
 * - Loading states for all async operations
 * - Version selector for multi-file documents
 * 
 * Permission model:
 * - Admins: Full control (upload, delete, edit all documents)
 * - Landowners: Can only upload new versions of draft maps (no delete)
 * 
 * @param {object} props
 * @param {object} props.slot - Document slot config { key, label, description, fallbackField }
 * @param {Array} props.files - Array of file objects or URLs for this slot
 * @param {function} props.onUpload - Callback(slotKey, file) for uploads (admin only for draftMap)
 * @param {function} props.onUploadWithComment - Callback(file) for landowner draftMap uploads - opens comment modal
 * @param {function} props.onDelete - Callback(slot) for deletions
 * @param {function} props.onEdit - Callback(slotKey, url, isPdf, filename) to open editor
 * @param {boolean} props.isUploading - Loading state during upload
 * @param {boolean} props.isDeleting - Loading state during deletion
 * @param {boolean} props.isAdmin - Whether current user is admin
 * @param {string} props.comments - Draft map comments (Airtable blob - newline separated)
 * @param {function} props.onAddComment - Callback to show standalone comment modal (landowner only)
 */
const DocumentTile = ({
  slot,
  files,
  onUpload,
  onUploadWithComment,
  onDelete,
  onEdit,
  isUploading,
  isDeleting,
  isAdmin,
  comments,
  onAddComment,
}) => {
  const fileInputRef = useRef(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);

  // ==================== Comment Parsing ====================
  
  /**
   * Parse comments string into array of comment objects
   * Comments are stored as newline-separated entries in Airtable
   * Format: "[timestamp] - comment text"
   */
  const parseComments = (commentsString) => {
    if (!commentsString) return [];
    
    // Split by double newline (comment separator) or single newline if no doubles
    const separator = commentsString.includes('\n\n') ? '\n\n' : '\n';
    const parts = commentsString.split(separator).filter(Boolean);
    
    return parts.map((part, index) => {
      // Support two formats:
      // 1. Backend format: "[Jan 15, 2026, 10:00 AM] comment text"
      // 2. Legacy/Manual format: "Jan 15, 2026 - comment text"
      
      const bracketMatch = part.match(/^\[(.*?)(?:\])\s*(.*)$/s);
      if (bracketMatch) {
         return {
           id: index,
           date: bracketMatch[1],
           text: bracketMatch[2].trim()
         };
      }

      const legacyMatch = part.match(/^(\w{3}\s+\d{1,2},?\s+\d{4})\s*[-–:]\s*(.*)$/s);
      if (legacyMatch) {
        return {
          id: index,
          date: legacyMatch[1],
          text: legacyMatch[2].trim()
        };
      }
      
      return {
        id: index,
        date: null,
        text: part.trim()
      };
    });
  };

  const parsedComments = parseComments(comments);
  const visibleComments = showAllComments ? parsedComments : parsedComments.slice(0, 2);
  const hasMoreComments = parsedComments.length > 2;

  // ==================== Event Handlers ====================
  
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // For landowner draftMap uploads, use the comment-required flow
      if (!isAdmin && slot.key === 'draftMap' && onUploadWithComment) {
        onUploadWithComment(selectedFile);
      } else {
        await onUpload(slot.key, selectedFile);
      }
    }
    event.target.value = ""; // Allow re-selecting same file
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  // ==================== Helper Functions ====================

  /**
   * Extracts file info from file object or string URL
   * @param {string|object} file - File data
   * @returns {object} { url, filename, extension }
   */
  const getFileInfo = (file) => {
    if (!file) return { url: '', filename: '', extension: '' };
    
    const url = typeof file === 'object' ? file.url : file;
    const filename = typeof file === 'object' ? file.filename : '';
    
    // Determine extension from filename if available, else from URL
    let extension = '';
    if (filename) {
      extension = filename.split('.').pop().toLowerCase();
    } else {
      // Fallback to URL parsing (less reliable for signed URLs)
      const cleanUrl = url.split('?')[0].toLowerCase();
      if (cleanUrl.match(/\.[a-z0-9]+$/)) {
        extension = cleanUrl.split('.').pop();
      }
    }
    return { url, filename, extension };
  };

  const handleEdit = () => {
    if (onEdit) {
      // Use selected version, or default to newest (last in array)
      const indexToEdit = selectedVersionIndex !== null ? selectedVersionIndex : files.length - 1;
      const fileData = files[indexToEdit];
      const { url, extension } = getFileInfo(fileData);
      
      // Robust detection using explicit extension from metadata
      const hasImageExt = ['png', 'jpg', 'jpeg'].includes(extension);
      const hasPdfExt = extension === 'pdf';
      
      // It's a PDF if explicit pdf extension, OR (if extension is missing AND it's draftMap)
      const isPdf = hasPdfExt || (slot.key === 'draftMap' && !hasImageExt);
      
      const filename = typeof fileData === 'object' ? fileData.filename : '';
      
      onEdit(slot.key, url, isPdf, filename);
    }
  };

  // ==================== Permission Checks ====================

  const inputId = `upload-${slot.key}`;
  const canEdit = slot.key === 'draftMap' && files.length > 0;
  
  // Landowners can only upload versions if a file already exists. Initial upload is Admin only.
  const canModify = isAdmin || (slot.key === 'draftMap' && files.length > 0);
  
  // ==================== Render: Empty State ====================

  if (files.length === 0 || isUploading) {
    // Show placeholder if no permission to upload
    if (!canModify && files.length === 0) {
      return (
        <div className="flex h-full flex-col justify-between rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-4 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-800">{slot.label}</p>
            <p className="mt-2 text-xs text-gray-500">{slot.description}</p>
            <p className="mt-4 text-xs italic text-gray-400">No document uploaded.</p>
          </div>
        </div>
      );
    }

    // Show upload button with loading state
    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border-2 border-dashed border-green-500/40 bg-green-50/50 p-4 text-center">
        <div>
          <p className="text-sm font-semibold text-gray-800">{slot.label}</p>
          <p className="mt-2 text-xs text-gray-500">{slot.description}</p>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={openPicker}
            className={`inline-flex items-center justify-center rounded-full border border-green-600/30 bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-green-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 ${
              isUploading
                ? "cursor-not-allowed opacity-70"
                : "hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
            }`}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading to Airtable...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </button>
          <input
            id={inputId}
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>
    );
  }

  // ==================== Render: Document Exists ====================

  // Use the selected version if available, otherwise the newest (last) for all document types
  const indexToUse = selectedVersionIndex !== null 
    ? selectedVersionIndex 
    : files.length - 1;
    
  const primaryFile = files[indexToUse];
  const { url: primaryUrl } = getFileInfo(primaryFile);

  const isBusy = isUploading || isDeleting;
  const disabledLinkClass = isBusy ? "pointer-events-none opacity-60" : "";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {slot.label}
      </p>
      
      {/* File Info */}
      <div className="mt-3 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          File attached
        </p>
        <p className="mt-2 text-xs text-gray-500 line-clamp-3">
          {slot.description}
        </p>
        {files.length > 1 && (
          <p className="mt-2 text-xs text-gray-400">
            +{files.length - 1} additional file
            {files.length - 1 > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* File Selector for multiple files */}
      {files.length > 1 && (
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-600">
            {slot.key === 'draftMap' ? 'Select version:' : 'Select file:'}
          </label>
          <select
            value={selectedVersionIndex !== null ? selectedVersionIndex : files.length - 1}
            onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
          >
            {files.map((file, index) => {
               const { filename } = getFileInfo(file);
               const displayLabel = slot.key === 'draftMap' 
                  ? `Version ${index + 1}`
                  : (filename || `File ${index + 1}`);
                  
               return (
                  <option key={index} value={index}>
                    {displayLabel}
                  </option>
               );
            }).reverse()} 
            {/* Reverse so newest/last added is at top for versions, or just consistent list */}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* View Button */}
        <a
          href={primaryUrl}
          target="_blank"
          rel="noreferrer"
          className={`flex-1 rounded-lg border border-green-600/30 bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm shadow-green-500/20 transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 ${disabledLinkClass}`}
        >
          View
        </a>
        
        {/* Edit Button - Draft Map Only */}
        {canEdit && (
          <button
            type="button"
            onClick={handleEdit}
            className={`rounded-lg border border-blue-600/30 bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
              isBusy ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isBusy}
          >
            <span className="flex items-center">
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </span>
          </button>
        )}
        
        {/* Replace/Upload New Version Button */}
        {(isAdmin || slot.key === 'draftMap') && (
          <button
            type="button"
            onClick={openPicker}
            className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 ${
              isBusy ? "opacity-70" : ""
            }`}
            disabled={isBusy}
          >
            {isUploading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading to Airtable...
              </span>
            ) : isDeleting ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              (!isAdmin && slot.key === 'draftMap') ? "Upload New Version" : "Replace"
            )}
          </button>
        )}
        
        {/* Delete Button - Admin Only */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onDelete?.(slot)}
            className={`rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 ${
              isBusy ? "opacity-70" : ""
            }`}
            disabled={isBusy}
          >
            Delete
          </button>
        )}
        
        {/* Hidden File Input */}
        {(isAdmin || slot.key === 'draftMap') && (
          <input
            id={inputId}
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            disabled={isBusy}
          />
        )}
      </div>

      {/* COMMENTED OUT - Draft Map Comments field doesn't exist in Airtable
      {slot.key === 'draftMap' && (

        <div className="mt-4 border-t border-gray-100 pt-3">
          {parsedComments.length > 0 && (
            <div className="rounded-md bg-yellow-50 p-3 mb-3">
              <p className="text-xs font-semibold text-yellow-800 mb-2">
                Last Landowner Comment:
              </p>
              {(() => {
                 const lastComment = parsedComments[0];
                 return (
                   <div className="text-xs text-yellow-700 border-l-2 border-yellow-300 pl-2">
                      {lastComment.date && (
                        <p className="font-medium text-yellow-800">{lastComment.date}</p>
                      )}
                      <p className="whitespace-pre-wrap">{lastComment.text}</p>
                   </div>
                 );
              })()}
            </div>
          )}

          {!isAdmin && files.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => onAddComment?.()}
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
              >
                <MessageSquare className="mr-2 h-4 w-4 text-gray-500" />
                Add Comment / Feedback
              </button>
            </div>
          )} 
        </div>
      )}
      */}
    </div>
  );
};

export default DocumentTile;