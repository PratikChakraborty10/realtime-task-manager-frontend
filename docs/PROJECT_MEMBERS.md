 # Frontend Guide: User Lookup & Add Member Flow

This guide explains how to implement the **Add Member** feature using the User Lookup API.

---

## Overview

To add a member to a project, the frontend should:
1. Let user type an email address
2. Call the **Lookup API** to fetch user details
3. Display the user's name and email for confirmation
4. Call the **Add Member API** to complete the action

---

## API Endpoints

### 1. Lookup User by Email

**Endpoint**: `GET /api/v1/users/lookup?email=user@example.com`  
**Auth**: Required

#### Request

```bash
curl "http://localhost:8000/api/v1/users/lookup?email=john@example.com" \
  -H "Authorization: Bearer <token>"
```

#### Success Response (200)

```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Error Response (404)

```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 2. Add Member to Project

**Endpoint**: `POST /api/v1/projects/:projectId/members`  
**Auth**: Required (Admin + Project Owner only)

#### Request

```bash
curl -X POST "http://localhost:8000/api/v1/projects/PROJECT_ID/members" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "507f1f77bcf86cd799439011" }'
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Member added successfully",
  "project": { ... }
}
```

---

## Frontend Implementation

### Complete Flow Example

```javascript
// State
const [searchEmail, setSearchEmail] = useState('');
const [foundUser, setFoundUser] = useState(null);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

// Step 1: Search for user by email
async function handleSearch() {
  setLoading(true);
  setError('');
  setFoundUser(null);

  try {
    const response = await fetch(
      `/api/v1/users/lookup?email=${encodeURIComponent(searchEmail)}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();

    if (data.success) {
      setFoundUser(data.user);
    } else {
      setError(data.message || 'User not found');
    }
  } catch (err) {
    setError('Failed to search for user');
  } finally {
    setLoading(false);
  }
}

// Step 2: Add the found user to the project
async function handleAddMember() {
  if (!foundUser) return;

  try {
    const response = await fetch(`/api/v1/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: foundUser._id })
    });

    const data = await response.json();

    if (data.success) {
      alert('Member added successfully!');
      // Refresh project members list
      onMemberAdded(data.project.members);
      // Reset form
      setSearchEmail('');
      setFoundUser(null);
    } else {
      setError(data.message);
    }
  } catch (err) {
    setError('Failed to add member');
  }
}
```

---

## UI Component Example (React)

```jsx
function AddMemberDialog({ projectId, onMemberAdded }) {
  // ... state from above ...

  return (
    <div className="add-member-dialog">
      <h3>Add Member</h3>
      
      {/* Search Input */}
      <div className="search-row">
        <input
          type="email"
          placeholder="Enter email address"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading || !searchEmail}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="error">{error}</p>}

      {/* Found User Card */}
      {foundUser && (
        <div className="user-card">
          <div className="user-info">
            <strong>{foundUser.name}</strong>
            <span>{foundUser.email}</span>
          </div>
          <button onClick={handleAddMember}>Add</button>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

| Error | Cause | UI Action |
|-------|-------|-----------|
| 404 - User not found | Email doesn't exist | Show "No user found with this email" |
| 400 - Already a member | User is already in project | Show "User is already a member" |
| 403 - Access denied | Current user is not admin/owner | Hide the Add Member button entirely |

---

## Tips

1. **Debounce Search**: If implementing real-time search, debounce the API calls (e.g., 300ms delay).
2. **Case Insensitive**: The backend handles email case-insensitivity.
3. **Loading States**: Show spinner while searching and adding.
4. **Validation**: Validate email format on frontend before calling API.
