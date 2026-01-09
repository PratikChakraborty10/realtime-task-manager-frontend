# Frontend Guide: Real-time Project Updates

This guide explains how to listen for real-time updates to **Project Details** and **Members**.

---

## 1. Socket Connection

Ensure you have joined the project room using your existing socket setup.

```javascript
// Join the room (handled by generic 'join' event or specific logic)
socket.emit('join:project', { projectId: '123' });
```

---

## 2. Updated Events

### A. Project details updated (`project:updated`)

Triggered when the Name, Description, or Status is changed.

*   **Listener**:
    ```javascript
    socket.on('project:updated', ({ project }) => {
      console.log('Project updated:', project);
      
      // 1. Update project header (Name, Description)
      setProjectDetails(project);
      
      // 2. Show toast notification
      toast.success(`Project updated to "${project.name}"`);
    });
    ```

### B. Member Added (`member:added`)

Triggered when a new member is added to the project.

*   **Listener**:
    ```javascript
    socket.on('member:added', ({ project, member }) => {
      console.log('New member:', member);
      
      // 1. Add user to the members list UI
      setMembers(prev => [...prev, member]);
      
      // 2. Show notification
      toast.info(`${member.name} joined the project`);
    });
    ```

### C. Member Removed (`member:removed`)

Triggered when a member is removed from the project.

*   **Listener**:
    ```javascript
    socket.on('member:removed', ({ project, memberId }) => {
      // 1. Remove user from the members list UI
      setMembers(prev => prev.filter(m => m._id !== memberId));
      
      // 2. Show notification
      toast.info('A member was removed');
    });
    ```

---

## 3. Best Practices

1.  **Optimistic Updates**: Even with sockets, you should update the UI immediately for the user *initiating* the action. The socket event ensures *everyone else* stays in sync.
    *   *Note*: The socket event will come back to the sender too. Ensure your state logic handles this idempotent update (e.g., don't add the same member twice if you already added them optimistically).

2.  **Effect Cleanup**: Always clean up listeners in `useEffect` return.

    ```javascript
    useEffect(() => {
      socket.on('project:updated', handleUpdate);
      return () => {
        socket.off('project:updated', handleUpdate);
      };
    }, []);
    ```
