# TreeFolks User Portal

A full-stack application for tracking tree planting projects with Airtable integration, designed for TreeFolks.

## 🚀 Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Client SDK
- **State/API**: Standard React Hooks & Fetch

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database/Integrations**: 
  - Airtable (via `airtable` SDK)
  - Firebase Admin SDK (Authentication & User Data)
  - Cloudinary (Image Management)

## 📂 Project Structure

```
root/
├── backend/               # Node.js + Express API server
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth & validation middleware
│   ├── routes/            # API route definitions
│   ├── services/          # External services (Airtable, Cloudinary)
│   └── uploads/           # Temp storage for uploads
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Feature-specific modules (auth, admin, etc.)
│   │   ├── services/      # API client services
│   │   └── ...
├── documentation/         # Project documentation files
├── mock_data/             # Utilities/Config for local testing
└── README.md             # This file
```

## ⚡ Quick Start

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   Create a `.env` file in `backend/` with the following:
   ```env
   PORT=3000
   
   # Airtable Configuration
   AIRTABLE_PAT=your_personal_access_token
   AIRTABLE_BASE_ID=your_base_id
   AIRTABLE_TABLE_ID=your_table_id
   
   # Firebase Admin
   # JSON string of your service account key
   FIREBASE_SERVICE_ACCOUNT_JSON={"type": "service_account", ...}
   
   # Cloudinary (If applicable)
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   Runs on `http://localhost:3000`

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Runs on `http://localhost:5173`

## 🔐 Authentication Workflow

1. **Firebase Project**: The app uses Firebase Auth (Email/Password) and Firestore.
   - Client Config: `frontend/src/firebase.js` (Update this if changing projects).
   - Backend Config: Uses `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable.

2. **User Data**:
   - Users are stored in Firestore `users/{uid}` collection.
   - Fields: `username`, `email`, `isAdmin` (boolean).
   - **Initial Admin**: The UID `v0uqBwBApQVhBTLSaweNTonHnnH2` is hardcoded as a seed admin in `frontend/src/firebase.js`.

3. **Backend Verification**:
   - All API routes in `backend/routes/airtableRoutes.js` are protected via `authenticateRequest` middleware.
   - Admin-only routes (POST, DELETE, PATCH) are further protected by `requireAdmin`.

## 🛠️ Mock Data & Testing

- The `mock_data` directory contains an `.env` file that can be used for reference or by local utility scripts.

## 🚢 Heroku Deployment

This project supports combined deployment to Heroku (frontend + backend as a single app).

### One-Time Setup

```bash
# 1. Login to Heroku
heroku login

# 2. Create a new Heroku app
heroku create your-app-name

# 3. Set environment variables
heroku config:set \
  NODE_ENV=production \
  AIRTABLE_PAT=your_personal_access_token \
  AIRTABLE_BASE_ID=your_base_id \
  AIRTABLE_TABLE_ID=your_table_id \
  AIRTABLE_SEASON_FIELD_ID=your_field_id \
  AIRTABLE_API_URL=https://api.airtable.com \
  FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
  CLOUDINARY_URL=cloudinary://key:secret@cloud_name

# 4. Deploy
git push heroku main
```

### What Happens on Deploy

1. Heroku runs `npm install` at root level
2. `heroku-postbuild` script builds the frontend (`frontend/dist`)
3. Express server starts and serves both API routes (`/api/*`) and frontend static files

### Updating the App

```bash
# Make changes, commit, then push
git add .
git commit -m "Your changes"
git push heroku main
```

### Viewing Logs

```bash
heroku logs --tail
```
- When running locally, ensure your backend `.env` is properly configured to avoid API errors.