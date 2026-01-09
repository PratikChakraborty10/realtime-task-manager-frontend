# Frontend Guide: Cursor-Based Pagination

This guide explains how to implement **Cursor-Based Pagination** for infinite scroll or "Load More" interfaces in the application.

---

## 1. Why Cursor Pagination?

Unlike traditional "Page 1, Page 2" pagination (which can skip or duplicate items if data changes while browsing), **Cursor Pagination** uses a pointer to a specific item. This ensures:
*   **Performance**: Faster queries on large datasets (MongoDB doesn't have to "skip" thousands of rows).
*   **Consistency**: No duplicate items if new data is added while scrolling.

---

## 2. API Contract

All list endpoints (e.g., `/projects`, `/tasks`) follow this standard contract.

### Default Behavior
*   **Default Limit**: `10` items per page (if not specified).
*   **Max Limit**: `100` items (backend cap).

### Request Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | number | No | Number of items to fetch (e.g., `20`). Defaults to `10`. |
| `cursor` | string | No | The `nextCursor` from the *previous* response. Send nothing for the first page. |

### Response Format

```json
{
  "success": true,
  "data": [ ... ],       // Array of items
  "pagination": {
    "hasMore": true,     // false if this is the last page
    "nextCursor": "507f1f77bcf86cd799439011" // Pass this ID to get the next page
  }
}
```

---

## 3. Implementation Logic

### The Loop
1.  **First Load**: Request `?limit=10` (no cursor).
2.  **Next Page**: 
    *   Take `pagination.nextCursor` from the previous response.
    *   Request `?limit=10&cursor=PREVIOUS_NEXT_CURSOR`.
3.  **Append Data**: Add new items to your existing list.
4.  **Stop**: When `pagination.hasMore` is `false`.

---

## 4. Code Examples

### A. Vanilla JavaScript / Simple Fetch

```javascript
let currentCursor = null;
let hasMoreToLoad = true;
const PAGE_SIZE = 20; // You can control the limit here

async function loadNextPage() {
  if (!hasMoreToLoad) return;

  // Build URL with params
  const url = new URL('http://api.com/projects');
  url.searchParams.set('limit', PAGE_SIZE);
  if (currentCursor) {
    url.searchParams.set('cursor', currentCursor);
  }

  const res = await fetch(url, { headers: { Authorization: token } });
  const { projects, pagination } = await res.json();

  // Update state
  renderProjects(projects); // specific to your UI
  currentCursor = pagination.nextCursor;
  hasMoreToLoad = pagination.hasMore;
}
```

### B. React (Basic State)

```javascript
function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProjects = async () => {
    const params = new URLSearchParams({ limit: 12 }); // Custom limit example
    if (cursor) params.append('cursor', cursor);

    const res = await fetch(`/api/v1/projects?${params}`);
    const data = await res.json();

    setProjects(prev => [...prev, ...data.projects]);
    setCursor(data.pagination.nextCursor);
    setHasMore(data.pagination.hasMore);
  };

  return (
    <div>
      {projects.map(p => <div key={p._id}>{p.name}</div>)}
      
      {hasMore && (
        <button onClick={fetchProjects}>Load More</button>
      )}
    </div>
  );
}
```

### C. React Query (Recommended)

Using `@tanstack/react-query`'s `useInfiniteQuery` handles caching and cursor management automatically.

```javascript
/* 
  Prerequisite:
  npm install @tanstack/react-query
*/

import { useInfiniteQuery } from '@tanstack/react-query';

// Fetcher function
const fetchProjects = async ({ pageParam = null }) => {
  const params = new URLSearchParams({ limit: 15 });
  if (pageParam) params.append('cursor', pageParam);

  const res = await fetch(`/api/v1/projects?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

function InfiniteProjectList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    getNextPageParam: (lastPage) => {
      // Return undefined to stop fetching
      return lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined;
    }
  });

  return (
    <div>
      {data?.pages.map((group, i) => (
        <React.Fragment key={i}>
          {group.projects.map(project => (
            <p key={project._id}>{project.name}</p>
          ))}
        </React.Fragment>
      ))}

      <button 
        onClick={() => fetchNextPage()} 
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'No more projects'}
      </button>
    </div>
  );
}
```

---

## 5. Handling Filters & Sorts

**Crucial**: When the user changes a filter (e.g., specific status) or sort order, you must **reset the pagination**.

1.  **User Action**: Changes Filter to `Status: ACTIVE`.
2.  **Frontend Action**: 
    *   Clear existing list data.
    *   Set `cursor` to `null`.
    *   Fetch Page 1 with new params: `?status=ACTIVE&limit=10`.

```javascript
// React Effect Example for Resetting
useEffect(() => {
  setProjects([]);
  setCursor(null);
  setHasMore(true);
  // trigger fetch...
}, [filterStatus, sortOrder]); 
```

---

## 6. Summary Checklist

- [ ] **Dynamic Limit**: Decide your page size on the frontend (e.g., 10, 20, 50) and pass strictly via `?limit=N`.
- [ ] **Next Cursor**: Always read `pagination.nextCursor` from the backend response.
- [ ] **Uniqueness**: Use `key={item._id}` in lists to avoid React warnings.
- [ ] **Reset**: Reset cursor to `null` whenever filters or sort keys change.
