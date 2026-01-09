# Frontend Guide: Project Management Features

This guide provides implementation details for building Project Management features in the UI.

## 1. Project Management Overview

Managing a project involves three main activities:
1.  **Updating Details** (Name, Description)
2.  **Changing Status** (Active, Completed, etc.)
3.  **Managing Members** (Adding/Removing users)

**Permissions**:
*   **ADMIN**: Can perform all actions.
*   **Project Owner**: Can perform all actions on *their* projects.
*   **Member**: View only (cannot update/delete/add members).

---

## 2. Updating Project Details

**Scenario**: User clicks "Edit Project" to change the name or description.

*   **Endpoint**: `PATCH /api/v1/projects/:id`
*   **Functionality**: Partial updates (send only changed fields).

### Frontend Implementation (Example)

```javascript
// Function to update project details
async function updateProjectDetails(projectId, updates) {
  // updates = { name: "New Name", description: "New Desc" }
  
  try {
    const response = await fetch(\`/api/v1/projects/\${projectId}\`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error('Update failed');
    
    const data = await response.json();
    return data.project; // Returns updated project object
  } catch (error) {
    if (error.response.status === 403) {
      alert("You don't have permission to edit this project.");
    }
    console.error(error);
  }
}
```

---

## 3. Changing Project Status

**Scenario**: User moves a project from "In Progress" to "Completed".

*   **Endpoint**: `PATCH /api/v1/projects/:id`
*   **Valid Statuses**: `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`

### UI Recommendation
Use a distinct dropdown or status badge that is clickable.

### Frontend Implementation (Example)

```javascript
/* CONSTANTS for Status Enums */
const PROJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
};

async function changeProjectStatus(projectId, newStatus) {
  // Validate status before sending
  if (!Object.values(PROJECT_STATUS).includes(newStatus)) {
    console.error("Invalid status");
    return;
  }

  return updateProjectDetails(projectId, { status: newStatus });
}
```

---

## 4. Managing Members

**Scenario**: User wants to invite a colleague to the project.

### 4.1 Add Member

*   **Endpoint**: `POST /api/v1/projects/:id/members`
*   **Required Data**: `userId` (You likely need a user search/select component first to get this ID).

### Frontend Implementation (Example)

```javascript
async function addMemberToProject(projectId, userIdToInvite) {
  try {
    const response = await fetch(\`/api/v1/projects/\${projectId}/members\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({ userId: userIdToInvite })
    });

    const data = await response.json();
    
    if (data.success) {
      // Update local members list state
      setMembers(data.project.members);
      alert("Member added successfully!");
    }
  } catch (error) {
     if (error.status === 400) {
       alert("User is already a member.");
     }
  }
}
```

### 4.2 Remove Member

**Scenario**: Removing access for a user.

*   **Endpoint**: `DELETE /api/v1/projects/:id/members/:userId`

### Frontend Implementation (Example)

```javascript
async function removeMemberFromProject(projectId, userIdToRemove) {
  const confirm = window.confirm("Are you sure you want to remove this member?");
  if (!confirm) return;

  try {
    const response = await fetch(\`/api/v1/projects/\${projectId}/members/\${userIdToRemove}\`, {
      method: 'DELETE',
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    });

    if (response.ok) {
      // Update UI to remove user from list
      setMembers(prev => prev.filter(m => m._id !== userIdToRemove));
    }
  } catch (error) {
    console.error("Failed to remove member", error);
  }
}
```

---

## 5. UI Checklist

When building these pages, ensure you handle these UX states:

- [ ] **Loading State**: Disable buttons while the API request is in flight.
- [ ] **Optimistic Updates**: (Optional) Update the UI immediately before the API returns for perceived speed, revert if error.
- [ ] **Permission Check**: Hide the "Edit" and "Add Member" buttons if the current user is NOT the owner or an admin.
    *   *Check*: `currentUser._id === project.createdBy._id || currentUser.role === 'ADMIN'`
- [ ] **Validation**: Ensure project name is not empty before submitting.
