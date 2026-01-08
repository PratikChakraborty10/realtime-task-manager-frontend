"use client";

import { useEffect, useCallback } from "react";
import {
    getSocket,
    joinProjectRoom,
    leaveProjectRoom,
    joinTaskRoom,
    leaveTaskRoom,
} from "@/lib/socket";
import type { Task } from "@/components/task-card";

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

interface TaskUpdatePayload {
    task: Task;
}

interface TaskDeletePayload {
    taskId: string;
}

interface CommentCreatePayload {
    comment: Comment;
}

interface CommentUpdatePayload {
    comment: Comment;
}

interface CommentDeletePayload {
    commentId: string;
}

/**
 * Hook for real-time task updates in a project
 */
export function useTaskUpdates(
    projectId: string | null,
    callbacks: {
        onTaskCreated?: (task: Task) => void;
        onTaskUpdated?: (task: Task) => void;
        onTaskDeleted?: (taskId: string) => void;
    }
) {
    const { onTaskCreated, onTaskUpdated, onTaskDeleted } = callbacks;

    useEffect(() => {
        if (!projectId) return;

        const socket = getSocket();
        if (!socket) return;

        // Join project room
        joinProjectRoom(projectId);

        // Event handlers
        const handleTaskCreated = (data: TaskUpdatePayload) => {
            console.log("[Socket] task:created", data);
            onTaskCreated?.(data.task);
        };

        const handleTaskUpdated = (data: TaskUpdatePayload) => {
            console.log("[Socket] task:updated", data);
            onTaskUpdated?.(data.task);
        };

        const handleTaskDeleted = (data: TaskDeletePayload) => {
            console.log("[Socket] task:deleted", data);
            onTaskDeleted?.(data.taskId);
        };

        // Subscribe to events
        socket.on("task:created", handleTaskCreated);
        socket.on("task:updated", handleTaskUpdated);
        socket.on("task:deleted", handleTaskDeleted);

        // Cleanup
        return () => {
            leaveProjectRoom(projectId);
            socket.off("task:created", handleTaskCreated);
            socket.off("task:updated", handleTaskUpdated);
            socket.off("task:deleted", handleTaskDeleted);
        };
    }, [projectId, onTaskCreated, onTaskUpdated, onTaskDeleted]);
}

/**
 * Hook for real-time comment updates on a task
 */
export function useCommentUpdates(
    taskId: string | null,
    callbacks: {
        onCommentCreated?: (comment: Comment) => void;
        onCommentUpdated?: (comment: Comment) => void;
        onCommentDeleted?: (commentId: string) => void;
    }
) {
    const { onCommentCreated, onCommentUpdated, onCommentDeleted } = callbacks;

    useEffect(() => {
        if (!taskId) return;

        const socket = getSocket();
        if (!socket) return;

        // Join task room
        joinTaskRoom(taskId);

        // Event handlers
        const handleCommentCreated = (data: CommentCreatePayload) => {
            onCommentCreated?.(data.comment);
        };

        const handleCommentUpdated = (data: CommentUpdatePayload) => {
            onCommentUpdated?.(data.comment);
        };

        const handleCommentDeleted = (data: CommentDeletePayload) => {
            onCommentDeleted?.(data.commentId);
        };

        // Subscribe to events
        socket.on("comment:created", handleCommentCreated);
        socket.on("comment:updated", handleCommentUpdated);
        socket.on("comment:deleted", handleCommentDeleted);

        // Cleanup
        return () => {
            leaveTaskRoom(taskId);
            socket.off("comment:created", handleCommentCreated);
            socket.off("comment:updated", handleCommentUpdated);
            socket.off("comment:deleted", handleCommentDeleted);
        };
    }, [taskId, onCommentCreated, onCommentUpdated, onCommentDeleted]);
}
