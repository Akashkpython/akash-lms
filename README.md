# Akash LMS

Private personal Learning Management System for MCA coursework. Upload study materials from home, then open them from a college laboratory PC through a browser. The UI is a premium dark SaaS dashboard; every academic record is stored in MongoDB Atlas and files live in a private Cloudflare R2 bucket.

This is a real full-stack application: React frontend, Express API, MongoDB, R2 object storage, JWT authentication, and deployment configs for GitHub Pages + Render.

## Important privacy note

GitHub Pages serves a **public static frontend**. A private GitHub repository does **not** make the live Pages site private. Academic data is protected because:

- Public registration is disabled after the first administrator account is created.
- The API requires a JWT on every private route.
- File uploads and downloads use short-lived presigned R2 URLs. Object URLs are never made public.
- Ownership is checked on the server for every read, update, and delete.

The frontend only stores a session token in the browser. Secrets (MongoDB URI, JWT secret, R2 keys) stay on the backend.

## Features

- First-time administrator setup, email/password login, rate-limited auth
- Dashboard with live counts, activity, deadlines, timetable and favorites
- Semester → subject → topic structure
- Study material upload to Cloudflare R2 with drag-and-drop, progress, preview and download
- Website collection for lecturer practical links
- Notes with debounced autosave and PDF export
- Assignments with pending / in progress / completed / overdue (overdue is computed, never auto-completed)
- Code snippets, SQL library (store/learn only, never executed), terminal commands
- Exam Q&A and weekly timetable
- Favorites, recently opened, recycle bin with restore and retention
- Responsive desktop-first layout with a collapsible sidebar

## Technology stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, Zustand, TanStack Query, React Hook Form-ready Zod, Lucide, Sonner |
| Backend | Node.js, Express 5, TypeScript, Zod validation, Helmet, CORS allowlist, rate limiting |
| Database | MongoDB Atlas + Mongoose |
| Files | Cloudflare R2 via AWS SDK v3, presigned PUT/GET |
| Auth | bcrypt password hashes, JWT in `Authorization: Bearer` (cross-origin safe for GitHub Pages + Render) |
| Frontend host | GitHub Pages + GitHub Actions |
| API host | Render (or any Node host) |

JWT in the `Authorization` header is used instead of cookies so GitHub Pages and the API can live on different origins without relying on cross-site cookies.

## Project structure

```text
.
├── frontend/                 React + Vite app
├── backend/                  Express API
├── .github/workflows/        GitHub Pages deploy
├── .env.example              Placeholder variables
├── render.yaml               Render blueprint
└── README.md
```

## Local development

### Prerequisites

- Node.js 20 or newer
- A MongoDB Atlas cluster (or local MongoDB)
- A Cloudflare R2 bucket for file uploads

### 1. Backend

```bash
cd backend
copy .env.example .env     # Windows
# cp .env.example .env     # macOS/Linux
```

Edit `backend/.env` with real values, then:

```bash
npm install
npm run test
npm run dev
```

API: `http://localhost:8080`  
Health: `GET /api/health`

### 2. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

UI: `http://localhost:5173`

First visit creates the only administrator account. After that, registration is rejected.

## Environment variables

### Backend

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Long random secret (required in production) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `PORT` | API port, default `8080` |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGINS` | Comma-separated frontend origins |
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Private bucket name |
| `R2_ENDPOINT` | Optional custom endpoint |
| `MAX_UPLOAD_BYTES` | Default 50 MB |
| `RECYCLE_RETENTION_DAYS` | Default 30 |
| `PRESIGN_EXPIRES_SECONDS` | Default 120 |

### Frontend (safe to expose)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend origin, e.g. `https://akash-lms-api.onrender.com` |
| `VITE_BASE_PATH` | GitHub Pages base, e.g. `/Akash-LMS/` locally `/` |

Never put MongoDB or R2 secrets in `VITE_` variables.

## MongoDB Atlas setup

1. Create a free M0 cluster.
2. Create a database user.
3. In **Network Access**, allow your home IP, college network if it is stable, and the Render IP / `0.0.0.0/0` if the API host uses dynamic IPs. `0.0.0.0/0` is common on free tiers; protect the cluster with a strong database password.
4. Copy the `mongodb+srv://` URI into `MONGODB_URI`.
5. Free Atlas limits (as of common M0 docs): 512 MB storage, shared CPU. Enough for notes and metadata; files should stay in R2.

## Cloudflare R2 setup

1. In Cloudflare, open **R2** and create a bucket, e.g. `akash-lms`.
2. Keep the bucket **private**. Do not enable public access.
3. Create an R2 API token with **Object Read & Write** on that bucket only.
4. Copy Account ID, Access Key ID, Secret Access Key, and bucket name into backend env vars.
5. Default free-tier R2 includes a monthly class A/B operation budget and 10 GB of storage. This app does not provide unlimited storage.

Upload flow:

1. Browser asks `POST /api/materials/initiate`.
2. API validates type/size, writes metadata, returns a short-lived presigned PUT URL.
3. Browser uploads the file directly to R2.
4. Browser calls `POST /api/materials/:id/complete`.
5. Downloads and previews use presigned GET URLs. Failed R2 deletes never remove the MongoDB record.

## GitHub setup

1. Create a GitHub repository and push this monorepo.
2. Settings → Pages → **GitHub Actions**.
3. Repository **Variables**:
   - `VITE_API_URL` = your Render URL, no trailing slash
   - `VITE_BASE_PATH` = `/<repo-name>/` for project Pages, or `/` for a custom domain / user site
4. The workflow builds `frontend/`, copies `index.html` to `404.html` so client-side routes work, then deploys.

If project Pages routing or public-frontend privacy is unacceptable, host the UI on Cloudflare Pages or Render Static Sites instead, still pointing `VITE_API_URL` at the API. The API remains the security boundary.

## Backend deployment (Render)

1. Create a Web Service from this repo, root directory `backend`.
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Set every backend environment variable in the Render dashboard.
5. Set `CORS_ORIGINS` to the GitHub Pages origin, for example `https://<user>.github.io`.
6. Health check: `/api/health`.

Free Render web services sleep after idle time. The first request after sleep can take ~50 seconds. This is a platform limit, not an application bug.

## Testing

Backend unit tests:

```bash
cd backend
npm test
```

Manual checklist after MongoDB and R2 are connected:

- First-time setup, invalid login, logout, unauthenticated API call (`401`)
- Create semester / subject / topic
- Upload, preview, download, search, rename, recycle, restore, permanent delete
- Notes create, edit, autosave indicator, PDF export
- Assignment overdue calculation without auto-complete
- CRUD + search on websites, snippets, SQL, commands, exam, timetable
- Open the production frontend from a second browser/PC and download a file uploaded at home

## Security notes

- Passwords are hashed with bcrypt (cost 12).
- Auth endpoints are rate-limited.
- Helmet sets standard HTTP security headers.
- CORS is an allowlist.
- NoSQL injection is limited by Mongoose schemas and Zod validation.
- React escaping is the XSS baseline; user HTML is not rendered as markup.
- Recycle retention job skips database deletion if R2 deletion fails.
- Stack traces are hidden when `NODE_ENV=production`.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Frontend loads, login fails | `VITE_API_URL`, CORS origin, API health |
| `R2 is not configured` | Backend R2 env vars |
| Upload 413 | `MAX_UPLOAD_BYTES` or file type |
| GitHub Pages blank/404 on refresh | `VITE_BASE_PATH` and `404.html` fallback |
| Atlas connection error | Network access + URI |
| Render sleep | Wait for cold start, then retry |

## License

Private personal use.
