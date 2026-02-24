<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12aPiiKKtlxhfWF_y8JmSJl5tBkYYtGjC

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` (or `.env`) and set:
   - `NEXT_PUBLIC_GEMINI_API_KEY` – your Gemini API key (for voice agent). If you previously had `VITE_GEMINI_API_KEY`, use the same value here.
   - `MONGODB_URI` – MongoDB connection string (for saving conversations)
   - `MONGODB_DB_NAME` – optional, defaults to `instaflow_db`
3. Run the app: `npm run dev`

Open [http://localhost:3000](http://localhost:3000). Admin conversations list: [http://localhost:3000/admin/22334412](http://localhost:3000/admin/22334412).

# instaflow
