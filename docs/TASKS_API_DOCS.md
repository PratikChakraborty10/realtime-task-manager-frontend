# Tasks & Comments API Documentation

## Overview

Tasks belong to a **single project** and cannot be part of multiple projects. Each task can have multiple comments. Comments use a **referenced structure** (separate collection) for better performance.

**Base URL**: `http://localhost:8000/api/v1`

---

## Data Models

### Task

```javascript
{
  "_id": "ObjectId",
  "title": "string",              // Required
  "description": "string",
  "status": "OPEN | IN_PROGRESS | ON_HOLD | CLOSED",
  "assignee": "ObjectId",         // Must be a project member
  "project": "ObjectId",          // Parent project (required)
  "createdBy": "ObjectId",        // Task creator
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Comment

```javascript
{
  "_id": "ObjectId",
  "content": "string",            // Required
  "task": "ObjectId",             // Parent task (required)
  "createdBy": "ObjectId",        // Comment author
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Status Values

| Status | Description |
|--------|-------------|
| `OPEN` | Default status for new tasks |
| `IN_PROGRESS` | Task is being worked on |
| `ON_HOLD` | Task is paused |
| `CLOSED` | Task is completed |

---

## Authorization Rules

### Tasks

| Action | Who Can Do It |
|--------|---------------|
| Create task | Project members |
| View tasks | Project members |
| Update task | Project members |
| Delete task | **Project owner only** |

### Comments

| Action | Who Can Do It |
|--------|---------------|
| Add comment | Any authenticated user |
| View comments | Any authenticated user |
| Edit comment | **Comment author only** |
| Delete comment | **Comment author only** |

---

## Database Indexing Strategy

### Task Indexes

| Index | Purpose |
|-------|---------|
| `{ project: 1, createdAt: -1 }` | Tasks in project, newest first |
| `{ project: 1, status: 1 }` | Filter by status within project |
| `{ assignee: 1, createdAt: -1 }` | User's assigned tasks |

### Comment Indexes

| Index | Purpose |
|-------|---------|
| `{ task: 1, createdAt: 1 }` | Comments on task, oldest first |

---

## Cursor-Based Pagination

Both tasks and comments lists use **cursor-based pagination**.

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | number | 20 | 100 | Items per page |
| `cursor` | string | - | - | ID of last item from previous page |

### Response Format

```json
{
  "success": true,
  "tasks": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "507f1f77bcf86cd799439011"
  }
}
```

### Note on Sort Order

- **Tasks**: Sorted by newest first (`_id` descending)
- **Comments**: Sorted by oldest first (`_id` ascending) - for conversation flow

---

# Task Endpoints

## 1. Create Task

**Endpoint**: `POST /projects/:projectId/tasks`  
**Auth**: Required (Project member)

### Request

```bash
curl -X POST http://localhost:8000/api/v1/projects/{projectId}/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement login page",
    "description": "Create responsive login form with validation",
    "assignee": "507f1f77bcf86cd799439022"
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Task title |
| `description` | string | No | Task description |
| `assignee` | string | No | MongoDB ID of user to assign (must be project member) |

### Response (201)

```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439033",
    "title": "Implement login page",
    "description": "Create responsive login form with validation",
    "status": "OPEN",
    "assignee": { "_id": "...", "name": "Jane", "email": "jane@example.com" },
    "project": "507f1f77bcf86cd799439011",
    "createdBy": { "_id": "...", "name": "John", "email": "john@example.com" },
    "createdAt": "2026-01-09T00:00:00.000Z",
    "updatedAt": "2026-01-09T00:00:00.000Z"
  }
}
```

### Errors

| Code | Message |
|------|---------|
| 400 | Task title is required |
| 400 | Assignee must be a member of the project |
| 403 | Access denied. Not a project member. |

---

## 2. List Tasks (Paginated)

**Endpoint**: `GET /projects/:projectId/tasks`  
**Auth**: Required (Project member)

### Request

```bash
# First page
curl "http://localhost:8000/api/v1/projects/{projectId}/tasks?limit=10" \
  -H "Authorization: Bearer <token>"

# Next page
curl "http://localhost:8000/api/v1/projects/{projectId}/tasks?limit=10&cursor={nextCursor}" \
  -H "Authorization: Bearer <token>"
```

### Response (200)

```json
{
  "success": true,
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439033",
      "title": "Implement login page",
      "status": "OPEN",
      "assignee": {...},
      "createdBy": {...}
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "507f1f77bcf86cd799439032"
  }
}
```

---

## 3. Get Task

**Endpoint**: `GET /projects/:projectId/tasks/:taskId`  
**Auth**: Required (Project member)

### Request

```bash
curl http://localhost:8000/api/v1/projects/{projectId}/tasks/{taskId} \
  -H "Authorization: Bearer <token>"
