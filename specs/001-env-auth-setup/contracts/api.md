# API Contracts: Environment and Test Auth Setup

**Feature**: 001-env-auth-setup
**Date**: 2026-01-03

## Response Envelope

All API responses follow the Educational API Design principle (Constitution VII):

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
```

## Endpoints

### GET /api/health

Health check endpoint to verify the application and database connection.

**Authentication**: None required

**Request**: No body

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-01-03T12:00:00.000Z"
  }
}
```

**Response (Database Error)**:
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_CONNECTION_ERROR",
    "message": "Unable to connect to database. Check your Supabase configuration.",
    "details": {
      "hint": "Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly"
    }
  }
}
```

---

### POST /api/auth/test-login

Test authentication endpoint for development. Creates or retrieves a user and
establishes a session.

**Authentication**: None (this creates the session)

**Availability**: Only when `NEXT_PUBLIC_ENABLE_TEST_AUTH=true`

**Request Body**:
```json
{
  "email": "developer@example.com",
  "name": "Test Developer"
}
```

**Validation**:
- `email`: Required, valid email format
- `name`: Required, non-empty string

**Response (Success - New User)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "developer@example.com",
      "name": "Test Developer",
      "created_at": "2026-01-03T12:00:00.000Z",
      "updated_at": "2026-01-03T12:00:00.000Z"
    },
    "session": {
      "access_token": "eyJ...",
      "expires_at": "2026-01-03T13:00:00.000Z"
    },
    "is_new_user": true
  }
}
```

**Response (Success - Existing User)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "developer@example.com",
      "name": "Test Developer",
      "created_at": "2026-01-02T10:00:00.000Z",
      "updated_at": "2026-01-02T10:00:00.000Z"
    },
    "session": {
      "access_token": "eyJ...",
      "expires_at": "2026-01-03T13:00:00.000Z"
    },
    "is_new_user": false
  }
}
```

**Response (Validation Error)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "email": "Must be a valid email address",
      "name": "Name is required"
    }
  }
}
```

**Response (Test Auth Disabled)**:
```json
{
  "success": false,
  "error": {
    "code": "TEST_AUTH_DISABLED",
    "message": "Test authentication is not enabled in this environment",
    "details": {
      "hint": "Set NEXT_PUBLIC_ENABLE_TEST_AUTH=true in your environment"
    }
  }
}
```

**Response (Server Error)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred during authentication",
    "details": {
      "hint": "Check server logs for more information"
    }
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request body failed validation |
| TEST_AUTH_DISABLED | 403 | Test auth not enabled in environment |
| DATABASE_CONNECTION_ERROR | 503 | Cannot connect to Supabase |
| INTERNAL_ERROR | 500 | Unexpected server error |

## Client Usage Examples

### Health Check
```javascript
const response = await fetch('/api/health');
const result = await response.json();

if (result.success) {
  console.log('App is healthy:', result.data.status);
} else {
  console.error('Health check failed:', result.error.message);
}
```

### Test Login
```javascript
const response = await fetch('/api/auth/test-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'developer@example.com',
    name: 'Test Developer'
  })
});

const result = await response.json();

if (result.success) {
  // Store session using Supabase client
  const { data: { user, session } } = result;
  console.log('Logged in as:', user.name);
  console.log('New user?', result.data.is_new_user);
} else {
  console.error('Login failed:', result.error.message);
  if (result.error.details) {
    Object.entries(result.error.details).forEach(([field, msg]) => {
      console.error(`  ${field}: ${msg}`);
    });
  }
}
```
