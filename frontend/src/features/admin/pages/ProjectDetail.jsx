// src/features/admin/pages/ProjectDetail.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  User,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";

// ==================== Common Components ====================
import Carousel from "../../../components/common/Carousel";
import InfoCard from "../../../components/common/InfoCard";
import InfoField from "../../../components/common/InfoField";
import DateSelectionModal from "../../../components/common/DateSelectionModal";

// ==================== Feature Components ====================
import PdfEditor from "../components/PdfEditor";
import DocumentTile from "../components/DocumentTile";
// COMMENTED OUT - Draft Map Comments field doesn't exist
// import DraftMapCommentModal from "../components/DraftMapCommentModal";
import MediaGridItem from "../components/MediaGridItem";
import PhotoUploadButton from "../components/PhotoUploadButton";
import ProjectSelector from "../../landowner/components/ProjectSelector";

// ==================== Hooks & Constants ====================
import { useAuth } from "../../auth/AuthProvider";
import { formatDate, ensureText, ensureArray } from "../utils/projectHelpers";
import { DOCUMENT_SLOTS, TIMELINE_PHASES } from "../constants/projectConstants";
import { useProjectData } from "../hooks/useProjectData";
import { useDocumentManagement } from "../hooks/useDocumentManagement";
import { usePhotoManagement } from "../hooks/usePhotoManagement";
import { usePdfEditor } from "../hooks/usePdfEditor";
import { useCommentLogic } from "../hooks/useCommentLogic";
import { approveMap } from "../../../services/projectService";

// ==================== Main Component ====================

