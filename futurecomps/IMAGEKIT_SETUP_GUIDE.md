# ImageKit Setup Guide

> **⚠️ IMPORTANT:** You must enable "Unauthenticated upload" in ImageKit settings or uploads will fail!

## Quick Fix for "Missing token" Error

If you're getting authentication errors:

1. Go to https://imagekit.io/dashboard/settings/media-library
2. Find **"Upload settings"** section
3. Toggle ON **"Unauthenticated upload"**
4. Save changes
5. Try uploading again

---

## What is ImageKit?

ImageKit is a cloud-based image CDN and management service that provides:

- Image upload and storage
- Automatic image optimization
- CDN delivery
- Image transformations (resize, crop, etc.)
- Free tier with 20GB bandwidth/month

---

## Step-by-Step Setup

### 1. Create ImageKit Account

1. Go to [https://imagekit.io/](https://imagekit.io/)
2. Click **"Sign Up Free"**
3. Sign up using:
   - Email & Password, OR
   - Google account, OR
   - GitHub account
4. Verify your email address

### 2. Get Your Credentials

After signing in, you'll need 3 credentials:

#### A. Public Key

1. Go to **Developer Options** → **API Keys**
2. Copy the **Public Key** (starts with `public_`)
3. This is safe to use in frontend code

#### B. URL Endpoint

1. Go to **Dashboard** or **Settings**
2. Find your **URL Endpoint**
3. Format: `https://ik.imagekit.io/your_imagekit_id`

#### C. Private Key (Backend Only - Optional)

1. Go to **Developer Options** → **API Keys**
2. Copy the **Private Key** (keep this secret!)
3. Only needed if doing server-side operations

### 3. Configure Upload Settings (IMPORTANT!)

1. Go to **Settings** → **Media Library** → **Upload Settings**
2. **Enable "Unauthenticated Upload"** (Required for client-side uploads):
   - Find **"Unauthenticated upload"** section
   - Toggle it **ON** (This allows direct uploads from browser)
3. Configure other settings:
   - **Upload folder**: Where images will be stored (e.g., /avatars)
   - **File size limits**: Maximum file size allowed (recommended: 5MB)
   - **Allowed file types**: jpg, png, gif, webp, etc.

**⚠️ Important:** Without enabling "Unauthenticated upload", you'll get authentication errors!

---

## Required Credentials for This Project

Add these to your frontend `.env` file:

```env
# ImageKit Configuration
VITE_IMAGEKIT_PUBLIC_KEY=your_public_key_here
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

---

## Finding Your Credentials

### Method 1: Dashboard

1. Login to ImageKit
2. Click on your profile (top-right)
3. Go to **Developer Options**
4. Copy **Public Key** and **URL Endpoint**

### Method 2: Settings

1. Login to ImageKit
2. Go to **Settings** → **Developer Options**
3. Find **API Keys** section
4. Copy required credentials

### Method 3: Direct Links

After logging in:

- **API Keys**: https://imagekit.io/dashboard/developer/api-keys
- **Settings**: https://imagekit.io/dashboard/settings

---

## Example Credentials Format

```
Public Key: public_xxxxxxxxxxxxxxxxxxxxxxxxxxx
URL Endpoint: https://ik.imagekit.io/youraccountid
Private Key: private_xxxxxxxxxxxxxxxxxxxxxxxxxxx (backend only)
```

---

## Security Best Practices

✅ **DO:**

- Use Public Key in frontend
- Store Private Key in backend `.env` only
- Use authentication for uploads in production
- Validate file types and sizes on both client and server

❌ **DON'T:**

- Share Private Key publicly
- Commit Private Key to Git
- Allow unlimited file sizes
- Skip file type validation

---

## Testing Your Setup

After getting credentials:

1. **Enable Unauthenticated Upload** in ImageKit:

   - Go to Settings → Media Library → Upload Settings
   - Turn ON "Unauthenticated upload"
   - Save changes

2. Add credentials to `frontend/.env`:

```env
VITE_IMAGEKIT_PUBLIC_KEY=your_actual_public_key
VITE_IMAGEKIT_URL_ENDPOINT=your_actual_url_endpoint
```

3. Restart your development server:

```bash
npm run dev
```

4. Try uploading an image in the Profile page

---

## Troubleshooting

### Error: "Missing token for upload"

**Solution:** Enable "Unauthenticated upload" in ImageKit settings:

1. Go to https://imagekit.io/dashboard/settings/media-library
2. Scroll to "Upload settings"
3. Toggle ON "Unauthenticated upload"
4. Save and try again

### Error: "Failed to load resource: 404"

**Solution:** Check your credentials:

- Verify VITE_IMAGEKIT_PUBLIC_KEY is correct
- Verify VITE_IMAGEKIT_URL_ENDPOINT is correct
- Restart development server after changing .env

### Images not uploading

**Checklist:**

- [ ] Unauthenticated upload is enabled in ImageKit
- [ ] Public Key and URL Endpoint are correct in .env
- [ ] Development server was restarted after .env changes
- [ ] File size is under 5MB
- [ ] File type is supported (JPG, PNG, GIF, WebP)

---

## Free Tier Limits

ImageKit Free Plan includes:

- ✅ 20GB bandwidth per month
- ✅ 20GB storage
- ✅ Unlimited image transformations
- ✅ CDN delivery worldwide
- ✅ Image optimization

This is plenty for development and small-medium projects!

---

## Quick Setup Checklist

- [ ] Create ImageKit account at https://imagekit.io
- [ ] Verify email
- [ ] **Enable "Unauthenticated upload"** in Settings → Media Library
- [ ] Copy Public Key from Dashboard → Developer Options
- [ ] Copy URL Endpoint from Dashboard
- [ ] Add both to `frontend/.env`
- [ ] Restart development server (`npm run dev`)
- [ ] Test image upload on Profile page

**Most Common Issue:** Forgetting to enable "Unauthenticated upload" - make sure it's ON!

---

## Support & Documentation

- **Official Docs**: https://docs.imagekit.io/
- **Upload Settings**: https://imagekit.io/dashboard/settings/media-library
- **API Keys**: https://imagekit.io/dashboard/developer/api-keys
- **Dashboard**: https://imagekit.io/dashboard
- **Support**: support@imagekit.io

---

## What's Next?

Once you have your credentials:

1. **Enable "Unauthenticated upload"** in ImageKit settings (CRITICAL!)
2. Add credentials to `frontend/.env`
3. Restart development server
4. The image upload component will be automatically configured
5. You can upload images from the Profile page
6. Images will be stored on ImageKit CDN
7. Only the image URL will be sent to your backend
