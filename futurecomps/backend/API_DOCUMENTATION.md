# Authentication API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Register User

**POST** `/auth/register`

Register a new user and send OTP to email.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Registration successful! Please check your email for OTP",
  "userId": "user_id",
  "email": "john@example.com"
}
```

---

### 2. Verify OTP

**POST** `/auth/verify-otp`

Verify email using OTP sent during registration.

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "message": "Email verified successfully!",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": true
  }
}
```

---

### 3. Resend OTP

**POST** `/auth/resend-otp`

Resend OTP to email if previous one expired.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "message": "OTP sent successfully! Please check your email"
}
```

---

### 4. Login

**POST** `/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "avatar": "avatar_url",
    "bio": "User bio",
    "isVerified": true
  }
}
```

---

### 5. Forgot Password

**POST** `/auth/forgot-password`

Send OTP to email for password reset.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "message": "Password reset OTP sent to your email",
  "email": "john@example.com"
}
```

---

### 6. Reset Password

**POST** `/auth/reset-password`

Reset password using OTP sent to email.

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "message": "Password reset successful! You can now login with your new password"
}
```

---

### 7. Change Password

**POST** `/auth/change-password`

Change password for logged-in user (requires authentication).

**Headers:**

```
Authorization: Bearer jwt_token_here
```

**Request Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "message": "Password changed successfully!"
}
```

---

### 8. Get Current User

**GET** `/auth/me`

Get current authenticated user details (requires authentication).

**Headers:**

```
Authorization: Bearer jwt_token_here
```

**Response:**

```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "avatar": "avatar_url",
  "bio": "User bio",
  "isVerified": true,
  "createdAt": "2025-12-19T10:00:00.000Z",
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

---

## Profile Endpoints

### 1. Get Profile

**GET** `/profile`

Get user profile (requires authentication and verification).

**Headers:**

```
Authorization: Bearer jwt_token_here
```

**Response:**

```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "avatar": "avatar_url",
  "bio": "User bio",
  "isVerified": true,
  "createdAt": "2025-12-19T10:00:00.000Z",
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

---

### 2. Update Profile

**PUT** `/profile`

Update user profile (requires authentication and verification).

**Headers:**

```
Authorization: Bearer jwt_token_here
```

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "bio": "Updated bio",
  "avatar": "new_avatar_url"
}
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "9876543210",
    "bio": "Updated bio",
    "avatar": "new_avatar_url",
    "isVerified": true,
    "createdAt": "2025-12-19T10:00:00.000Z"
  }
}
```

---

### 3. Delete Account

**DELETE** `/profile`

Delete user account (requires authentication and verification).

**Headers:**

```
Authorization: Bearer jwt_token_here
```

**Request Body:**

```json
{
  "password": "currentpassword123"
}
```

**Response:**

```json
{
  "message": "Account deleted successfully"
}
```

---

### 4. Get Profile Stats

**GET** `/profile/stats`

Get user profile statistics (requires authentication and verification).

**Headers:**

```
Authorization: Bearer jwt_token_here
```

**Response:**

```json
{
  "accountAge": 15,
  "isVerified": true,
  "profileComplete": 100,
  "lastUpdated": "2025-12-19T10:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**

```json
{
  "message": "Error message explaining what went wrong"
}
```

**401 Unauthorized**

```json
{
  "message": "Not authorized, no token"
}
```

**403 Forbidden**

```json
{
  "message": "Please verify your email first",
  "isVerified": false
}
```

**404 Not Found**

```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error**

```json
{
  "message": "Something went wrong!",
  "error": "Error details"
}
```

---

## Authentication Flow

1. **Register**: POST `/auth/register` → Receive OTP via email
2. **Verify OTP**: POST `/auth/verify-otp` → Get JWT token + Welcome email
3. **Login**: POST `/auth/login` → Get JWT token
4. **Access Protected Routes**: Include token in Authorization header

## Password Reset Flow

1. **Forgot Password**: POST `/auth/forgot-password` → Receive OTP via email
2. **Reset Password**: POST `/auth/reset-password` → Enter email, OTP and new password → Password updated
3. **Login**: POST `/auth/login` → Get JWT token

## Notes

- All protected routes require `Authorization: Bearer <token>` header
- OTP expires in 10 minutes
- Reset password token expires in 1 hour
- JWT token expires in 30 days (configurable)
- Profile routes require email verification
