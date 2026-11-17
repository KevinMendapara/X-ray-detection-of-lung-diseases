# Vercel frontend + hosted API

The Vercel deployment hosts the React frontend. Patient registration is handled by the FastAPI backend, so Vercel must call a separately deployed backend. Without that service, `/api/patients` is a Vercel 404.

## 1. Deploy the API

Create a Python web service from this GitHub repository on a backend host such as Render.

- Root directory: repository root
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- Add `CORS_ORIGINS` with the exact Vercel site origin, for example `https://pulmovision.vercel.app` (no path or trailing slash).
- For a Render service with a persistent disk mounted at `/var/data`, set `PULMOVISION_STORAGE_DIR=/var/data` so patient records, uploads, and reports persist there.

Render's free web services have an ephemeral filesystem. Use a persistent disk or a managed database/object store for records and uploaded files that must survive restarts and deploys. Persistent disks require a paid service plan; do not attach one unless you accept its cost.

## 2. Point Vercel at the API

In Vercel, open the frontend project's **Settings → Environment Variables** and add:

```text
VITE_API_BASE_URL=https://YOUR-BACKEND-HOST/api
```

Replace the example with the deployed backend URL, then redeploy the frontend. `VITE_API_BASE_URL` is a public browser setting; never put secrets in it.

For local Vite development, leave this variable unset to use the `/api` proxy, or copy `frontend/.env.example` to `frontend/.env.local` and set the local backend URL.

## Model files

Patient registration only needs the API and its database. This repository excludes trained model weights and clinical datasets. X-ray inference also requires the authorized model artifacts to be provisioned on the backend; do not commit patient images or records to GitHub.
