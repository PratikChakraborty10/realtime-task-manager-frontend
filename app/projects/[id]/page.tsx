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
import { useTaskUpdates, useProjectUpdates } from "@/hooks/useSocket";

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

import { ProjectStatus } from "@/lib/enums";

// ... existing imports ...

const statusConfig = {
  [ProjectStatus.ACTIVE]: { label: "Active", dotColor: "bg-emerald-500" },
  [ProjectStatus.ON_HOLD]: { label: "On Hold", dotColor: "bg-amber-500" },
  [ProjectStatus.COMPLETED]: { label: "Completed", dotColor: "bg-blue-500" },
  [ProjectStatus.ARCHIVED]: { label: "Archived", dotColor: "bg-gray-400" },
};

function getInitials(name: string, email: string): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email[0].toUpperCase();
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, X, Pencil, Check, Loader2, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";

interface LookedUpUser {
  _id: string;
  name: string;
  email: string;
}

function MembersSidebar({ 
  members, 
  createdBy, 
  onAddMember, 
  onRemoveMember,
  canManage 
}: { 
  members: Member[]; 
  createdBy: Member;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  canManage: boolean;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [foundUser, setFoundUser] = useState<LookedUpUser | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!email.trim()) return;
    
    setIsSearching(true);
    setError("");
    setFoundUser(null);

    try {
      const response = await fetch(`/api/users/lookup?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success && data.user) {
        // Check if user is already a member
        if (members.some(m => m._id === data.user._id)) {
          setError("This user is already a member of this project.");
        } else {
          setFoundUser(data.user);
        }
      } else {
        setError(data.message || "User not found");
      }
    } catch {
      setError("Failed to search for user");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!foundUser) return;
    setIsAdding(true);
    await onAddMember(foundUser._id);
    setIsAdding(false);
    setIsAddOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEmail("");
    setFoundUser(null);
    setError("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsAddOpen(open);
    if (!open) resetForm();
  };

  return (
    <div className="w-80 shrink-0 border-l bg-muted/20">
      <div className="p-5 h-full">
        <div className="flex items-center gap-2 mb-5">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Team Members</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {members.length}
          </Badge>
          {canManage && (
            <Dialog open={isAddOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Search for a user by their email address to add them to this project.
                  </p>
                  
                  {/* Search Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="email"
                        placeholder="Enter email address..."
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                          setFoundUser(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pr-10"
                      />
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      disabled={isSearching || !email.trim()}
                      size="icon"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SearchIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                      {error}
                    </div>
                  )}

                  {/* Found User Card */}
                  {foundUser && (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                            {getInitials(foundUser.name, foundUser.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{foundUser.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {foundUser.email}
                          </p>
                        </div>
                        <Button 
                          onClick={handleAdd} 
                          disabled={isAdding}
                          size="sm"
                          className="shrink-0"
                        >
                          {isAdding ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="space-y-2">
          {members.map((member) => {
            const isOwner = member._id === createdBy._id;
            return (
              <div
                key={member._id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-colors group"
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
                {canManage && !isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm("Remove this member?")) {
                        onRemoveMember(member._id);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
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
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editingDesc, setEditingDesc] = useState("");

  const locallyCreatedTaskIds = useRef<Set<string>>(new Set());

  const canManage = project ? (user?.id === project.createdBy._id || user?.role === "ADMIN") : false;

  const loadProject = useCallback(async () => {
    const response = (await fetchData(`/api/projects/${id}`)) as ProjectDetailResponse | null;
    if (response?.success) {
      setProject(response.project);
      setEditingName(response.project.name);
      setEditingDesc(response.project.description || "");
    }
    setIsLoading(false);
  }, [fetchData, id]);

  const updateProject = async (updates: Partial<Project>) => {
    if (!project) return;
    
    // Optimistic update
    setProject({ ...project, ...updates });

    const response = (await fetchData(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })) as { success: boolean; project: Project } | null;

    if (response?.success) {
      toast.success("Project updated");
    } else {
      toast.error("Failed to update project");
      // Revert on error
      loadProject();
    }
  };

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
    locallyCreatedTaskIds.current.add(task._id);
    setTasks((prev) => [task, ...prev]);
    setTimeout(() => {
      locallyCreatedTaskIds.current.delete(task._id);
    }, 5000);
  };

  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
    setSelectedTask((current) =>
      current?._id === updatedTask._id ? updatedTask : current
    );
  }, []);

  useTaskUpdates(id, {
    onTaskCreated: (task) => {
      if (locallyCreatedTaskIds.current.has(task._id)) return;
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

  useProjectUpdates(id, {
    onProjectUpdated: (updatedProject) => {
      setProject(updatedProject);
      toast.success("Project updated");
    },
    onMemberAdded: (member) => {
      setProject((prev) => {
        if (!prev) return prev;
        if (prev.members.some((m) => m._id === member._id)) return prev;
        return { ...prev, members: [...prev.members, member] };
      });
      toast.info(`${member.name} joined the project`);
    },
    onMemberRemoved: (memberId) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m) => m._id !== memberId),
        };
      });
      toast.info("A member was removed");
    },
  });

  const handleTaskDeleted = async (taskId: string) => {
    const response = await fetchData(`/api/projects/${id}/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (response) {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success("Task deleted");
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

  const handleAddMember = async (userId: string) => {
    const response = (await fetchData(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })) as { success: boolean; message?: string } | null;

    if (response?.success) {
      toast.success("Member added");
      loadProject(); // Reload memberships
    } else {
      toast.error(response?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const response = (await fetchData(`/api/projects/${id}/members/${userId}`, {
      method: "DELETE",
    })) as { success: boolean; message?: string } | null;

    if (response?.success) {
      toast.success("Member removed");
      // Optimistically remove
      if (project) {
        setProject({
          ...project,
          members: project.members.filter(m => m._id !== userId)
        });
      }
    } else {
      toast.error("Failed to remove member");
    }
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
            <div className="flex-1 mr-8">
              <div className="flex items-center gap-3 mb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 text-2xl font-bold w-[300px]"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        updateProject({ name: editingName });
                        setIsEditingName(false);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingName(project.name);
                        setIsEditingName(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsEditingName(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                {canManage ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge 
                        variant="secondary" 
                        className="flex items-center gap-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
                      >
                        <span className={`h-2 w-2 rounded-full ${projectStatus.dotColor}`} />
                        {projectStatus.label}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <DropdownMenuItem 
                          key={status}
                          onClick={() => updateProject({ status: status as ProjectStatus })}
                        >
                          <span className={`h-2 w-2 rounded-full mr-2 ${config.dotColor}`} />
                          {config.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${projectStatus.dotColor}`} />
                    {projectStatus.label}
                  </Badge>
                )}
              </div>

              {isEditingDesc ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={editingDesc}
                    onChange={(e) => setEditingDesc(e.target.value)}
                    className="h-8 max-w-2xl"
                    placeholder="Add a description..."
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      updateProject({ description: editingDesc });
                      setIsEditingDesc(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingDesc(project.description || "");
                      setIsEditingDesc(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="group relative">
                  <p 
                    className={`text-muted-foreground max-w-2xl ${canManage ? "cursor-pointer hover:text-foreground" : ""}`}
                    onClick={() => canManage && setIsEditingDesc(true)}
                  >
                    {project.description || (canManage ? "Add a description..." : "")}
                    {canManage && (
                      <Pencil className="h-3 w-3 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </p>
                </div>
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
          <MembersSidebar 
            members={project.members} 
            createdBy={project.createdBy} 
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            canManage={canManage}
          />
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
