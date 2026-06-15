/**
 * AdminDashboard Page
 *
 * The main landing page for the admin interface.
 * Displays a dashboard of reforestation seasons and their project counts.
 *
 * Features:
 * - Fetches and aggregates project data by season
 * - Displays seasons in a grid of cards
 * - Provides search functionality to filter seasons by year
 */

import { useState, useEffect, useCallback } from "react";

import SeasonCard from "../components/SeasonCard";
import SearchBar from "../../../components/ui/SearchBar";

import apiService from "../../../services/apiService";
import { AlertCircle } from "lucide-react";

/**
 * Main AdminDashboard Component
 * @returns {JSX.Element} The rendered dashboard
 */
const AdminDashboard = () => {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching ---
  /**
   * Loads and aggregates dashboard data.
   * Fetches seasons, then fetches projects for each season to calculate counts.
   */
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get list of season years
      const seasonYears = await apiService.getSeasons();
      const uniqueSeasonYears = [...new Set(seasonYears)].filter(Boolean);

      if (uniqueSeasonYears.length === 0) {
        setSeasons([]);
        return;
      }

      // 2. Fetch projects for each season to get counts
      // Note: This could be optimized by a backend endpoint that returns counts directly
      const seasonProjects = await Promise.all(
        uniqueSeasonYears.map(async (year) => {
          const projectsForSeason = await apiService.getProjectsBySeason(year);
          return {
            year,
            projects: projectsForSeason,
          };
        })
      );

      // 3. Normalize and sort data (newest year first)
      // Exclude Inactive projects from the count
      const normalizedSeasons = seasonProjects
        .map(({ year, projects }) => ({
          id: year,
          year,
          projectCount: projects.filter(p => p.participationStatus !== 'Inactive').length,
        }))
        .sort((a, b) => b.year.localeCompare(a.year));

      setSeasons(normalizedSeasons);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err?.message || "Could not load data. Please try again later.");
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);


  // Filter seasons based on search input
  const filteredSeasons = seasons.filter((season) => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    if (!lowerSearch) {
      return true;
    }
    return season.year.toLowerCase().includes(lowerSearch);
  });

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-[calc(100vh-240px)] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center rounded-lg bg-red-100 p-4 text-red-600 shadow-sm">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      );
    }

    if (seasons.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm p-8">
          No seasons found.
        </div>
      );
    }

    if (filteredSeasons.length === 0 && searchTerm) {
      return (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm p-8">
          No seasons match your search term "{searchTerm}".
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSeasons.map((season) => (
            <SeasonCard
              key={season.id}
              season={season}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Header & Search */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold mb-2">Your Reforestation Seasons</h1>
          </div>
        </div>

        <div className="mt-6">
          <SearchBar
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search seasons by year..."
          />
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

    </>
  );
};

export default AdminDashboard;
