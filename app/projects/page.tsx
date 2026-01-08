"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/auth-context";
import { ProjectCard, Project } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";

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
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadProjects(cursor);
    setIsLoadingMore(false);
  };

  if (authLoading || (isLoading && projects.length === 0)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading projects...</div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your projects
        </p>
      </div>

      {projects.length === 0 ? (
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
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
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
