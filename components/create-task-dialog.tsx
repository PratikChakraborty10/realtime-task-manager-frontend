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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import type { Task } from "@/components/task-card";
import type { Member } from "@/components/project-card";

interface CreateTaskResponse {
  success: boolean;
  message: string;
  task: Task;
}

interface CreateTaskDialogProps {
  projectId: string;
  members: Member[];
  onTaskCreated: (task: Task) => void;
}

export function CreateTaskDialog({
  projectId,
  members,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string>("unassigned");
  const [error, setError] = useState<string | null>(null);
  const { isLoading, fetchData } = useFetch<CreateTaskResponse>();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    const response = await fetchData(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        assignee: assignee === "unassigned" ? undefined : assignee,
      }),
    });

    if (response?.success && response.task) {
      // Don't call onTaskCreated here - WebSocket will handle adding the task
      // This prevents duplicate tasks from appearing
      setTitle("");
      setDescription("");
      setAssignee("unassigned");
      setOpen(false);
    } else if (response && !response.success) {
      setError(response.message || "Failed to create task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to this project. You can assign it to a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="task-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Describe what needs to be done..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger id="task-assignee">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
