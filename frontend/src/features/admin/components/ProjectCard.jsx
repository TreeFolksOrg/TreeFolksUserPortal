import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

/**
 * ProjectCard - Displays a summary of a project
 * 
 * Shows site number, address, owner, overview status, program, and current status with a link to the detailed view.
 * 
 * @param {object} props
 * @param {object} props.project - Project data object
 */
const ProjectCard = ({ project }) => {
  const displayName =
    project.ownerDisplayName ||
    project.ownerFirstName ||
    project.landowner ||
    "Untitled Project";

  // Badge styling helper for Overview Status (Active, Planting Complete, Replant)
  const getOverviewStatusBadgeColor = (overviewStatus) => {
    const statusLower = (overviewStatus || '').toLowerCase();
    if (statusLower.includes('planting complete')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('active')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('replant')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getProgramBadgeColor = (program) => {
    const programLower = (program || '').toLowerCase();
    if (programLower.includes('ctfrp')) return 'bg-purple-100 text-purple-800';
    if (programLower.includes('rooted')) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header with badges */}
        <div className="flex flex-col gap-2">
          <h3 className="font-medium text-lg text-gray-900">{displayName}</h3>
          <div className="flex flex-wrap gap-2">
            {/* Overview Status badge (colored) */}
            {project.participationStatus && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${getOverviewStatusBadgeColor(project.participationStatus)}`}>
                {project.participationStatus}
              </span>
            )}
            {/* Program badge (colored) */}
            {project.program && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${getProgramBadgeColor(project.program)}`}>
                {project.program}
              </span>
            )}
            {/* Current Status badge (simple gray) */}
            {project.status && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                {project.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm text-gray-500">
          <div className="font-medium text-gray-700">
            {project.siteNumber !== undefined && project.siteNumber !== null && project.siteNumber !== ""
              ? `Site #${project.siteNumber}` 
              : "Site Number Not Found"}
          </div>
          <div className="flex items-start">
             <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
             <span>
               {[project.location, project.address, project.zipCode].filter(Boolean).join(", ") || "No address provided"}
             </span>
          </div>
        </div>

        <div className="pt-2 mt-auto">
          <Link
            to={`/admin/project/${project.id}`}
            className="flex w-full items-center justify-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
