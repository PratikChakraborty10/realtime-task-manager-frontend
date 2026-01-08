"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import type { Project } from "./project-card";

interface CreateProjectResponse {
  success: boolean;
  message: string;
  project: Project;
}

interface CreateProjectDialogProps {
  onProjectCreated: (project: Project) => void;
}

export function CreateProjectDialog({
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isLoading, fetchData } = useFetch<CreateProjectResponse>();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    const response = await fetchData("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    });

    if (response?.success && response.project) {
      onProjectCreated(response.project);
      setName("");
      setDescription("");
      setOpen(false);
    } else if (response && !response.success) {
      setError(response.message || "Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0" data-create-project-trigger>
          <Plus className="h-4 w-4" />
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your tasks and collaborate with your
              team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this project is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
