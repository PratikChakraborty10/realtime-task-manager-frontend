"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Users } from "lucide-react";

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
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  ON_HOLD: { label: "On Hold", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "outline" },
  ARCHIVED: { label: "Archived", variant: "destructive" },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.ACTIVE;

  return (
    <Link href={`/projects/${project._id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <Users className="h-4 w-4" />
                <span>{project.members.length} member{project.members.length !== 1 ? "s" : ""}</span>
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
                      className="flex flex-col text-sm py-1 border-b last:border-0"
                    >
                      <span className="font-medium">{member.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {member.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
    </Link>
  );
}

export type { Project, Member };
