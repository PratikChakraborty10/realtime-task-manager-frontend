# WebSocket Real-Time API Documentation

## Overview

Real-time updates for tasks and comments using **Socket.io**. Authentication via Supabase JWT.

**Server**: `http://localhost:8000` (same as REST API)

---

## Connection

### Connecting with Authentication

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: {
    token: 'YOUR_SUPABASE_ACCESS_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

### Errors

| Error | Cause |
|-------|-------|
| `Authentication required` | No token provided |
| `Invalid token` | Token expired or invalid |

---

## Rooms

Clients must join rooms to receive updates for specific resources.

### Join Project Room

Receive task updates for a project.

```javascript
// Join
socket.emit('join:project', 'PROJECT_ID');

// Leave
socket.emit('leave:project', 'PROJECT_ID');
```

### Join Task Room

Receive comment updates for a task.

```javascript
// Join
socket.emit('join:task', 'TASK_ID');

// Leave
socket.emit('leave:task', 'TASK_ID');
```

---

## Events

### Task Events

Broadcast to `project:{projectId}` room.

#### `task:updated`

Fired when task status, assignee, or other fields are updated.

```javascript
socket.on('task:updated', (data) => {
  console.log('Task updated:', data.task);
  // data.task = full task object with populated fields
});
```

**Payload:**
```json
{
  "task": {
    "_id": "...",
    "title": "Implement login",
    "status": "IN_PROGRESS",
    "assignee": { "_id": "...", "name": "Jane", "email": "..." },
    "createdBy": { "_id": "...", "name": "John", "email": "..." }
  }
}
```

#### `task:deleted`

Fired when a task is deleted.

```javascript
socket.on('task:deleted', (data) => {
  console.log('Task deleted:', data.taskId);
  // Remove task from UI
});
```

**Payload:**
```json
{
  "taskId": "507f1f77bcf86cd799439033"
}
```

---

### Comment Events

Broadcast to `task:{taskId}` room.

#### `comment:created`

Fired when a new comment is added.

```javascript
socket.on('comment:created', (data) => {
  console.log('New comment:', data.comment);
  // Append to comment list
});
```

**Payload:**
```json
{
  "comment": {
    "_id": "...",
    "content": "Great progress!",
    "task": "...",
    "createdBy": { "_id": "...", "name": "John", "email": "..." },
    "createdAt": "..."
  }
}
```

#### `comment:updated`

Fired when a comment is edited.

```javascript
socket.on('comment:updated', (data) => {
  console.log('Comment updated:', data.comment);
  // Update comment in UI
});
```

#### `comment:deleted`

Fired when a comment is deleted.

```javascript
socket.on('comment:deleted', (data) => {
  console.log('Comment deleted:', data.commentId);
  // Remove from UI
});
```

**Payload:**
```json
{
  "commentId": "507f1f77bcf86cd799439044"
}
```

---

## Full Integration Example

```javascript
import { io } from 'socket.io-client';

// Connect
const socket = io('http://localhost:8000', {
  auth: { token: accessToken }
});

// Join rooms when viewing a project
function openProject(projectId) {
  socket.emit('join:project', projectId);
}

// Join task room when viewing task details
function openTaskDetails(taskId) {
  socket.emit('join:task', taskId);
}

// Leave rooms when navigating away
function closeProject(projectId) {
  socket.emit('leave:project', projectId);
}

function closeTaskDetails(taskId) {
  socket.emit('leave:task', taskId);
}

// Listen for real-time updates
socket.on('task:updated', ({ task }) => {
  // Update task in state/store
  updateTaskInList(task);
});

socket.on('task:deleted', ({ taskId }) => {
  // Remove task from state/store
  removeTaskFromList(taskId);
});

socket.on('comment:created', ({ comment }) => {
  // Add to comments list
  addComment(comment);
});

socket.on('comment:updated', ({ comment }) => {
  // Update comment in list
  updateComment(comment);
});

socket.on('comment:deleted', ({ commentId }) => {
  // Remove from comments list
  removeComment(commentId);
});
```

---

## React Hook Example

```javascript
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: { token: getAccessToken() }
});

export function useTaskUpdates(projectId, onUpdate, onDelete) {
  useEffect(() => {
    socket.emit('join:project', projectId);
    
    socket.on('task:updated', onUpdate);
    socket.on('task:deleted', onDelete);

    return () => {
      socket.emit('leave:project', projectId);
      socket.off('task:updated', onUpdate);
      socket.off('task:deleted', onDelete);
    };
  }, [projectId]);
}

export function useCommentUpdates(taskId, onCreate, onUpdate, onDelete) {
  useEffect(() => {
    socket.emit('join:task', taskId);
    
    socket.on('comment:created', onCreate);
    socket.on('comment:updated', onUpdate);
    socket.on('comment:deleted', onDelete);

    return () => {
      socket.emit('leave:task', taskId);
      socket.off('comment:created', onCreate);
      socket.off('comment:updated', onUpdate);
      socket.off('comment:deleted', onDelete);
    };
  }, [taskId]);
}
```

---

## Event Summary

| Event | Room | Trigger |
|-------|------|---------|
| `task:updated` | `project:{id}` | Task status/assignee changed |
| `task:deleted` | `project:{id}` | Task removed |
| `comment:created` | `task:{id}` | New comment added |
| `comment:updated` | `task:{id}` | Comment edited |
| `comment:deleted` | `task:{id}` | Comment removed |
