"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  Search,
  Settings,
  Clock,
  Users,
  ListTodo,
  FolderOpen,
} from "lucide-react";
import type { Project, Member } from "@/components/project-card";
import { TaskCard, Task } from "@/components/task-card";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { useTaskUpdates } from "@/hooks/useSocket";

interface ProjectDetailResponse {
  success: boolean;
  project: Project;
}

interface TasksResponse {
  success: boolean;
  tasks: Task[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

const statusConfig: Record<
  Project["status"],
  { label: string; dotColor: string }
> = {
  ACTIVE: { label: "Active", dotColor: "bg-emerald-500" },
  ON_HOLD: { label: "On Hold", dotColor: "bg-amber-500" },
  COMPLETED: { label: "Completed", dotColor: "bg-blue-500" },
  ARCHIVED: { label: "Archived", dotColor: "bg-gray-400" },
};

function getInitials(name: string, email: string): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email[0].toUpperCase();
}

function MembersSidebar({ members, createdBy }: { members: Member[]; createdBy: Member }) {
  return (
    <div className="w-80 shrink-0 border-l bg-muted/20">
      <div className="p-5 h-full">
        <div className="flex items-center gap-2 mb-5">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Team Members</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {members.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {members.map((member) => {
            const isOwner = member._id === createdBy._id;
            return (
              <div
                key={member._id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                    {getInitials(member.name, member.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    {isOwner && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { fetchData } = useFetch();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Track locally created task IDs to prevent duplicate adds from WebSocket
  const locallyCreatedTaskIds = useRef<Set<string>>(new Set());

  const loadProject = useCallback(async () => {
    const response = (await fetchData(`/api/projects/${id}`)) as ProjectDetailResponse | null;
    if (response?.success) {
      setProject(response.project);
    }
    setIsLoading(false);
  }, [fetchData, id]);

  const loadTasks = useCallback(
    async (nextCursor: string | null = null) => {
      const params = new URLSearchParams({ limit: "20" });
      if (nextCursor) params.append("cursor", nextCursor);

      const response = (await fetchData(
        `/api/projects/${id}/tasks?${params}`
      )) as TasksResponse | null;

      if (response?.success) {
        if (nextCursor) {
          setTasks((prev) => [...prev, ...response.tasks]);
        } else {
          setTasks(response.tasks);
        }
        setHasMore(response.pagination.hasMore);
        setCursor(response.pagination.nextCursor);
      }
      setIsLoadingTasks(false);
    },
    [fetchData, id]
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      loadProject();
      loadTasks();
    }
  }, [authLoading, isAuthenticated, router, loadProject, loadTasks]);

  // Filter tasks
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTasks(
        tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, tasks]);

  const handleTaskCreated = (task: Task) => {
    // Track this task ID so WebSocket doesn't add it again
    locallyCreatedTaskIds.current.add(task._id);
    setTasks((prev) => [task, ...prev]);
    // Clean up after 5 seconds
    setTimeout(() => {
      locallyCreatedTaskIds.current.delete(task._id);
    }, 5000);
  };

  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
    // Update selected task if it's the one being updated
    setSelectedTask((current) =>
      current?._id === updatedTask._id ? updatedTask : current
    );
  }, []);

  // Real-time task updates via WebSocket
  useTaskUpdates(id, {
    onTaskCreated: (task) => {
      // Skip if this task was just created locally by this user
      if (locallyCreatedTaskIds.current.has(task._id)) {
        return;
      }
      // Add new task to top of list (avoid duplicates)
      setTasks((prev) => {
        if (prev.some((t) => t._id === task._id)) return prev;
        return [task, ...prev];
      });
    },
    onTaskUpdated: handleTaskUpdated,
    onTaskDeleted: (taskId) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      if (selectedTask?._id === taskId) {
        setIsSheetOpen(false);
        setSelectedTask(null);
      }
    },
  });

  const handleTaskDeleted = async (taskId: string) => {
    const response = await fetchData(`/api/projects/${id}/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (response) {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      if (selectedTask?._id === taskId) {
        setIsSheetOpen(false);
        setSelectedTask(null);
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsSheetOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Project not found or you don&apos;t have access.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectStatus = statusConfig[project.status];

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Projects
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="font-semibold">{project.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b bg-gradient-to-b from-muted/30 to-transparent">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <Badge variant="secondary" className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${projectStatus.dotColor}`} />
                  {projectStatus.label}
                </Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground max-w-2xl">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ListTodo className="h-4 w-4" />
                  <span>{tasks.length} tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{project.members.length} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    Updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <CreateTaskDialog
              projectId={id}
              members={project.members}
              onTaskCreated={handleTaskCreated}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl h-full flex">
          {/* Task List */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-6 pr-6">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-10 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Tasks */}
              {isLoadingTasks ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-pulse text-muted-foreground">
                    Loading tasks...
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold">No tasks yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first task to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => handleTaskClick(task)}
                      onDelete={handleTaskDeleted}
                    />
                  ))}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => loadTasks(cursor)}
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Members Sidebar */}
          <MembersSidebar members={project.members} createdBy={project.createdBy} />
        </div>
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        projectId={id}
        members={project.members}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
