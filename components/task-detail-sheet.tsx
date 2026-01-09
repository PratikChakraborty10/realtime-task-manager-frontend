"use client";

import { useState, useEffect, FormEvent, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  User,
  Send,
  Loader2,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/auth-context";
import { useCommentUpdates } from "@/hooks/useSocket";
import type { Task } from "@/components/task-card";
import type { Member } from "@/components/project-card";

interface Comment {
  _id: string;
  content: string;
  task: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CommentsResponse {
  success: boolean;
  comments: Comment[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

interface TaskDetailSheetProps {
  task: Task | null;
  projectId: string;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Note: TaskUpdateResponse, CommentAddResponse, DeleteResponse interfaces removed
// since we no longer process API responses locally - WebSocket handles all updates

const statusConfig: Record<Task["status"], { label: string; dotColor: string }> = {
  OPEN: { label: "Open", dotColor: "bg-slate-500" },
  IN_PROGRESS: { label: "In Progress", dotColor: "bg-blue-500" },
  ON_HOLD: { label: "On Hold", dotColor: "bg-amber-500" },
  CLOSED: { label: "Closed", dotColor: "bg-emerald-500" },
};

function getInitials(name: string, email: string): string {
  if (name)
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email[0].toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskDetailSheet({
  task,
  projectId,
  members,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { fetchData } = useFetch();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadComments = useCallback(async () => {
    if (!task) return;
    setIsLoadingComments(true);
    const response = (await fetchData(
      `/api/tasks/${task._id}/comments?limit=50`
    )) as CommentsResponse | null;
    if (response?.success) {
      setComments(response.comments);
    }
    setIsLoadingComments(false);
  }, [task, fetchData]);

  useEffect(() => {
    if (open && task) {
      loadComments();
    } else {
      setComments([]);
      setNewComment("");
    }
  }, [open, task, loadComments]);

  // Scroll to bottom when comments load
  useEffect(() => {
    if (comments.length > 0) {
      scrollToBottom();
    }
  }, [comments]);

  // Real-time comment updates via WebSocket
  useCommentUpdates(open && task ? task._id : null, {
    onCommentCreated: (comment) => {
      setComments((prev) => [...prev, comment]);
      setTimeout(scrollToBottom, 100);
    },
    onCommentUpdated: (comment) => {
      setComments((prev) =>
        prev.map((c) => (c._id === comment._id ? comment : c))
      );
    },
    onCommentDeleted: (commentId) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    },
  });

  const handleStatusChange = async (status: Task["status"]) => {
    if (!task) return;
    setIsUpdating(true);
    // Just make the API call - WebSocket task:updated will sync the change
    await fetchData(
      `/api/projects/${projectId}/tasks/${task._id}`,
      { method: "PATCH", body: JSON.stringify({ status }) }
    );
    setIsUpdating(false);
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!task) return;
    setIsUpdating(true);
    // Just make the API call - WebSocket task:updated will sync the change
    await fetchData(
      `/api/projects/${projectId}/tasks/${task._id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          assignee: assigneeId === "unassigned" ? null : assigneeId,
        }),
      }
    );
    setIsUpdating(false);
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;
    setIsSubmittingComment(true);
    // Just make the API call - WebSocket comment:created will sync the change
    await fetchData(`/api/tasks/${task._id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: newComment.trim() }),
    });
    setNewComment("");
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    // Just make the API call - WebSocket comment:deleted will sync the change
    await fetchData(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
  };

  if (!task) return null;

  const status = statusConfig[task.status];
  const assignee = task.assignee;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b space-y-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="flex items-center gap-1.5 text-xs font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
              {status.label}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-semibold leading-tight pr-8">
            {task.title}
          </SheetTitle>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.createdAt)}
            </span>
            {task.createdBy && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.createdBy.name || task.createdBy.email}
              </span>
            )}
          </div>
        </SheetHeader>

        {/* Status & Assignee - Compact inline row */}
        <div className="px-5 py-3 border-b flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select
              value={task.status}
              onValueChange={(v) => handleStatusChange(v as Task["status"])}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground">Assignee</span>
            <Select
              value={assignee?._id || "unassigned"}
              onValueChange={handleAssigneeChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comments Section - Takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Comments Header */}
          <div className="px-5 py-3 border-b flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Comments</span>
            <Badge variant="secondary" className="text-xs ml-1">
              {comments.length}
            </Badge>
          </div>

          {/* Scrollable Comments List */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {isLoadingComments ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
                <p className="text-xs text-muted-foreground/70">Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3 group">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {getInitials(comment.createdBy.name, comment.createdBy.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {comment.createdBy.name || comment.createdBy.email}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(comment.createdAt)}
                        </span>
                        {user?.id === comment.createdBy._id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

          {/* Fixed Comment Input */}
          <form onSubmit={handleAddComment} className="px-5 py-3 border-t flex items-center gap-2 bg-background">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                {user?.name ? getInitials(user.name, user.email || "") : "?"}
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 h-8 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={isSubmittingComment || !newComment.trim()}
            >
              {isSubmittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
