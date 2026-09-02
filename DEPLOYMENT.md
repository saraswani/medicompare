# Deployment Guide — MediCompare

MediCompare is fully containerized, serverless-ready, and production-ready for deployment to any cloud provider (**Netlify**, **Render**, **Railway**, **Fly.io**, **Vercel**, **Docker**, or any standard VPS).

---

## 🚀 Why Your Dataset is 100% Included on Netlify

Netlify is primarily a static and serverless platform. To ensure that your entire dataset and price comparisons work seamlessly on Netlify without missing data:

1. **Dual-Mode Resilient Data Layer**: The master Indian medicine dataset and pharmacy directory are bundled directly into `client/src/data/` as well as `server/data/`.
2. **Seamless In-Browser Fallback**: If deployed on Netlify static hosting (or drag-and-drop), the frontend automatically executes search, composition grouping, savings calculation, and store distance math directly in browser memory without requiring an active Express backend.
3. **Netlify Functions v2**: `netlify/functions/api.mjs` is configured in `netlify.toml` to handle `/api/*` requests in serverless mode.
4. **Git Tracking**: `.gitignore` explicitly ensures `server/data/` and `client/src/data/` are tracked and pushed to your Git repository.

---

## ⚡ 1-Click / Quick Deploy Instructions

### 1. Deploying to Netlify (Recommended)
1. Push this repository to GitHub or GitLab.
2. In [Netlify Dashboard](https://app.netlify.com), click **Add new site** → **Import an existing project**.
3. Select your repository. Netlify will automatically detect [`netlify.toml`](file:///c:/Users/saras/OneDrive/Desktop/medicompare(cep)/netlify.toml):
   - **Build Command**: `npm run build`
   - **Publish Directory**: `client/dist`
   - **Functions Directory**: `netlify/functions`
4. Click **Deploy**. Your medicine dataset will load instantly!

---

### 2. Deploying to Render (Full-Stack Express)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
2. Select your repository. Render will automatically detect [`render.yaml`](file:///c:/Users/saras/OneDrive/Desktop/medicompare(cep)/render.yaml):
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variable**: `NODE_ENV=production`

---

### 3. Deploying to Railway / Fly.io / Docker
MediCompare includes a multi-stage [`Dockerfile`](file:///c:/Users/saras/OneDrive/Desktop/medicompare(cep)/Dockerfile) that builds both client & server and starts the unified production server on `PORT`:
```bash
docker build -t medicompare .
docker run -p 3001:3001 medicompare
```

---

### 4. Deploying to Vercel
Configured via [`vercel.json`](file:///c:/Users/saras/OneDrive/Desktop/medicompare(cep)/vercel.json):
- **Build Command**: `npm run build`
- **Output Directory**: `client/dist`

---

## 📊 Dataset Ingestion & Seeding Commands

| Command | Description |
| :--- | :--- |
| `npm run build` | Builds client with bundled dataset and seeds master database. |
| `npm run seed` | Compiles the bundled master Indian medicine dataset across all therapeutic categories. |
| `npm run seed:download` | Streams and ingests the full 250k row Indian medicine dataset directly from open repositories. |
| `npm test` | Runs the automated integration and calculation test suite. |
