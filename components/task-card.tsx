"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MessageSquare, MoreVertical, Trash2 } from "lucide-react";

interface Assignee {
  _id: string;
  name: string;
  email: string;
}

import { TaskStatus } from "@/lib/enums";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: {
    _id: string;
    name: string;
    email: string;
  };
  project: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: (taskId: string) => void;
}

const statusConfig = {
  [TaskStatus.OPEN]: {
    label: "Open",
    dotColor: "bg-slate-500",
    badgeVariant: "secondary" as const,
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    dotColor: "bg-blue-500",
    badgeVariant: "default" as const,
  },
  [TaskStatus.ON_HOLD]: {
    label: "On Hold",
    dotColor: "bg-amber-500",
    badgeVariant: "outline" as const,
  },
  [TaskStatus.CLOSED]: {
    label: "Closed",
    dotColor: "bg-emerald-500",
    badgeVariant: "secondary" as const,
  },
};

function getInitials(name: string, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
  const status = statusConfig[task.status] || statusConfig[TaskStatus.OPEN];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm("Delete this task and all its comments?")) {
      onDelete(task._id);
    }
  };

  return (
    <Card
      className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Left colored bar */}
          <div className={`w-1 ${status.dotColor}`} />
          
          {/* Main content */}
          <div className="flex-1 p-4">
            <div className="flex items-start gap-4">
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
              variant={status.badgeVariant}
              className="flex items-center gap-1.5 font-medium"
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`}
              />
              {status.label}
            </Badge>
                </div>
                <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(task.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" />
                    <span>Comments</span>
                  </div>
                </div>
              </div>

              {/* Right side - Assignee & Menu */}
              <div className="flex items-center gap-2 shrink-0">
                {task.assignee ? (
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      {getInitials(task.assignee.name, task.assignee.email)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50">
                    <span className="text-[10px] text-muted-foreground font-medium">?</span>
                  </div>
                )}
                {onDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
