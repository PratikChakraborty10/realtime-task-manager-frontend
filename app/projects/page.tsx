"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/auth-context";
import { ProjectCard, Project } from "@/components/project-card";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Plus, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ProjectStatus } from "@/lib/enums";

const PAGE_SIZE = 10;

interface ProjectsResponse {
  success: boolean;
  projects: Project[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

interface Filters {
  status: ProjectStatus | "ALL";
  sortBy: "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}

const defaultFilters: Filters = {
  status: "ALL",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { error, isLoading, fetchData } = useFetch<ProjectsResponse>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]); // Track cursors for each page
  const [hasMore, setHasMore] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const activeFilterCount =
    (filters.status !== "ALL" ? 1 : 0) +
    (filters.sortBy !== "createdAt" || filters.sortOrder !== "desc" ? 1 : 0);

  const loadProjects = useCallback(
    async (cursor: string | null = null, currentFilters: Filters = filters) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.append("cursor", cursor);
      if (currentFilters.status !== "ALL") params.append("status", currentFilters.status);
      if (currentFilters.sortBy !== "createdAt") params.append("sortBy", currentFilters.sortBy);
      if (currentFilters.sortOrder !== "desc") params.append("sortOrder", currentFilters.sortOrder);

      const response = await fetchData(`/api/projects?${params}`);

      if (response?.success) {
        setProjects(response.projects);
        setHasMore(response.pagination.hasMore);
        
        // Store the next cursor for potential forward navigation
        if (response.pagination.nextCursor) {
          setCursorHistory((prev) => {
            const newHistory = [...prev];
            newHistory[currentPage] = response.pagination.nextCursor;
            return newHistory;
          });
        }
      }
    },
    [fetchData, filters, currentPage]
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated && !isLoading) {
      loadProjects(null, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, router]);

  const handleNextPage = async () => {
    if (!hasMore) return;
    
    setIsNavigating(true);
    const nextCursor = cursorHistory[currentPage];
    
    if (nextCursor) {
      await loadProjects(nextCursor, filters);
      setCurrentPage((prev) => prev + 1);
    }
    setIsNavigating(false);
  };

  const handlePrevPage = async () => {
    if (currentPage <= 1) return;
    
    setIsNavigating(true);
    const prevPage = currentPage - 1;
    const prevCursor = prevPage === 1 ? null : cursorHistory[prevPage - 1];
    
    await loadProjects(prevCursor, filters);
    setCurrentPage(prevPage);
    setIsNavigating(false);
  };

  const handleProjectCreated = () => {
    // Reset to first page and reload from server to ensure we have fully populated data (e.g. members keys)
    // and correct sort order
    setCurrentPage(1);
    setCursorHistory([null]);
    setProjects([]);
    loadProjects(null, filters);
  };

  const resetPagination = () => {
    setCurrentPage(1);
    setCursorHistory([null]);
  };

  const handleApplyFilters = () => {
    resetPagination();
    setProjects([]);
    loadProjects(null, filters);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    resetPagination();
    setProjects([]);
    loadProjects(null, defaultFilters);
    setFilterOpen(false);
  };

  if (authLoading || (isLoading && projects.length === 0)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading projects...
        </div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your active workstreams and track progress.
          </p>
        </div>
        <CreateProjectDialog onProjectCreated={handleProjectCreated} />
      </div>

      {/* Filter & Pagination Controls */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleResetFilters}
                    >
                      Reset all
                    </Button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters((f) => ({ ...f, status: value as Filters["status"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                      <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={ProjectStatus.ARCHIVED}>Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort by</label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters((f) => ({ ...f, sortBy: value as Filters["sortBy"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="updatedAt">Last Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) => setFilters((f) => ({ ...f, sortOrder: value as Filters["sortOrder"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Apply Button */}
                <Button className="w-full" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Filter Pills */}
          {filters.status !== "ALL" && (
            <Badge variant="secondary" className="gap-1">
              {filters.status.replace("_", " ")}
              <button
                onClick={() => {
                  const newFilters = { ...filters, status: "ALL" as const };
                  setFilters(newFilters);
                  resetPagination();
                  setProjects([]);
                  loadProjects(null, newFilters);
                }}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        {/* Pagination Controls */}
        {(projects.length > 0 || currentPage > 1) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || isNavigating}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasMore || isNavigating}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 && !isLoading && !isNavigating ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold">
            {filters.status !== "ALL" ? "No matching projects" : "No projects yet"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {filters.status !== "ALL"
              ? "Try changing your filters"
              : "You are not a member of any projects"}
          </p>
        </div>
      ) : (
        <>
          {isNavigating && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          )}
          
          {!isNavigating && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}

              {/* Create New Project Card - only on first page */}
              {currentPage === 1 && (
                <Card
                  className="h-full border-dashed border-2 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-center min-h-[200px]"
                  onClick={() => {
                    const trigger = document.querySelector(
                      "[data-create-project-trigger]"
                    ) as HTMLButtonElement;
                    trigger?.click();
                  }}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Create New Project</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start a new workstream
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Bottom Pagination (for easier navigation after scrolling) */}
          {(hasMore || currentPage > 1) && !isNavigating && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isNavigating}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore || isNavigating}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
