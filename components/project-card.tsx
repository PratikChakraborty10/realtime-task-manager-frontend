"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  members: Member[];
  createdBy: Member;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
}

const statusConfig: Record<
  Project["status"],
  { label: string; dotColor: string; borderColor: string }
> = {
  ACTIVE: {
    label: "Active",
    dotColor: "bg-emerald-500",
    borderColor: "border-l-emerald-500",
  },
  ON_HOLD: {
    label: "On Hold",
    dotColor: "bg-amber-500",
    borderColor: "border-l-amber-500",
  },
  COMPLETED: {
    label: "Completed",
    dotColor: "bg-blue-500",
    borderColor: "border-l-blue-500",
  },
  ARCHIVED: {
    label: "Archived",
    dotColor: "bg-gray-400",
    borderColor: "border-l-gray-400",
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

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.ACTIVE;
  const maxVisibleAvatars = 3;
  const visibleMembers = project.members.slice(0, maxVisibleAvatars);
  const remainingCount = project.members.length - maxVisibleAvatars;

  return (
    <Link href={`/projects/${project._id}`}>
      <Card
        className={`h-full transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer border-l-4 ${status.borderColor}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 font-normal text-xs"
            >
              <span className={`h-2 w-2 rounded-full ${status.dotColor}`} />
              {status.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2 -mt-1"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <h3 className="font-semibold text-base mt-2 line-clamp-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {project.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            {/* Stacked Avatars */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center -space-x-2 hover:opacity-80 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  {visibleMembers.map((member, index) => (
                    <Avatar
                      key={member._id}
                      className="h-8 w-8 border-2 border-background"
                      style={{ zIndex: maxVisibleAvatars - index }}
                    >
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getInitials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remainingCount > 0 && (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      +{remainingCount}
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium">Project Members</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {project.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getInitials(member.name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Meta info */}
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{project.members.length}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>{getTimeAgo(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export type { Project, Member };
