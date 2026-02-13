# Frontend - React + TypeScript + Vite

## Authentication System with ImageKit Integration

This is the frontend for the MERN stack authentication application with image upload capabilities.

## Features

- ✅ User Registration with OTP Verification
- ✅ Email Verification (6-digit OTP)
- ✅ Login/Logout with JWT
- ✅ Password Reset with OTP (not reset link)
- ✅ Change Password (for logged-in users)
- ✅ User Profile Management
- ✅ Image Upload with ImageKit CDN
- ✅ Protected Routes
- ✅ Responsive UI with Tailwind CSS

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api

# ImageKit Configuration (see IMAGEKIT_SETUP_GUIDE.md)
VITE_IMAGEKIT_PUBLIC_KEY=your_public_key_here
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### 3. ImageKit Setup (CRITICAL!)

**⚠️ IMPORTANT:** You MUST enable "Unauthenticated upload" in ImageKit or uploads will fail!

**Quick Setup:**

1. Create account at https://imagekit.io/
2. Go to https://imagekit.io/dashboard/settings/media-library
3. **Enable "Unauthenticated upload"** toggle
4. Get Public Key from https://imagekit.io/dashboard/developer/api-keys
5. Get URL Endpoint from dashboard
6. Add both to `.env` file
7. Restart dev server

**Detailed Guide:** See [IMAGEKIT_SETUP_GUIDE.md](../IMAGEKIT_SETUP_GUIDE.md) for complete instructions

**Note:** The app works without ImageKit, but image upload will show a configuration message.

### 4. Start Development Server

```bash
npm run dev
```

The app will run on `http://localhost:5173` (or next available port)

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ImageUpload.tsx        # ImageKit image upload
│   │   └── ProtectedRoute.tsx     # Route protection
│   ├── context/
│   │   └── AuthContext.tsx        # Auth state management
│   ├── pages/
│   │   ├── Register.tsx           # Registration with OTP
│   │   ├── VerifyOTP.tsx          # Email verification
│   │   ├── Login.tsx              # User login
│   │   ├── ForgotPassword.tsx     # Password reset with OTP
│   │   ├── ChangePassword.tsx     # Change password
│   │   ├── Profile.tsx            # Profile with image upload
│   │   └── Home.tsx               # Dashboard
│   ├── services/
│   │   └── api.ts                 # API service layer
│   ├── App.tsx                    # Routes & providers
│   └── main.tsx                   # Entry point
├── .env                            # Environment variables
├── .env.example                    # Template
└── package.json
```

---

## Authentication Flow

### Registration & Verification

1. User registers with name, email, password
2. **OTP sent to email** (6-digit code, expires in 10 minutes)
3. User enters OTP to verify email
4. JWT token stored in localStorage
5. Welcome email sent
6. User redirected to home

### Login

1. User enters email and password
2. Backend validates credentials
3. Checks if email is verified
4. Returns JWT token and user data
5. Token stored in localStorage
6. User redirected to home

### Password Reset (OTP-Based)

1. User enters email on forgot password page
2. **OTP sent to email** (not a reset link!)
3. User enters OTP + new password + confirm password
4. Backend verifies OTP and updates password
5. User redirected to login
6. No reset links or tokens needed

### Change Password (Logged-in)

1. User clicks "Change Password" on profile
2. Enters current password + new password
3. Backend verifies current password
4. Updates password
5. User remains logged in

---

## ImageKit Integration

### How It Works

1. User clicks "Upload Image" on Profile page
2. **Image uploaded directly to ImageKit CDN** (browser → ImageKit)
3. ImageKit returns the permanent image URL
4. Frontend sends only the URL to backend API
5. Backend saves URL to user profile
6. Image displayed from ImageKit CDN worldwide

### Setup Requirements

**MUST DO:** Enable "Unauthenticated upload" in ImageKit settings!

Without this, you'll get: `Missing token for upload` error

**Fix:**

- Go to https://imagekit.io/dashboard/settings/media-library
- Toggle ON "Unauthenticated upload"
- Save changes

### Benefits

- ⚡ Fast CDN delivery worldwide
- 🎨 Automatic image optimization
- 📦 No server storage needed (saves backend resources)
- 🔒 Secure uploads
- 🌍 Global CDN network
- 💰 Free tier: 20GB bandwidth + 20GB storage

### Validation

- Max file size: 5MB
- Allowed formats: JPG, PNG, GIF, WebP
- Client-side validation before upload
- Preview shown immediately

---

## API Integration

Backend API at `http://localhost:5000/api`

