/**
 * SeasonProjectList Page
 *
 * Displays a list of projects associated with a specific season (year).
 *
 * Features:
 * - Fetches projects for the selected season from the backend
 * - Provides client-side searching/filtering of projects
 * - Handles navigation back to the dashboard
 * - Manages loading and error states for project fetching
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; // Ensure Link is imported
import { ArrowLeft, FolderOpen, Plus, AlertCircle } from 'lucide-react';
import apiService from '../../../services/apiService';
import ProjectCard from '../components/ProjectCard';
import SearchBar from '../../../components/ui/SearchBar';

/**
 * Main SeasonProjectList Component
 * @returns {JSX.Element} The rendered list of projects for a season
 */
const SeasonProjectList = () => {
  // --- Helpers ---
  const normalizeSeasonKey = (value) =>
    String(value ?? "").trim();

  // --- Router Hooks & Param Processing ---
  const { seasonYear } = useParams();
  const normalizedSeasonYear = normalizeSeasonKey(seasonYear);
  const navigate = useNavigate();
  const location = useLocation();

  // Parse expected count from navigation state (if available) for validation
  const rawExpectedCount = location.state?.expectedProjectCount;
  const expectedProjectCount = Number.isFinite(Number(rawExpectedCount))
    ? Number(rawExpectedCount)
    : null;

  // --- State ---
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Overview Status filters (Upcoming, Active, Planting Complete, Replant checked by default; Inactive unchecked)
  const [statusFilters, setStatusFilters] = useState({
    Upcoming: true,
    Active: true,
    'Planting Complete': true,
    Replant: true,
    Inactive: false
  });

  // --- Effects ---

  /**
   * Fetch projects when the seasonYear changes.
   * Handles cache validation using expectedProjectCount to potentially force a refresh.
   */
  useEffect(() => {
    // console.log(`[SeasonProjectList - Restored] useEffect triggered. Season: ${seasonYear}`);
    const fetchProjects = async () => {
      // Validate season year
      if (!normalizedSeasonYear) {
        console.error("[SeasonProjectList - Restored] Season year is undefined or invalid in params.");
        setError("Season year not specified in URL.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setProjects([]);

      try {
        console.log(`[SeasonProjectList - Restored] Calling API for season: ${normalizedSeasonYear}`);
        let seasonProjects = await apiService.getProjectsBySeason(normalizedSeasonYear);
        console.log(`[SeasonProjectList - Restored] API returned ${seasonProjects?.length ?? 0} projects for ${normalizedSeasonYear}.`);

        // Cache Validation Logic:
        // If we expect projects (from dashboard count) but get 0, assume stale cache and force refresh.
        const expectedCount = typeof expectedProjectCount === 'number' ? expectedProjectCount : null;
        if (
          expectedCount !== null &&
          expectedCount > 0 &&
          (seasonProjects?.length ?? 0) === 0
        ) {
          console.warn(
            `[SeasonProjectList] Expected roughly ${expectedCount} projects for ${normalizedSeasonYear}, but cache returned 0. Forcing a refresh.`
          );
          seasonProjects = await apiService.getProjectsBySeason(normalizedSeasonYear, { forceFresh: true });
          console.log(
            `[SeasonProjectList] Forced refresh returned ${seasonProjects?.length ?? 0} projects for ${normalizedSeasonYear}.`
          );
        }

        setProjects(seasonProjects || []);
      } catch (err) {
        console.error(`[SeasonProjectList - Restored] Failed to fetch projects for season ${normalizedSeasonYear}:`, err);
        setError(`Could not load projects for season ${normalizedSeasonYear}. Please try again.`);
        setProjects([]);
      } finally {
        setLoading(false);
         console.log(`[SeasonProjectList - Restored] Finished loading data for ${normalizedSeasonYear}. Loading state: false`);
      }
    };

    fetchProjects();
  }, [normalizedSeasonYear, expectedProjectCount]);

  // --- Computed Values ---

  /**
   * Filter projects based on the search term and status filters.
   * Checks multiple fields: name, address, landowner, location, zip, site number.
   */
  const searchValue = searchTerm.toLowerCase();
  const filteredProjects = projects.filter((project) => {
    // First filter by Overview Status checkboxes
    const participationStatus = project.participationStatus || '';
    const isStatusMatch = statusFilters[participationStatus] === true;
    
    if (!isStatusMatch) {
      return false;
    }
    
    // Then filter by search term
    if (!searchTerm) {
      return true;
    }
    
    const nameCandidate =
      project.ownerDisplayName ||
      project.ownerFirstName ||
      project.landowner ||
      "";
    const normalizedName = nameCandidate.toLowerCase();
    const normalizedAddress = (project.address || "").toLowerCase();
    const normalizedLandowner = (project.landowner || "").toLowerCase();
    const normalizedLocation = (project.location || "").toLowerCase();
    const normalizedZip = (project.zipCode || "").toLowerCase();
    const normalizedSiteNumber = String(project.siteNumber || "").toLowerCase();

    return (
      normalizedName.includes(searchValue) ||
      normalizedAddress.includes(searchValue) ||
      normalizedLandowner.includes(searchValue) ||
      normalizedLocation.includes(searchValue) ||
      normalizedZip.includes(searchValue) ||
      normalizedSiteNumber.includes(searchValue)
    );
  });

  // Handler for status filter checkboxes
  const handleStatusFilterChange = (status) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // --- Render Helpers ---

  /**
   * Renders the main content area based on state (loading, error, empty, or list).
   */
  const renderContent = () => {
    console.log(`[SeasonProjectList - Restored] renderContent called. Loading: ${loading}, Error: ${!!error}, Projects Found: ${projects.length}, Filtered Count: ${filteredProjects.length}`);
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className='ml-4 text-gray-600'>Loading projects...</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg flex items-center justify-center shadow-sm">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /> {error}
            </div>
        );
    }

     if (!loading && projects.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm p-8">
          <FolderOpen size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="font-medium text-lg">No projects found for the {normalizedSeasonYear || seasonYear} season.</p>
          {/* --- REMOVED DUPLICATE BUTTON --- */}
          <p className="text-sm mt-1 mb-4">You can add a new project to this season using the button above.</p>
          {/* <button ... >Add Project to {seasonYear}</button> <-- REMOVED */}
        </div>
      );
    }

    if (filteredProjects.length === 0 && searchTerm) {
        return <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm p-8">No projects match your search term "{searchTerm}" for this season.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <>
       {/* Header */}
       <div className="mb-8">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            {/* Back Button and Title */}
            <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-semibold">
                  Projects for Season {normalizedSeasonYear || seasonYear}
                </h1>
            </div>
         </div>
          {/* Search Bar */}
          <div className="mt-6">
              <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder={`Search by name, site #, loc, or zip within ${normalizedSeasonYear || seasonYear || ''}...`}
              />
          </div>
          {/* Status Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by Overview Status:</span>
            {Object.keys(statusFilters).map((status) => (
              <label key={status} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilters[status]}
                  onChange={() => handleStatusFilterChange(status)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{status}</span>
              </label>
            ))}
          </div>
       </div>

        {/* Project Grid Area */}
        {renderContent()}
    </>
  );
};

export default SeasonProjectList;
