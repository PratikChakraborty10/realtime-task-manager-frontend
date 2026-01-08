"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/auth-context";
import { ProjectCard, Project } from "@/components/project-card";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Plus, Search, SlidersHorizontal } from "lucide-react";

interface ProjectsResponse {
  success: boolean;
  projects: Project[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { error, isLoading, fetchData } = useFetch<ProjectsResponse>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadProjects = useCallback(
    async (nextCursor: string | null = null) => {
      const params = new URLSearchParams({ limit: "12" });
      if (nextCursor) params.append("cursor", nextCursor);

      const response = await fetchData(`/api/projects?${params}`);

      if (response?.success) {
        if (nextCursor) {
          setProjects((prev) => [...prev, ...response.projects]);
        } else {
          setProjects(response.projects);
        }
        setHasMore(response.pagination.hasMore);
        setCursor(response.pagination.nextCursor);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated && projects.length === 0 && !isLoading) {
      loadProjects();
    }
  }, [authLoading, isAuthenticated, router, loadProjects, projects.length, isLoading]);

  // Filter projects based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProjects(
        projects.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, projects]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadProjects(cursor);
    setIsLoadingMore(false);
  };

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 && projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="text-muted-foreground mt-1">
            You are not a member of any projects
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}

            {/* Create New Project Card */}
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
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
