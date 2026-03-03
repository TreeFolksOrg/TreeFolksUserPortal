# TreeFolks User Portal - Frontend

> **For new developers:** This README is your guide to understanding the frontend codebase. Read through it before diving into the code—it will save you hours of confusion!

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Project Structure](#project-structure)
4. [High-Level Architecture](#high-level-architecture)
5. [How Frontend Talks to Backend](#how-frontend-talks-to-backend)
6. [Authentication Flow](#authentication-flow)
7. [URL Routes & What They Do](#url-routes--what-they-do)
8. [External Services - Complete Guide](#external-services---complete-guide)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)
11. [Tips for AI-Assisted Development](#tips-for-ai-assisted-development)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (see Environment Variables section below)

# 3. Start development server
npm run dev

# App runs at http://localhost:5173
```

**Prerequisites:**
- Node.js 18+
- Backend server running on `localhost:3000` (see [backend README](../backend/README.md))
- Firebase project configured (see External Services section)

---

## Environment Variables

You need environment files for both the **frontend** and **backend**. Here are templates with placeholder values:

### Frontend `.env` (create at `frontend/.env`)

```bash
# Backend API URL - where the Express server runs
VITE_API_BASE_URL=http://localhost:3000

# API route prefix (usually /api)
VITE_API_PREFIX=/api
```

> **Note:** Frontend environment variables MUST start with `VITE_` to be accessible in the browser.

### Backend `.env` (create at `backend/.env`)

```bash
# ============================================
# AIRTABLE CONFIGURATION
# ============================================
# Personal Access Token - get from https://airtable.com/create/tokens
AIRTABLE_PAT=patXXXXXXXXXXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Base ID - from your Airtable URL: https://airtable.com/appXXXXXXXXXXXXXX/...
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# Table ID - from your Airtable URL: https://airtable.com/.../tblXXXXXXXXXXXXXX/...
AIRTABLE_TABLE_ID=tblXXXXXXXXXXXXXX

# Season Field ID - run the script in Backend README to find this
AIRTABLE_SEASON_FIELD_ID=fldXXXXXXXXXXXXXX

# Airtable API URL (usually don't change this)
AIRTABLE_API_URL=https://api.airtable.com

# ============================================
# FIREBASE / AUTHENTICATION
# ============================================
# Service Account JSON - download from Firebase Console > Project Settings > Service Accounts
# IMPORTANT: Must be on a single line with escaped quotes!
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"xxxx","private_key":"-----BEGIN PRIVATE KEY-----\nXXXX\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com","universe_domain":"googleapis.com"}

# ============================================
# CLOUDINARY (File Upload Bridge)
# ============================================
# Get from Cloudinary Dashboard: https://console.cloudinary.com
# Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwx@your-cloud-name

# ============================================
# SERVER
# ============================================
PORT=3000
```

### Where to Get Each Credential

| Variable | Where to Get It |
|----------|-----------------|
| `AIRTABLE_PAT` | [Airtable Tokens](https://airtable.com/create/tokens) → Create token with `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write` scopes |
| `AIRTABLE_BASE_ID` | From your table URL: `https://airtable.com/appXXXXXXXXXXXX/...` |
| `AIRTABLE_TABLE_ID` | From your table URL: `https://airtable.com/.../tblXXXXXXXXXXXX/...` |
| `AIRTABLE_SEASON_FIELD_ID` | Run the script in [Backend README](../backend/README.md) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `CLOUDINARY_URL` | Cloudinary Dashboard → Account Details → API Environment Variable |

---

## Project Structure

This is the complete folder structure of the frontend. **Study this carefully** before making changes.

```
frontend/
├── public/                          # Static assets (served as-is)
│   └── vite.svg                     # Vite favicon
│
├── src/
│   ├── main.jsx                     # App entry point - wraps App in providers
│   ├── App.jsx                      # Router - defines all URL routes
│   ├── firebase.js                  # Firebase config and helper functions
│   ├── index.css                    # Global styles (Tailwind imports)
│   ├── pdfWorker.js                 # PDF.js web worker config
│   │
│   ├── assets/                      # Images/icons imported by components
│   │   └── icons/                   # SVG icons
│   │
│   ├── contexts/                    # React Context providers
│   │   └── ToastContext.jsx         # Toast notification system (used by comments)
│   │
│   ├── services/                    # API communication layer
│   │   ├── apiClient.js             # Axios instance with auth headers
│   │   ├── apiService.js            # Re-exports all services
│   │   ├── apiHelpers.js            # Caching and data normalization
│   │   ├── projectService.js        # Project CRUD operations
│   │   ├── seasonService.js         # Season management
│   │   ├── documentService.js       # File upload/delete
│   │   └── landownerService.js      # Landowner-specific endpoints
│   │
│   ├── components/                  # Shared, reusable UI components
│   │   ├── common/                  # General-purpose components
│   │   │   ├── Carousel.jsx         # Image slideshow
│   │   │   ├── DateSelectionModal.jsx # Date picker popup
│   │   │   ├── InfoCard.jsx         # Card container with title
│   │   │   ├── InfoField.jsx        # Label + value display row
│   │   │   ├── Lightbox.jsx         # Full-screen image viewer
│   │   │   ├── Toast.jsx            # Notification message component
│   │   │   └── UserAvatar.jsx       # User profile picture/initials
│   │   │
│   │   └── ui/                      # UI primitives
│   │       └── SearchBar.jsx        # Search input
│   │
│   ├── pages/                       # Shared pages (admin & landowner)
│   │   ├── Map.jsx                  # Map view
│   │   └── PhotoGallery.jsx         # Photo gallery
│   │
│   └── features/                    # Feature modules (domain-driven)
│       │
│       ├── auth/                    # Authentication
│       │   ├── AuthProvider.jsx     # Auth context provider
│       │   ├── ProtectedRoute.jsx   # Route guard
│       │   └── pages/
│       │       ├── LoginPage.jsx    # Login/signup form
│       │       └── AccountPage.jsx  # Account settings
│       │
│       ├── admin/                   # Admin-only features
│       │   ├── constants/
│       │   │   └── projectConstants.js  # Document slots, timeline phases
│       │   │
│       │   ├── utils/
│       │   │   ├── projectHelpers.js    # Date formatting, array helpers
│       │   │   └── pdfEditorHelpers.js  # PDF annotation utilities
│       │   │
│       │   ├── hooks/               # Custom React hooks
│       │   │   ├── useProjectData.js       # Fetch project + error handling
│       │   │   ├── useDocumentManagement.js# Upload/delete documents
│       │   │   ├── usePhotoManagement.js   # Photo uploads with dates
│       │   │   ├── usePdfEditor.js         # PDF editor state
│       │   │   └── useCommentLogic.js      # Draft map comments
│       │   │
│       │   ├── components/          # Admin UI components
│       │   │   ├── AdminSidebar.jsx       # Navigation sidebar
│       │   │   ├── SeasonCard.jsx         # Season card on dashboard
│       │   │   ├── ProjectCard.jsx        # Project preview card
│       │   │   ├── DocumentTile.jsx       # Document upload/view slot
│       │   │   ├── PdfEditor.jsx          # PDF/image annotation editor
│       │   │   ├── DraftMapCommentModal.jsx # Comment input modal
│       │   │   ├── PhotoUploadButton.jsx  # Upload button with loading
│       │   │   └── MediaGridItem.jsx      # Photo thumbnail
│       │   │
│       │   ├── layouts/
│       │   │   └── AdminLayout.jsx        # Sidebar + content wrapper
│       │   │
│       │   └── pages/               # Admin pages
│       │       ├── AdminDashboard.jsx     # Season cards (/admin/dashboard)
│       │       ├── SeasonProjectList.jsx  # Projects list (/admin/seasons/:year)
│       │       └── ProjectDetail.jsx      # Project view (/admin/project/:id)
│       │
│       └── landowner/               # Landowner-only features
│           ├── components/
│           │   ├── LandownerSidebar.jsx   # Simplified navigation
│           │   └── ProjectSelector.jsx    # Multi-project dropdown
│           │
│           ├── layouts/
│           │   └── LandownerLayout.jsx    # Sidebar + content
│           │
│           └── pages/
│               └── LandownerDashboard.jsx # Landowner home
│
└── .env                             # Environment variables (create this!)
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                       │
│                              http://localhost:5173                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐  │
│   │   App.jsx   │────▶│  Layouts    │────▶│         Pages               │  │
│   │   (Router)  │     │  (Sidebar)  │     │  (Dashboard, ProjectDetail) │  │
│   └─────────────┘     └─────────────┘     └─────────────────────────────┘  │
│         │                                            │                     │
│         ▼                                            ▼                     │
│   ┌─────────────────┐                    ┌─────────────────────────────┐  │
│   │  AuthProvider   │                    │       Custom Hooks           │  │
│   │  (Firebase Auth)│                    │  (useProjectData, etc.)      │  │
│   └─────────────────┘                    └─────────────────────────────┘  │
│                                                      │                     │
│                                                      ▼                     │
│                                         ┌─────────────────────────────┐   │
│                                         │     Services (API Layer)     │   │
│                                         │  (projectService, etc.)      │   │
│                                         └─────────────────────────────┘   │
│                                                      │                     │
│                                                      ▼                     │
│   ┌──────────────────────────────────────────────────────────────────────────────┐
│   │                              BACKEND (Express + Node.js)                     │
│   │                              http://localhost:3000/api                       │
│   ├──────────────────────────────────────────────────────────────────────────────┤
│   │               Routes → Controllers → Services → Airtable/Cloudinary          │
│   └──────────────────────────────────────────────────────────────────────────────┘
```

**The Flow:**
1. User visits a URL (e.g., `/admin/project/rec123`)
2. `App.jsx` routes to the correct page based on URL
3. Page uses **custom hooks** to fetch and manage data
4. Hooks call **services** which make HTTP requests to the backend
5. Backend fetches/modifies data in **Airtable** and handles files via **Cloudinary**
6. Data flows back up to the page and renders

---

## How Frontend Talks to Backend

### The API Client (`src/services/apiClient.js`)

Every API request goes through a single **axios client** that:
1. Automatically adds the Firebase auth token to every request
2. Points to the backend URL from environment variables

```javascript
// How it works under the hood:
const response = await apiClient.get('/projects/season/25-26');
// Actually sends: GET http://localhost:3000/api/projects/season/25-26
// With header: Authorization: Bearer <firebase-token>
```

### Service Files Structure

Services are organized by domain:

| Service File | What It Handles |
|-------------|-----------------|
| `projectService.js` | CRUD operations for projects |
| `seasonService.js` | Fetching and managing seasons |
| `documentService.js` | Uploading, replacing, and deleting files (supports versioning) |
| `landownerService.js` | Landowner-specific endpoints |
| `apiHelpers.js` | Caching, normalization utilities |
| `apiService.js` | Re-exports everything (legacy) |

**Example: Fetching project details**
```javascript
import { getProjectDetails } from '../services/projectService';

const project = await getProjectDetails('rec123abc');
// Returns: { id, ownerDisplayName, email, draftMapUrl, ... }
```

---

## Authentication Flow

### How Login Works

```
┌────────────────┐      ┌──────────────────┐      ┌────────────────┐
│  User enters   │─────▶│ Firebase Auth    │─────▶│ Firestore      │
│  email/password│      │ verifies login   │      │ fetches profile│
└────────────────┘      └──────────────────┘      └────────────────┘
                                                          │
                                                          ▼
                                                   { isAdmin: true/false }
```

1. User logs in via Firebase (`LoginPage.jsx`)
2. Firebase returns a **JWT token**
3. `AuthProvider.jsx` fetches user profile from Firestore
4. The `isAdmin` field determines what the user can see

### Two User Types

| Role | What They See | What They Can Do |
|------|--------------|------------------|
| **Admin** | All seasons, all projects | View all data, upload any document, delete files |
| **Landowner** | Only their own projects | View project, upload draft maps & photos, add comments |

### Key Auth Files

| File | Purpose |
|------|---------|
| `src/firebase.js` | Firebase configuration and initialization |
| `src/features/auth/AuthProvider.jsx` | Wraps app, provides `user`, `isAdmin`, `signOut()` |
| `src/features/auth/ProtectedRoute.jsx` | Guards routes based on auth state |
| `src/features/auth/pages/LoginPage.jsx` | Login/signup form |

### Using Auth in Components

```javascript
import { useAuth } from '../features/auth/AuthProvider';

function MyComponent() {
  const { user, isAdmin, signOut } = useAuth();
  
  if (isAdmin) {
    return <AdminView />;
  }
  return <LandownerView />;
}
```

#### Creating Admin Users

By default, new users are NOT admins. There are two ways to make someone an admin:

**Method 1: via Code (Recommended for Devs)**
1. Open `frontend/src/firebase.js`
2. Add the user's UID to the `ADMIN_UIDS` array
3. When they log in next, their profile will automatically be updated to `isAdmin: true`

**Method 2: via Firestore Console (Manual)**
1. Go to Firestore in Firebase Console
2. Find collection `users` → document with user's UID
3. Add or edit field: `isAdmin: true` (boolean)

---

## URL Routes & What They Do

### Admin Routes (`/admin/...`)

| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/dashboard` | `AdminDashboard.jsx` | Shows all seasons as cards. Click a season to see its projects. |
| `/admin/seasons/25-26` | `SeasonProjectList.jsx` | Lists all projects for the "25-26" season as cards. |
| `/admin/project/rec123` | `ProjectDetail.jsx` | Full project view with photos, documents, landowner info, timeline. |
| `/admin/gallery` | `PhotoGallery.jsx` | Photo gallery across all projects. |
| `/admin/map` | `Map.jsx` | Map view of project locations. |
| `/admin/account` | `AccountPage.jsx` | User account settings. |

### Landowner Routes (`/landowner/...`)

| URL | Component | Description |
|-----|-----------|-------------|
| `/landowner/dashboard` | `LandownerDashboard.jsx` | Redirects to their project or shows project selector. |
| `/landowner/project/rec123` | `ProjectDetail.jsx` | Their project view (same component as admin, with fewer permissions). |
| `/landowner/gallery` | `PhotoGallery.jsx` | Photo gallery. |
| `/landowner/map` | `Map.jsx` | Map view. |
| `/landowner/account` | `AccountPage.jsx` | Account settings. |

### Public Routes

| URL | Component | Description |
|-----|-----------|-------------|
| `/login` | `LoginPage.jsx` | Login/signup form. No auth required. |
| `/` | Redirects | Redirects to `/admin/dashboard` or `/landowner/dashboard` based on auth. |

---

## External Services - Complete Guide

This section covers all the external services the TreeFolks portal uses. If you're setting this up from scratch, follow each service's setup guide in order.

### Services Overview

| Service | Purpose | Configured In |
|---------|---------|---------------|
| **Airtable** | Database - stores all project data | Backend `.env` |
| **Cloudinary** | Temporary file hosting for uploads | Backend `.env` |
| **Firebase Auth** | User login/logout | Frontend `firebase.js` + Backend `.env` |
| **Firestore** | User profiles & admin roles | Same Firebase project |

---

### 1. Airtable (Database)

**What is Airtable?**
Airtable is a spreadsheet-database hybrid. Think of it as a Google Sheet with superpowers—each row is a "record" (like a project), and fields can hold text, dates, attachments (files), and more.

**What TreeFolks stores in Airtable:**
- All project data (landowner info, dates, acreage, tree counts)
- Seasons (as a dropdown/single-select field)
- Attached files (draft maps, photos, final reports)—Airtable hosts these after we upload

**How the frontend interacts:**
- Frontend **NEVER** talks to Airtable directly
- All requests go through our Express backend (via `/api/...` endpoints)
- Backend translates field names (camelCase in code ↔ "Human Readable Names" in Airtable)

**Key Airtable concepts:**
| Term | What It Means |
|------|---------------|
| **Base** | Like a database—contains multiple tables |
| **Table** | Like a SQL table or spreadsheet tab |
| **Record** | A single row, has a unique ID starting with `rec` |
| **Field** | A column (text, number, date, attachment, etc.) |
| **Attachment** | Files stored in an array. Airtable hosts them on `airtableusercontent.com` |

---

### 2. Cloudinary (File Hosting)

**What is Cloudinary?**
Cloudinary is a cloud service that hosts images, videos, and documents. We use it as a **temporary middleman** for file uploads because Airtable can't accept file uploads directly—it only accepts **public URLs**.

**Why TreeFolks needs Cloudinary:**
1. User uploads a file (PDF, photo) in the browser
2. Frontend sends file data to our backend
3. Backend uploads to Cloudinary → gets a public URL
4. Backend tells Airtable "here's the URL" → Airtable downloads & hosts it
5. After Airtable has the file (~60-300 seconds), we delete it from Cloudinary

This way, files end up on Airtable's servers (free hosting), and Cloudinary is just a bridge.

**File upload flow diagram:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FILE UPLOAD FLOW                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User selects file               2. Frontend sends to backend            │
│     ┌─────────────┐                    ┌─────────────────────┐              │
│     │  Browser    │  base64 data       │  Express Backend    │              │
│     │  (React)    │ ──────────────────▶│  /api/.../documents │              │
│     └─────────────┘                    └─────────────────────┘              │
│                                                 │                            │
│                                                 │ 3. Upload to Cloudinary    │
│                                                 ▼                            │
│                                        ┌─────────────────────┐              │
│                                        │  Cloudinary         │              │
│                                        │  (temporary host)   │              │
│                                        └─────────────────────┘              │
│                                                 │                            │
│                                                 │ returns public URL         │
│                                                 ▼                            │
│                                        4. Send URL to Airtable               │
│                                        ┌─────────────────────┐              │
│                                        │  Airtable           │              │
│                                        │  (downloads file)   │              │
│                                        └─────────────────────┘              │
│                                                 │                            │
│                                                 │ File now hosted on         │
│                                                 │ airtableusercontent.com    │
│                                                 ▼                            │
│                                        5. Delete from Cloudinary             │
│                                           (after 60-300 second delay)        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Cloudinary Setup Guide (Start to Finish)

**Step 1: Create a Cloudinary Account**
1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up For Free"
3. Fill out the form (use your TreeFolks email)
4. Verify your email

**Step 2: Update Permissions**
1. Click the settings/gear icon on the bottom left
2. Click security on the side panel
3. Enable PDF and Zip File delivery
4. Press save
![alt text](<Screenshot 2026-01-30 at 1.46.34 PM.png>)

**Step 2: Get Your Credentials**
1. Log into [Cloudinary Console](https://console.cloudinary.com)


2. On the Dashboard, you'll see three key values:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdef123456-ghijkl789`)

3. **IMPORTANT:** Keep the API Secret private! Never commit it to GitHub.

**Step 3: Configure the Backend**

Add to `backend/.env`:
```bash
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# Example:
CLOUDINARY_URL=cloudinary://123456789012345:abcdef123456-ghijkl789@dxyz123abc
```

**Step 4: Test the Configuration**
1. Restart the backend server: `node server.js`
2. Try uploading a file through the frontend
3. Check the server logs—you should see upload success messages

#### Cloudinary Free Tier Limits

| Resource | Free Limit |
|----------|------------|
| Storage | 25 GB |
| Monthly bandwidth | 25 GB |
| Transformations | 25,000/month |

This is plenty for TreeFolks since files are only temporary (~60-300 seconds).

---

### 3. Firebase (Authentication & User Profiles)

**What is Firebase?**
Firebase is Google's app development platform. We use two services:
- **Firebase Auth**: Handles login/logout, password reset, session tokens
- **Firestore**: Stores user profiles (like the `isAdmin` flag)

**How auth works in TreeFolks:**
```
┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  User enters   │────▶│ Firebase Auth    │────▶│ Firestore      │
│  email/password│     │ verifies login   │     │ fetches profile│
└────────────────┘     └──────────────────┘     └────────────────┘
                                                        │
                                                        ▼
                                                 { isAdmin: true/false }
```

#### Firebase Setup Guide (For a New Firebase Project)

**Step 1: Create a Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Name it (e.g., "TreeFolks User Portal")
4. Disable Google Analytics (not needed) or enable if you want
5. Click "Create project"

**Step 2: Enable Authentication**
1. In project sidebar, click "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save

**Step 3: Create Firestore Database**
1. In project sidebar, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location (e.g., `us-central`)
5. Click "Enable"

**Step 4: Set Firestore Security Rules**
1. In Firestore, go to "Rules" tab
2. Replace with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```
3. Click "Publish"

**Step 5: Get Frontend Config**
1. Go to Project Settings (gear icon in sidebar)
2. Scroll to "Your apps" section
3. Click "</>" (Web app icon)
4. Register app (name it "TreeFolks Frontend")
5. Copy the `firebaseConfig` object
6. Update `frontend/src/firebase.js` with your config

**Step 6: Get Backend Service Account**
1. Go to Project Settings → "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file
4. Copy its contents (minified) to backend `.env` as `FIREBASE_SERVICE_ACCOUNT_JSON`

**Important:** The JSON must be on a single line in the `.env` file!

#### Creating Admin Users

By default, new users are NOT admins. There are two ways to make someone an admin:

**Method 1: via Code (Recommended for Devs)**
1. Open `frontend/src/firebase.js`
2. Add the user's UID to the `ADMIN_UIDS` array
3. When they log in next, their profile will automatically be updated to `isAdmin: true`

**Method 2: via Firestore Console (Manual)**
1. Go to Firestore in Firebase Console
2. Find collection `users` → document with user's UID
3. Add or edit field: `isAdmin: true` (boolean)

---

## Common Patterns

### 1. Using Custom Hooks

Most pages use custom hooks to separate logic from UI:

```javascript
// In ProjectDetail.jsx
const {
  project,
  loading,
  error,
  loadProjectDetails,
} = useProjectData(projectId);

const {
  handleDocumentUpload,
  docUploadState,
} = useDocumentManagement(projectId, project, loadProjectDetails);
```

### 2. Conditional Rendering by Role

```javascript
const { isAdmin } = useAuth();

return (
  <div>
    {isAdmin && <button>Delete Project</button>}
    <button>View Details</button>
  </div>
);
```

### 3. Toast Notifications

Toast notifications are used for user feedback (e.g., after submitting a comment):

```javascript
import { useToast } from '../contexts/ToastContext';

function MyComponent() {
  const { addToast } = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      addToast('Saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to save', 'error');
    }
  };
}
```

### 4. Loading States

```javascript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| "401 Unauthorized" on API calls | Firebase token expired—try logging out and back in |
| "Network Error" on all requests | Backend not running—start with `cd backend && node server.js` |
| Changes not showing in browser | Hard refresh (Cmd+Shift+R) or restart dev server |
| "Module not found" errors | Run `npm install`, check import paths |
| Photos/documents not uploading | File too large (>30MB)—compress it |
| "Cloudinary is not configured" | Check `CLOUDINARY_URL` in backend `.env`, restart server |

---

## Available Scripts

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint to find code issues
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **Firebase** | Authentication & user profiles |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |
| **react-pdf** | PDF viewing |
| **PDF-lib** | PDF editing/annotation |

---

## Tips for AI-Assisted Development

This codebase is 99% AI-generated. To maintain velocity and code quality, we recommend:

1.  **Use AI-First IDEs**: Use tools like [Cursor](https://cursor.sh) or Google's Antigravity agentic workflow. They understand the context better than standard copilot plugins.
2.  **Save Frequently**: AI can make mistakes. Commit your working state to Git often. If an AI change breaks something, it's easier to revert to the last working commit than to debug the AI's mess.
3.  **Review AI Changes**: Even "perfect" AI code can introduce subtle bugs or hallucinate imports. Always review the diffs.