const ProjectDetail = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  // --- Hooks ---
  const {
    project,
    setProject,
    loading,
    error,
    setError,
    landownerProjects,
    loadProjectDetails,
  } = useProjectData(projectId);

  const {
    docUploadState,
    docDeleteState,
    handleDocumentUpload,
    handleDocumentDelete,
    handleDocumentReplaceAtIndex,
    handleDocumentDeleteAtIndex
  } = useDocumentManagement(projectId, project, loadProjectDetails);

  const {
    photoUploadState,
    pendingPhotoUpload,
    lightboxImage,
    initiatePhotoUpload,
    handleDateConfirm,
    handleDateCancel,
    openLightbox,
    closeLightbox
  } = usePhotoManagement(projectId, loadProjectDetails);

  const {
    pdfEditorState,
    handleDocumentEdit,
    handlePdfEditorSave,
    handlePdfEditorCancel
  } = usePdfEditor(projectId, project, handleDocumentUpload, loadProjectDetails);

  const {
    isCommentModalOpen,
    isSubmittingComment,
    commentModalMode,
    pendingDraftMapUpload,
    openStandaloneCommentModal,
    handleDraftMapUploadWithComment,
    handleAddComment,
    handleCommentModalClose
  } = useCommentLogic(projectId, setProject, handleDocumentUpload, setError, loadProjectDetails);

  // --- Map Approval State & Handler ---
  const [isApprovingMap, setIsApprovingMap] = useState(false);

  const handleApproveMap = async (mapType, approved) => {
    setIsApprovingMap(true);
    try {
      const updatedProject = await approveMap(projectId, mapType, approved);
      setProject(updatedProject);
    } catch (err) {
      console.error('Failed to approve map:', err);
      setError(err.message || 'Failed to approve map.');
    } finally {
      setIsApprovingMap(false);
    }
  };


  // --- Derived State & Handlers ---

  const handleSelectProject = (newProjectId) => {
      navigate(`/landowner/project/${newProjectId}`);
  };

  const handleGoBack = () => {
    if (!isAdmin) {
      navigate('/landowner/dashboard');
      return;
    }
    if (project?.seasonYear) {
      navigate(`/admin/seasons/${project.seasonYear}`);
      return;
    }
    navigate("/admin/dashboard");
  };

  // Photos calculation
  const beforePhotos = ensureArray(project?.beforePhotoUrls);
  const plantingPhotos = ensureArray(project?.plantingPhotoUrls);
  const combinedPhotos = Array.from(
    new Set([...beforePhotos, ...plantingPhotos].filter(Boolean))
  );
  const landownerPhotos = ensureArray(project?.propertyImageUrls);
  
  const carouselImages = useMemo(() => {
    return combinedPhotos.map(p => typeof p === 'string' ? p : p.url);
  }, [combinedPhotos]);

  const landownerImages = useMemo(() => {
    return landownerPhotos.map(p => typeof p === 'string' ? p : p.url);
  }, [landownerPhotos]);

  // Shapefiles
  const activeCarbonShapefiles = ensureArray(project?.activeCarbonShapefiles);
  const shapefileSummary =
    activeCarbonShapefiles.length > 0
      ? `${activeCarbonShapefiles.length} file${activeCarbonShapefiles.length === 1 ? "" : "s"} available`
      : "No shape files uploaded yet";

  const handleDownloadShapeFiles = () => {
    if (!activeCarbonShapefiles.length) return;
    activeCarbonShapefiles.forEach((url) => {
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const resolvedDocumentSlots = useMemo(() => DOCUMENT_SLOTS.map((slot) => {
    const primary = ensureArray(project?.documents?.[slot.key] || []);
    const fallback = slot.fallbackField
      ? ensureArray(project?.[slot.fallbackField])
      : [];
    return {
      ...slot,
      files: primary.length > 0 ? primary : fallback,
    };
  }), [project]);

  // --- Display Fields Definitions ---

  const primaryContactName = ensureText(
    project?.ownerDisplayName || project?.ownerFirstName || project?.landowner
  );
  
  // Wait until project is loaded to calculate these safely
  const statusValueClass = project?.status === "Active"
      ? "text-green-600 bg-green-50 border-green-200"
      : project?.status === "Completed"
      ? "text-blue-600 bg-blue-50 border-blue-200"
      : "text-gray-700 bg-gray-100 border-gray-200";

  // --- Render Loading/Error ---

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-500" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-6 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold text-red-600">
          Error Loading Project
        </h2>
        <p className="mb-6 text-gray-600">{error}</p>
        <button
          onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/landowner/dashboard")}
          className="mx-auto mt-6 flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!project) {
    return <div className="p-8 text-center">Project data not found.</div>;
  }

  // --- More Field Definitions (Safe now that project exists) ---
  const primaryContactPhone = project.phone || project.contact?.phone || "";
  const sanitizedPhoneHref = primaryContactPhone
    ? `tel:${primaryContactPhone.replace(/[^+\d]/g, "")}`
    : undefined;

  const associatedMemberFields = [
    {
      label: "Owner First Name or Organization",
      value: ensureText(project.ownerFirstName || project.landowner),
    },
    {
      label: "Owner Last Name or Site Name",
      value: ensureText(project.ownerDisplayName || project.landowner),
    },
    {
      label: "Email",
      value: project.email || project.contact?.email || "",
      href: project.email || project.contact?.email
        ? `mailto:${project.email || project.contact.email}`
        : undefined,
    },
    {
      label: "Secondary Emails",
      value: ensureText(project.secondaryEmails, "None"),
      placeholder: "None",
    },
    {
      label: "Phone",
      value: ensureText(primaryContactPhone, "Not provided"),
      href: sanitizedPhoneHref,
    },
  ];

  const activityDateFields = [
    {
      label: "Application Date",
      value: project.applicationDate ? formatDate(project.applicationDate) : "",
      placeholder: "Not recorded",
    },
    {
      label: "Consultation Date",
      value: project.consultationDate ? formatDate(project.consultationDate) : "",
      placeholder: "Not recorded",
    },
    {
      label: "Flagging Date",
      value: project.flaggingDate ? formatDate(project.flaggingDate) : "",
      placeholder: "Not recorded",
    },
    {
      label: "Planting Date",
      value: project.plantingDate ? formatDate(project.plantingDate) : "",
      placeholder: "Not recorded",
    },
  ];

  const quizScoreFields = [
    {
      label: "Quiz Score - Pre-consult",
      value: ensureText(project.quizScorePreConsultation, "Not recorded"),
      placeholder: "Not recorded",
    },
    {
      label: "Quiz Date - Pre-consult",
      value: project.quizDatePre ? formatDate(project.quizDatePre) : "",
      placeholder: "Not recorded",
    },
    {
      label: "Quiz Score - Post-planting",
      value: ensureText(project.quizScorePostPlanting, "Not recorded"),
      placeholder: "Not recorded",
    },
  ];

  const hasQuizScores = quizScoreFields.some(
    (field) => field.value && field.value !== "Not recorded"
  );

  const statusFields = [
    {
      label: "Status",
      value: project.status || "N/A",
      valueClassName: statusValueClass,
      placeholder: "N/A",
    },
    {
      label: "Season",
      value: project.seasonYear || "N/A",
      placeholder: "N/A",
    },
    {
      label: "Overview Status",
      value: project.participationStatus || "N/A",
      placeholder: "N/A",
    },
    {
      label: "Program",
      value: project.program || "N/A",
      placeholder: "N/A",
    },
  ];

  const acreageFields = [
    {
      label: "Wetland Acres",
      value: ensureText(project.wetlandAcres, "Not recorded"),
      placeholder: "Not recorded",
    },
    {
      label: "Upland Acres",
      value: ensureText(project.uplandAcres, "Not recorded"),
      placeholder: "Not recorded",
    },
    {
      label: "Total Acres",
      value: ensureText(project.totalAcres, "Not recorded"),
      placeholder: "Not recorded",
    },
    {
      label: "Wetland Trees",
      value: ensureText(project.wetlandTrees, "Not recorded"),
      placeholder: "Not recorded",
    },
    {
      label: "Upland Trees",
      value: ensureText(project.uplandTrees, "Not recorded"),
      placeholder: "Not recorded",
    },
    {
      label: "Total Trees",
      value: ensureText(project.totalTrees, "Not recorded"),
      placeholder: "Not recorded",
    },
  ];

  // ==================== Render ====================
  return (
    <div className="bg-gray-50">
      {isAdmin && (
      <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center text-sm text-gray-600 transition hover:text-gray-800"
            title={
              project?.seasonYear
                ? `Back to Season ${project.seasonYear}`
                : "Back to Dashboard"
            }
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </button>
        </div>
      </div>
      )}

      {/* Landowner Project Selector */}
      {!isAdmin && landownerProjects.length > 1 && (
        <ProjectSelector 
            projects={landownerProjects}
            currentProjectId={projectId}
            onSelectProject={handleSelectProject}
        />
      )}

      {/* Quiz Completion Banner for Landowners */}
      {!isAdmin && !project.quizScorePreConsultation && (
        <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mx-auto max-w-7xl">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">It looks like you haven't taken the quiz!</p>
              <p className="mt-1">
                Please take it here:{" "}
                <a
                  href="https://form.jotform.com/221146225833147"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-blue-900"
                >
                  Pre-Consultation Quiz
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 space-y-10">
        
        {error && (
          <div className="mb-4 flex items-center justify-center rounded-lg bg-red-100 p-3 text-center text-red-500 shadow-sm">
            <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                Planting Photos & Before Photos
                <span className="ml-2 font-normal text-xs text-gray-400">
                  (Click to view)
                </span>
              </p>
              {carouselImages.length > 0 ? (
                <Carousel
                  images={carouselImages}
                  className="mb-4 lg:mb-6"
                  aspectClass="aspect-[4/3] lg:aspect-[3/2]"
                  onImageClick={openLightbox}
                />
              ) : (
                <div className="mb-4 lg:mb-6 relative">
                  <div className="flex aspect-[4/3] lg:aspect-[3/2] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 shadow-sm">
                    <ImageIcon className="mb-2 h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium">No photos available</p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <PhotoUploadButton
                  label="Upload Planting Photo"
                  slotKey="plantingPhotoUrls"
                  onUpload={initiatePhotoUpload}
                  isUploading={photoUploadState.key === "plantingPhotoUrls"}
                />
                <PhotoUploadButton
                  label="Upload Before Photo"
                  slotKey="beforePhotoUrls"
                  onUpload={initiatePhotoUpload}
                  isUploading={photoUploadState.key === "beforePhotoUrls"}
                />
              </div>
              {photoUploadState.error &&
                ["plantingPhotoUrls", "beforePhotoUrls"].includes(photoUploadState.errorSlot) && (
                  <p className="text-xs text-red-600">{photoUploadState.error}</p>
                )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                Landowner Submissions
                <span className="ml-2 font-normal text-xs text-gray-400">
                  (Click to view)
                </span>
              </p>
              {landownerPhotos.length > 0 ? (
                <Carousel
                  images={landownerImages}
                  className="mb-4 lg:mb-6"
                  aspectClass="aspect-[4/3] lg:aspect-[3/2]"
                  onImageClick={openLightbox}
                />
              ) : (
                <div className="mb-4 lg:mb-6 relative">
                   <div className="flex aspect-[4/3] lg:aspect-[3/2] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 shadow-sm">
                      <ImageIcon className="mb-2 h-10 w-10 opacity-50" />
                      <p className="text-sm font-medium">No landowner submissions yet</p>
                   </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <PhotoUploadButton
                  label="Upload Landowner Submission"
                  slotKey="propertyImageUrls"
                  onUpload={initiatePhotoUpload}
                  isUploading={photoUploadState.key === "propertyImageUrls"}
                />
              </div>
              {photoUploadState.error && photoUploadState.errorSlot === "propertyImageUrls" && (
                <p className="text-xs text-red-600">{photoUploadState.error}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-gray-600">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {primaryContactName}
              </h1>
              {project?.status && (
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${statusValueClass}`}
                >
                  {project.status}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 flex-shrink-0" />
              <span>{project.address || "No property address recorded"}</span>
            </div>
            {project.location && (
              <div className="flex items-center">
                <span className="ml-7">{project.location}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <InfoCard title="Associated Members">
              <div className="mb-1 flex items-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {primaryContactName}
                  </p>
                  <p className="text-sm text-gray-500">Primary Contact</p>
                </div>
              </div>
              {associatedMemberFields.map(({ label, value, href }) => (
                <InfoField
                  key={label}
                  label={label}
                  value={value}
                  href={href}
                />
              ))}
            </InfoCard>

            <InfoCard title="Activity Dates">
              {activityDateFields.map(({ label, value, placeholder }) => (
                <InfoField
                  key={label}
                  label={label}
                  value={value}
                  placeholder={placeholder}
                />
              ))}
            </InfoCard>

            {(hasQuizScores || !quizScoreFields.every((f) => !f.value)) && (
              <InfoCard title="Quiz Scores">
                {quizScoreFields.map(({ label, value, placeholder }) => (
                  <InfoField
                    key={label}
                    label={label}
                    value={value}
                    placeholder={placeholder}
                  />
                ))}
              </InfoCard>
            )}

            <InfoCard title="Project Status">
              {statusFields.map(
                ({ label, value, valueClassName, placeholder }) => (
                  <InfoField
                    key={label}
                    label={label}
                    value={value}
                    valueClassName={valueClassName}
                    placeholder={placeholder}
                  />
                )
              )}
            </InfoCard>

            <InfoCard title="Acreage & Trees">
              {acreageFields.map(({ label, value, placeholder }) => (
                <InfoField
                  key={label}
                  label={label}
                  value={value}
                  placeholder={placeholder}
                />
              ))}
            </InfoCard>

            <InfoCard
              title="Active Carbon Shapefiles"
              bodyClassName="space-y-4"
            >
              <InfoField label="Availability" value={shapefileSummary} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadShapeFiles}
                  disabled={!activeCarbonShapefiles.length}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 ${
                    activeCarbonShapefiles.length
                      ? "border-green-600/30 bg-green-600 text-white shadow-sm shadow-green-500/20 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
                      : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 shadow-none"
                  }`}
                >
                  Download All
                </button>
                {activeCarbonShapefiles.map((url, idx) => (
                  <a
                    key={`${url}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    File {idx + 1}
                  </a>
                ))}
              </div>
            </InfoCard>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">What should I expect?</h2>
          <p className="mt-1 text-sm text-gray-500">
            Seasonal timeline to help landowners prep for each stage.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {TIMELINE_PHASES.map((phase) => (
              <div
                key={phase.title}
                className="rounded-xl bg-green-50/50 p-5 border border-green-100"
              >
                <h3 className="text-base font-semibold text-green-900 mb-3">
                  {phase.title}
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  {phase.points.map((point, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Associated Documents
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Keep carbon paperwork and mapping artifacts together with each project.
          </p>
          {(docUploadState.error || docDeleteState.error) && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {docUploadState.error || docDeleteState.error}
            </div>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {resolvedDocumentSlots.map((slot) => (
              <DocumentTile
                key={slot.key}
                slot={slot}
                files={slot.files}
                onUpload={handleDocumentUpload}
                onUploadWithComment={handleDraftMapUploadWithComment}
                onDelete={handleDocumentDelete}
                onReplaceAtIndex={handleDocumentReplaceAtIndex}
                onDeleteAtIndex={handleDocumentDeleteAtIndex}
                onEdit={handleDocumentEdit}
                isUploading={docUploadState.key === slot.key}
                isDeleting={docDeleteState.key === slot.key}
                isAdmin={isAdmin}
                comments={null} // COMMENTED OUT: slot.key === 'draftMap' ? project?.draftMapComments : null
                onAddComment={openStandaloneCommentModal}
                draftMapApproved={project?.draftMapApproved ?? false}
                finalMapApproved={project?.finalMapApproved ?? false}
                onApproveMap={handleApproveMap}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Photo Gallery
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quick view thumbnails from each photo set.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  Planting Photos & Before Photos
                  <span className="ml-2 font-normal text-xs text-gray-400">
                    (Click to view)
                  </span>
                </p>
                <span className="text-xs text-gray-500">
                  {combinedPhotos.length} photo{combinedPhotos.length === 1 ? "" : "s"}
                </span>
              </div>
              {combinedPhotos.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {combinedPhotos.map((photo, idx) => (
                    <MediaGridItem
                      key={`${typeof photo === 'string' ? photo : photo.url}-${idx}`}
                      photo={photo}
                      idx={idx}
                      openLightbox={openLightbox}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
                  No planting or before photos
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  Landowner Submissions
                  <span className="ml-2 font-normal text-xs text-gray-400">
                    (Click to view)
                  </span>
                </p>
                <span className="text-xs text-gray-500">
                  {landownerPhotos.length} photo{landownerPhotos.length === 1 ? "" : "s"}
                </span>
              </div>
              {landownerPhotos.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {landownerPhotos.map((photo, idx) => (
                    <MediaGridItem
                      key={`${typeof photo === 'string' ? photo : photo.url}-${idx}`}
                      photo={photo}
                      idx={idx}
                      openLightbox={openLightbox}
                    />
                  ))}
                </div>
              ) : (
                 <div className="mt-3 flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
                   No landowner submissions
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMMENTED OUT - Draft Map Comments field doesn't exist in Airtable
      <DraftMapCommentModal 
        isOpen={isCommentModalOpen}
        onClose={handleCommentModalClose}
        onSubmit={handleAddComment}
        isSubmitting={isSubmittingComment}
        mode={commentModalMode}
        fileName={pendingDraftMapUpload?.name}
      />
      */}

      <DateSelectionModal
        isOpen={!!pendingPhotoUpload}
        onClose={handleDateCancel}
        onConfirm={handleDateConfirm}
        displayName="this photo"
      />

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-700 shadow-md transition hover:bg-white"
            >
              Close
            </button>
            <img
              src={lightboxImage}
              alt="Selected project media"
              className="max-h-[85vh] w-full object-contain bg-black"
            />
          </div>
        </div>
      )}

      {/* PDF Editor Modal */}
      {pdfEditorState.isOpen && (
        <PdfEditor
          pdfUrl={pdfEditorState.pdfUrl}
          isPdf={pdfEditorState.isPdf}
          onSave={handlePdfEditorSave}
          onCancel={handlePdfEditorCancel}
          requireComment={!isAdmin && pdfEditorState.documentType === 'draftMap'}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
