# Projects API Documentation

## Overview

Projects are the **primary isolation boundary** in the Task Manager. All data (tasks, comments) is accessed through projects. Authorization is enforced at the project level.

**Base URL**: `http://localhost:8000/api/v1/projects`

---

## Data Model

```javascript
{
  "_id": "ObjectId",
  "name": "string",           // Required
  "description": "string",
  "status": "ACTIVE | ON_HOLD | COMPLETED | ARCHIVED",
  "members": ["ObjectId"],    // Array of User IDs
  "createdBy": "ObjectId",    // Project owner
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Authorization Rules

| Role | Create | View | Update | Delete | Add Members | Remove Members |
|------|--------|------|--------|--------|-------------|----------------|
| **ADMIN** | ✅ | ✅* | ✅** | ✅** | ✅** | ✅** |
| **Member** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Non-member** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*\* Must be a member of the project*  
*\*\* Must be the project owner (createdBy)*

---

## Database Indexing Strategy

The following compound indexes are used for optimized queries:

| Index | Purpose |
|-------|---------|
| `{ createdBy: 1, createdAt: -1 }` | Owner's projects, sorted by newest |
| `{ members: 1, createdAt: -1 }` | Member's projects, sorted by newest |

These indexes ensure fast retrieval when listing projects for a user.

---

## Cursor-Based Pagination

All list endpoints use **cursor-based pagination** for optimal performance with large datasets.

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | number | 20 | 100 | Items per page |
| `cursor` | string | - | - | ID of last item from previous page |

### Response Format

```json
{
  "success": true,
  "projects": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "507f1f77bcf86cd799439011"
  }
}
```

### Pagination Flow

```
Page 1: GET /projects?limit=10
        → Returns items + nextCursor: "abc123"

Page 2: GET /projects?limit=10&cursor=abc123
        → Returns next items + nextCursor: "def456"

Page N: GET /projects?limit=10&cursor=xyz789
        → Returns items + hasMore: false (last page)
```

---

## Endpoints

### 1. Create Project

**Endpoint**: `POST /projects`  
**Authentication**: Required (ADMIN only)

#### Request

```bash
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "My Project",
    "description": "Project description"
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Project name |
| `description` | string | No | Project description |

#### Response (201)

```json
{
  "success": true,
  "message": "Project created successfully",
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Project",
    "description": "Project description",
    "status": "ACTIVE",
    "members": [
      { "_id": "...", "name": "John", "email": "john@example.com" }
    ],
    "createdBy": { "_id": "...", "name": "John", "email": "john@example.com" },
    "createdAt": "2026-01-08T00:00:00.000Z",
    "updatedAt": "2026-01-08T00:00:00.000Z"
  }
}
```

#### Errors

| Code | Message |
|------|---------|
| 400 | Project name is required |
| 403 | Access denied. Admin privileges required. |

---

### 2. List Projects (Paginated)

**Endpoint**: `GET /projects`  
**Authentication**: Required

#### Request

```bash
# First page
curl "http://localhost:8000/api/v1/projects?limit=10" \
  -H "Authorization: Bearer <token>"

# Next page
curl "http://localhost:8000/api/v1/projects?limit=10&cursor=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <token>"
```

#### Response (200)

```json
{
  "success": true,
  "projects": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Project A",
      "status": "ACTIVE",
      "members": [...],
      "createdBy": {...}
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "507f1f77bcf86cd799439010"
  }
}
```

---

### 3. Get Project

**Endpoint**: `GET /projects/:id`  
**Authentication**: Required (Members only)

#### Request

```bash
curl http://localhost:8000/api/v1/projects/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>"
```

#### Response (200)

```json
{
  "success": true,
  "project": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Project",
    "description": "Project description",
    "status": "ACTIVE",
    "members": [...],
    "createdBy": {...},
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Errors

| Code | Message |
|------|---------|
| 403 | Access denied. Not a project member. |
| 404 | Project not found |

---

### 4. Update Project

**Endpoint**: `PATCH /projects/:id`  
**Authentication**: Required (Owner only)

#### Request

```bash
curl -X PATCH http://localhost:8000/api/v1/projects/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Updated Name",
    "status": "ON_HOLD"
  }'
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | New project name |
| `description` | string | New description |
| `status` | string | `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED` |

#### Response (200)

```json
{
  "success": true,
  "message": "Project updated successfully",
  "project": {...}
}
```

#### Errors

| Code | Message |
|------|---------|
| 403 | Only project owner can perform this action |

---

### 5. Delete Project

**Endpoint**: `DELETE /projects/:id`  
**Authentication**: Required (Owner only)

#### Request

```bash
curl -X DELETE http://localhost:8000/api/v1/projects/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>"
```

#### Response (200)

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### 6. Add Member

**Endpoint**: `POST /projects/:id/members`  
**Authentication**: Required (ADMIN + Owner only)

#### Request

```bash
curl -X POST http://localhost:8000/api/v1/projects/507f1f77bcf86cd799439011/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "507f1f77bcf86cd799439022"
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | **Yes** | MongoDB ID of user to add |

#### Response (200)

```json
{
  "success": true,
  "message": "Member added successfully",
  "project": {...}
}
```

#### Errors

| Code | Message |
|------|---------|
| 400 | User ID is required |
| 400 | User is already a member of this project. |
| 403 | Access denied. Admin privileges required. |
| 403 | Only project owner can perform this action |
| 404 | User not found. Cannot add non-existent user as member. |

---

### 7. Remove Member

**Endpoint**: `DELETE /projects/:id/members/:userId`  
**Authentication**: Required (ADMIN + Owner only)

#### Request

```bash
curl -X DELETE http://localhost:8000/api/v1/projects/507f1f77bcf86cd799439011/members/507f1f77bcf86cd799439022 \
  -H "Authorization: Bearer <token>"
```

#### Response (200)

```json
{
  "success": true,
  "message": "Member removed successfully",
  "project": {...}
}
```

#### Errors

| Code | Message |
|------|---------|
| 400 | Cannot remove project owner |
| 403 | Access denied. Admin privileges required. |
| 403 | Only project owner can perform this action |

---

## Frontend Implementation Guide

### Fetching Projects with Pagination

```javascript
async function fetchProjects(cursor = null, limit = 20) {
  const params = new URLSearchParams({ limit });
  if (cursor) params.append('cursor', cursor);

  const response = await fetch(`/api/v1/projects?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  return {
    projects: data.projects,
    hasMore: data.pagination.hasMore,
    nextCursor: data.pagination.nextCursor
  };
}

// Usage with infinite scroll
let cursor = null;
let allProjects = [];

async function loadMore() {
  const { projects, hasMore, nextCursor } = await fetchProjects(cursor);
  allProjects = [...allProjects, ...projects];
  cursor = nextCursor;
  
  if (!hasMore) {
    // Hide "Load More" button
  }
}
```

### React Query Example

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';

function useProjects() {
  return useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
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
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 500 | Server Error |
