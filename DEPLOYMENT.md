# Deployment

The app deploys as two services:

- `backend`: FastAPI API, deployed as a Render web service.
- `frontend`: Next.js UI, deployed as a Vercel project with root directory `frontend`.

## Backend: Render

Use the repository's `render.yaml` blueprint.

After Render creates the service, verify the API:

```text
https://<render-service>.onrender.com/health
https://<render-service>.onrender.com/api/lookup?ccn=686123
```

The backend allows localhost plus Vercel preview/production URLs through:

```text
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ORIGIN_REGEX=https://.*\.vercel\.app
```

## Frontend: Vercel

Import the GitHub repo into Vercel and set:

```text
Root Directory: frontend
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
```

Set this environment variable in Vercel:

```text
NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com
```

Deploy, then test CCN `686123` and download the PDF.
