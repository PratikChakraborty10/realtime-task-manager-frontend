# Authentication API Documentation

## Overview

This API uses **Supabase Auth** for identity management. Authentication is handled via JWT tokens.

**Base URL**: `http://localhost:8000/api/v1`

---

## Endpoints

### 1. Sign Up

Create a new user account.

**Endpoint**: `POST /signup`  
**Authentication**: None required

#### Request

```json
{
  "name": "John Doe",
  "gender": "male",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Display name |
| `gender` | string | No | Gender |
| `email` | string | **Yes** | Email address |
| `password` | string | **Yes** | Password (min 6 characters) |

#### Response

**Success (201)**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "role": "USER"
  }
}
```

**Error (400)**
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

---

### 2. Login

Authenticate an existing user.

**Endpoint**: `POST /login`  
**Authentication**: None required

#### Request

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | Email address |
| `password` | string | **Yes** | Password |

#### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "role": "USER"
  }
}
```

**Error (401)**
```json
{
  "success": false,
  "message": "Invalid login credentials"
}
```

---

### 3. Get Profile

Get the authenticated user's profile.

**Endpoint**: `GET /get-profile`  
**Authentication**: **Required**

#### Request Headers

```
Authorization: Bearer <accessToken>
```

#### Response

**Success (200)**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "role": "USER"
  }
}
```

**Error (401)**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        1. POST /signup       │       2. POST /login
        {email, password}     │       {email, password}
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  Supabase   │◄──►│   Backend   │◄──►│   MongoDB   │        │
│   │    Auth     │    │   Server    │    │  (User DB)  │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        3. Returns { accessToken, user }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│   FRONTEND stores accessToken (localStorage/sessionStorage)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        4. All subsequent requests include:
           Authorization: Bearer <accessToken>
```

---

## Using the Token

After login, include the `accessToken` in all protected API requests:

```javascript
// Example using fetch
const response = await fetch('http://localhost:8000/api/v1/get-profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

```javascript
// Example using axios
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

// Or per-request
const response = await axios.get('/api/v1/get-profile', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

---

## Token Expiry

- **Access Token**: Valid for **1 hour** (configurable in Supabase)
- When token expires, user must login again
- Check for `401` responses to detect expired tokens

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Missing or invalid fields |
| `401` | Unauthorized - Invalid credentials or token |
| `404` | Not Found - User not found |
| `500` | Server Error |

---

## User Roles

| Role | Description |
|------|-------------|
| `USER` | Default role assigned on signup |
| `MANAGER` | Can manage team tasks |
| `ACCOUNTANT` | Financial access |
| `ADMIN` | Full system access, can create projects |

> **Note**: Roles are managed directly in the database. Only `ADMIN` users can create projects and manage project members.