```

### Response (200)

```json
{
  "success": true,
  "task": {
    "_id": "507f1f77bcf86cd799439033",
    "title": "Implement login page",
    "description": "Create responsive login form with validation",
    "status": "IN_PROGRESS",
    "assignee": {...},
    "project": "...",
    "createdBy": {...},
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 4. Update Task

**Endpoint**: `PATCH /projects/:projectId/tasks/:taskId`  
**Auth**: Required (Project member)

### Request

```bash
curl -X PATCH http://localhost:8000/api/v1/projects/{projectId}/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "IN_PROGRESS",
    "assignee": "507f1f77bcf86cd799439022"
  }'
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | New title |
| `description` | string | New description |
| `status` | string | `OPEN`, `IN_PROGRESS`, `ON_HOLD`, `CLOSED` |
| `assignee` | string | User ID (must be project member) or `null` to unassign |

### Response (200)

```json
{
  "success": true,
  "message": "Task updated successfully",
  "task": {...}
}
```

### Errors

| Code | Message |
|------|---------|
| 400 | Assignee must be a member of the project |
| 404 | Task not found |

---

## 5. Delete Task

**Endpoint**: `DELETE /projects/:projectId/tasks/:taskId`  
**Auth**: Required (**Project owner only**)

### Request

```bash
curl -X DELETE http://localhost:8000/api/v1/projects/{projectId}/tasks/{taskId} \
  -H "Authorization: Bearer <token>"
```

### Response (200)

```json
{
  "success": true,
  "message": "Task and its comments deleted successfully"
}
```

> **Note**: Deleting a task also deletes all its comments.

---

# Comment Endpoints

## 1. Add Comment

**Endpoint**: `POST /tasks/:taskId/comments`  
**Auth**: Required

### Request

```bash
curl -X POST http://localhost:8000/api/v1/tasks/{taskId}/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "content": "Great progress on this task!"
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | **Yes** | Comment text |

### Response (201)

```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "_id": "507f1f77bcf86cd799439044",
    "content": "Great progress on this task!",
    "task": "507f1f77bcf86cd799439033",
    "createdBy": { "_id": "...", "name": "John", "email": "john@example.com" },
    "createdAt": "2026-01-09T00:00:00.000Z",
    "updatedAt": "2026-01-09T00:00:00.000Z"
  }
}
```

---

## 2. List Comments (Paginated)

**Endpoint**: `GET /tasks/:taskId/comments`  
**Auth**: Required

### Request

```bash
# First page (oldest comments first)
curl "http://localhost:8000/api/v1/tasks/{taskId}/comments?limit=20" \
  -H "Authorization: Bearer <token>"

# Next page
curl "http://localhost:8000/api/v1/tasks/{taskId}/comments?limit=20&cursor={nextCursor}" \
  -H "Authorization: Bearer <token>"
```

### Response (200)

```json
{
  "success": true,
  "comments": [
    {
      "_id": "507f1f77bcf86cd799439044",
      "content": "Great progress on this task!",
      "createdBy": {...},
      "createdAt": "..."
    }
  ],
  "pagination": {
    "hasMore": false,
    "nextCursor": null
  }
}
```

---

## 3. Update Comment

**Endpoint**: `PATCH /comments/:commentId`  
**Auth**: Required (**Comment author only**)

### Request

```bash
curl -X PATCH http://localhost:8000/api/v1/comments/{commentId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "content": "Updated comment text"
  }'
```

### Response (200)

```json
{
  "success": true,
  "message": "Comment updated successfully",
  "comment": {...}
}
```

### Errors

| Code | Message |
|------|---------|
| 400 | Comment content is required |
| 403 | Only the comment author can edit this comment |

---

## 4. Delete Comment

**Endpoint**: `DELETE /comments/:commentId`  
**Auth**: Required (**Comment author only**)

### Request

```bash
curl -X DELETE http://localhost:8000/api/v1/comments/{commentId} \
  -H "Authorization: Bearer <token>"
```

### Response (200)

```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Errors

| Code | Message |
|------|---------|
| 403 | Only the comment author can delete this comment |

---

## Frontend Implementation Guide

### Task List with Infinite Scroll

```javascript
async function fetchTasks(projectId, cursor = null, limit = 20) {
  const params = new URLSearchParams({ limit });
  if (cursor) params.append('cursor', cursor);

  const response = await fetch(
    `/api/v1/projects/${projectId}/tasks?${params}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  const data = await response.json();
  return {
    tasks: data.tasks,
    hasMore: data.pagination.hasMore,
    nextCursor: data.pagination.nextCursor
  };
}
```

### Update Task Status

```javascript
async function updateTaskStatus(projectId, taskId, status) {
  const response = await fetch(
    `/api/v1/projects/${projectId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    }
  );
  return response.json();
}

// Usage
await updateTaskStatus('proj123', 'task456', 'IN_PROGRESS');
```

### Assign User to Task

```javascript
async function assignTask(projectId, taskId, userId) {
  const response = await fetch(
    `/api/v1/projects/${projectId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assignee: userId })
    }
  );
  return response.json();
}
```

### Load Comments for Task

```javascript
async function loadComments(taskId) {
  let allComments = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({ limit: 50 });
    if (cursor) params.append('cursor', cursor);

    const response = await fetch(
      `/api/v1/tasks/${taskId}/comments?${params}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    
    allComments = [...allComments, ...data.comments];
    hasMore = data.pagination.hasMore;
    cursor = data.pagination.nextCursor;
  }

  return allComments;
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Not allowed (not member/author) |
| 404 | Not Found |
| 500 | Server Error |
