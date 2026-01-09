"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  FolderOpen,
  CheckSquare,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { ProjectStatus, TaskStatus } from "@/lib/enums";

interface SearchProject {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  matchedOn: string;
}

interface SearchTask {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  project: { _id: string; name: string };
  matchedOn: string;
}

interface SearchComment {
  _id: string;
  content: string;
  task: { _id: string; title: string };
  project: { _id: string; name: string };
  createdAt: string;
  matchedOn: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  results: {
    projects: SearchProject[];
    tasks: SearchTask[];
    comments: SearchComment[];
  };
  totalCount: number;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const { fetchData } = useFetch<SearchResponse>();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse["results"] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults(null);
      setTotalCount(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setTotalCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const response = await fetchData(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response?.success) {
        setResults(response.results);
        setTotalCount(response.totalCount);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchData]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleProjectClick = useCallback((projectId: string) => {
    onOpenChange(false);
    router.push(`/projects/${projectId}`);
  }, [router, onOpenChange]);

  const handleTaskClick = useCallback((projectId: string, taskId: string) => {
    onOpenChange(false);
    router.push(`/projects/${projectId}?task=${taskId}`);
  }, [router, onOpenChange]);

  const handleCommentClick = useCallback((projectId: string, taskId: string) => {
    onOpenChange(false);
    router.push(`/projects/${projectId}?task=${taskId}`);
  }, [router, onOpenChange]);

  const hasResults = results && (
    results.projects.length > 0 ||
    results.tasks.length > 0 ||
    results.comments.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            placeholder="Search projects, tasks, and comments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 px-0"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground mr-6">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Start typing to search across all your projects
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="py-2">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div className="px-2 py-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Projects ({results.projects.length})
                  </p>
                  {results.projects.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => handleProjectClick(project._id)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-muted transition-colors text-left group"
                    >
                      <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {project.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div className="px-2 py-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tasks ({results.tasks.length})
                  </p>
                  {results.tasks.map((task) => (
                    <button
                      key={task._id}
                      onClick={() => handleTaskClick(task.project._id, task._id)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-muted transition-colors text-left group"
                    >
                      <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          in {task.project.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {task.status.replace("_", " ")}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {/* Comments */}
              {results.comments.length > 0 && (
                <div className="px-2 py-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Comments ({results.comments.length})
                  </p>
                  {results.comments.map((comment) => (
                    <button
                      key={comment._id}
                      onClick={() => handleCommentClick(comment.project._id, comment.task._id)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-muted transition-colors text-left group"
                    >
                      <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">&quot;{comment.content}&quot;</p>
                        <p className="text-xs text-muted-foreground truncate">
                          on {comment.task.title} • {comment.project.name}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {/* Total Count */}
              <div className="px-4 py-2 border-t mt-2">
                <p className="text-xs text-muted-foreground text-center">
                  {totalCount} result{totalCount !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
