# Search API Documentation

## Overview

Global full-text search across **Projects**, **Tasks**, and **Comments**. Uses MongoDB text indexes for efficient searching.

**Base URL**: `http://localhost:8000/api/v1`

---

## Endpoint

### Global Search

**Endpoint**: `GET /search`  
**Auth**: Required

### Request

```bash
curl "http://localhost:8000/api/v1/search?q=login&limit=10" \
  -H "Authorization: Bearer <token>"
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | **Yes** | - | Search query |
| `limit` | number | No | 10 | Max results per category |

### Response (200)

```json
{
  "success": true,
  "query": "login",
  "results": {
    "projects": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Login System",
        "description": "User authentication module",
        "status": "ACTIVE",
        "matchedOn": "project"
      }
    ],
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "title": "Implement login page",
        "description": "Create responsive login form",
        "status": "IN_PROGRESS",
        "project": { "_id": "...", "name": "Main App" },
        "matchedOn": "task"
      }
    ],
    "comments": [
      {
        "_id": "507f1f77bcf86cd799439033",
        "content": "Login button styling needs work",
        "task": { "_id": "...", "title": "UI Review" },
        "project": { "_id": "...", "name": "Main App" },
        "createdAt": "2026-01-09T00:00:00.000Z",
        "matchedOn": "comment"
      }
    ]
  },
  "totalCount": 3
}
```

---

## Authorization

- Only returns results from projects the user is a **member** of or **created**
- Comments are filtered to only show those in user's projects

---

## Text Indexes

| Collection | Indexed Fields |
|------------|----------------|
| Projects | `name`, `description` |
| Tasks | `title`, `description` |
| Comments | `content` |

---

## Error Responses

| Code | Message |
|------|---------|
| 400 | Search query is required |
| 400 | Search query cannot be empty |
| 401 | Invalid token |
| 500 | Search index not ready |

---

## Frontend Example

```javascript
async function globalSearch(query, limit = 10) {
  const params = new URLSearchParams({ q: query, limit });
  
  const response = await fetch(`/api/v1/search?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Group results
  console.log('Projects:', data.results.projects);
  console.log('Tasks:', data.results.tasks);
  console.log('Comments:', data.results.comments);
  console.log('Total:', data.totalCount);
}
```