### Authentication Endpoints

- `POST /auth/register` - Register with OTP
- `POST /auth/verify-otp` - Verify email OTP
- `POST /auth/resend-otp` - Resend OTP
- `POST /auth/login` - Login user
- `POST /auth/forgot-password` - Send password reset OTP
- `POST /auth/reset-password` - Reset with OTP
- `POST /auth/change-password` - Change password (protected)
- `GET /auth/me` - Get current user (protected)

### Profile Endpoints

- `GET /profile` - Get profile (protected)
- `PUT /profile` - Update profile + avatar URL (protected)
- `DELETE /profile` - Delete account (protected)
- `GET /profile/stats` - Get stats (protected)

---

## Environment Variables

| Variable                     | Description           | Required    |
| ---------------------------- | --------------------- | ----------- |
| `VITE_API_URL`               | Backend API URL       | Yes         |
| `VITE_IMAGEKIT_PUBLIC_KEY`   | ImageKit public key   | For uploads |
| `VITE_IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint | For uploads |

---

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **ImageKit React SDK** - Image upload & CDN

---

## Key Features Explained

### Protected Routes

Routes requiring authentication redirect to login automatically. Uses `ProtectedRoute` wrapper component.

### Auth Context

Global authentication state with React Context. Provides:

- Current user data
- Login/logout functions
- Token management
- Auto token injection in API calls

### Image Upload Component

Reusable `ImageUpload` component with:

- Direct upload to ImageKit
- Image preview
- Progress indicator
- File validation (type & size)
- Error handling
- Fallback for missing credentials

### API Service Layer

Centralized Axios instance with:

- Automatic token injection
- Base URL configuration
- Request/response interceptors
- Type-safe API methods

---

## Development

### Hot Module Replacement

Vite provides instant HMR - changes reflect immediately without page reload.

### TypeScript

All components use TypeScript for type safety. Interfaces defined for API responses and props.

### Tailwind CSS

Utility-first CSS - all styling with Tailwind classes. Responsive by default.

---

## Production Build

```bash
npm run build
```

Output in `dist/` directory. Deploy to:

- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Any static hosting

**Important:** Set environment variables on hosting platform!

---

## Troubleshooting

### ImageKit "Missing token" Error

**Solution:** Enable "Unauthenticated upload" in ImageKit

1. https://imagekit.io/dashboard/settings/media-library
2. Toggle ON "Unauthenticated upload"
3. Save and try again

### API Connection Failed

- Ensure backend running on port 5000
- Check `VITE_API_URL` in `.env`
- Verify CORS enabled in backend

### Images Not Displaying

- Check ImageKit URL is correct
- Verify image uploaded successfully
- Check browser console for errors
- Ensure URL saved to database

### OTP Not Received

- Check email in spam folder
- Verify Gmail credentials in backend `.env`
- Check backend logs for email errors

### Token Expired

- JWT tokens expire in 30 days
- User must login again
- Token automatically removed on expiry

---

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## Support

- **ImageKit Setup:** See [IMAGEKIT_SETUP_GUIDE.md](../IMAGEKIT_SETUP_GUIDE.md)
- **Backend API:** See [backend/API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md)
- **Backend Setup:** See [backend/README.md](../backend/README.md)
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **ImageKit React SDK** - Image upload
