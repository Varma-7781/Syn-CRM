# NexLead CRM — Firebase Cloud Functions

This directory contains the server-side Cloud Function implementation for secure sales user provisioning using the Firebase Admin SDK.

## Deployment Instructions

1. Ensure the Firebase CLI is installed and logged in:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Select the active Firebase project:
   ```bash
   firebase use crm-syntraxs
   ```
3. Deploy functions:
   ```bash
   npm --prefix functions install
   firebase deploy --only functions
   ```
4. Once deployed, set `VITE_CREATE_SALES_FUNCTION_URL` in `.env` if desired (the frontend will automatically use the Cloud Function endpoint when present, or default to the verified isolated secondary client-provisioning engine).
