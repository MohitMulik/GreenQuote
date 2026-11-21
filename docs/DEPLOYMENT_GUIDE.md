# GreenQuote — Cloud Production Deployment Guide
## Deploying Backend to Render.com & Frontend to Vercel

This guide provides step-by-step instructions for deploying the GreenQuote FinTech platform to production on **Render** (Backend API) and **Vercel** (Next.js 14 Frontend), connecting to a free **MongoDB Atlas** cluster.

---

### Architecture Overview

```
 ┌────────────────────────┐                   ┌────────────────────────┐
 │   Homeowners & Users   │                   │    Contractors & Ops   │
 └───────────┬────────────┘                   └───────────┬────────────┘
             │                                            │
             ▼                                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │            Vercel (Frontend Next.js 14 Application)         │
   │            https://greenquote.vercel.app                    │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ HTTPS Requests
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │            Render.com (Backend Express 4 REST API)          │
   │            https://greenquote-api.onrender.com              │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │            MongoDB Atlas (Free M0 Multi-Cloud Cluster)       │
   │            mongodb+srv://.../greenquote                     │
   └─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Database Setup (MongoDB Atlas — Free M0)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Click **Create a Deployment** → Choose the **M0 Free** tier.
3. Select any cloud provider and region (AWS us-east-1 recommended).
4. Under **Security Quickstart**:
   - Create a database user with username (e.g. `greenquote_admin`) and a strong password. Save the password!
   - In **IP Access List**, click **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect dynamically.
5. Click **Connect** → Choose **Drivers** (Node.js).
6. Copy your connection URI string:
   ```
   mongodb+srv://greenquote_admin:<password>@cluster0.abcde.mongodb.net/greenquote?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password and ensure `/greenquote` is the database name).*

---

## Part 2: Backend Deployment on Render.com

### Option A: Automatic Blueprint (Easiest — 1 Click)
The repository includes a ready-to-use [`render.yaml`](../render.yaml) file at the root.

1. Sign in to [render.com](https://render.com).
2. Click **New +** → Select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/MohitMulik/GreenQuote.git`.
4. Render will detect the `render.yaml` file automatically:
   - It will prompt you for `MONGO_URI`: Paste your MongoDB Atlas URI.
   - It will prompt you for `CORS_ORIGIN`: Enter `*` (or your future Vercel URL, e.g. `https://greenquote.vercel.app`).
5. Click **Apply**. Render will build and deploy the API automatically.

---

### Option B: Manual Web Service Setup
If you prefer setting it up manually:

1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository: `MohitMulik/GreenQuote`.
3. Configure the following fields:
   - **Name:** `greenquote-api`
   - **Region:** Any (e.g. Oregon or Ohio)
   - **Branch:** `main`
   - **Root Directory:** `greenquote` *(Important: monorepo root)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build --workspace=@greenquote/shared && npm run build --workspace=@greenquote/api
     ```
   - **Start Command:**
     ```bash
     npm run start --workspace=@greenquote/api
     ```
   - **Plan:** Free
4. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render standard port |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | *(Random 32+ character string)* | e.g. `secret_jwt_prod_key_77a9201bc894` |
   | `JWT_REFRESH_SECRET` | *(Random 32+ character string)* | e.g. `refresh_jwt_prod_key_88f0128ac` |
   | `PII_ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | 32-byte hex key for AES-256 Vault |
   | `CORS_ORIGIN` | `*` or `https://<your-vercel-app>.vercel.app` | Allowed frontend origin |
5. Click **Create Web Service**.
6. When deployment finishes, copy your live API URL (e.g., `https://greenquote-api.onrender.com`).
   - Test by opening in browser: `https://greenquote-api.onrender.com/health` (should return `{"status":"healthy"}`).
   - Interactive docs: `https://greenquote-api.onrender.com/docs`.

---

## Part 3: Frontend Deployment on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Select your repository: `MohitMulik/GreenQuote`.
4. In the **Configure Project** screen:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and set it to:
     ```
     greenquote/apps/web
     ```
     *(Check the box "Include source files outside of the Root Directory in the Build Step" if prompted).*
5. Expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://greenquote-api.onrender.com/v1` *(Your Render URL + `/v1`)* |
   | `NEXT_PUBLIC_APP_NAME` | `GreenQuote` |
6. Click **Deploy**.
7. Vercel will install dependencies, build the 12 static/dynamic pages, and deploy to a live URL:
   - Example: `https://greenquote-mohitmulik.vercel.app`

---

## Part 4: Final Linkage & Verification

1. **Update Render CORS:**
   - Once your Vercel URL is live (e.g. `https://greenquote.vercel.app`), go back to your Render Dashboard → `greenquote-api` → **Environment**.
   - Update `CORS_ORIGIN` to your exact Vercel URL:
     ```
     CORS_ORIGIN = https://greenquote.vercel.app
     ```
   - Click **Save Changes** (Render will trigger a zero-downtime re-deploy).

2. **Verify Live End-to-End User Experience:**
   - Open your Vercel URL in your browser.
   - Test **Homeowner Financing Flow**: Navigate to `/quote/demo-token`, toggle Spanish localization, test soft credit pre-qualification, and sign the TILA Reg Z agreement.
   - Test **Contractor Pipeline**: Navigate to `/contractor/pipeline`.
   - Test **Lender Capital Portal**: Navigate to `/lender/dashboard` and review milestone payouts and credit boxes.
   - Test **API Documentation**: Navigate to `https://greenquote-api.onrender.com/docs`.

---

### Deployment Troubleshooting Quick Reference

| Issue | Cause | Solution |
|---|---|---|
| **Render Build Fails on `@greenquote/shared`** | Packages built out of order | Ensure Build Command builds `shared` before `api`: `npm run build --workspace=@greenquote/shared && npm run build --workspace=@greenquote/api` |
| **Vercel Build Fails to find `@greenquote/shared`** | Root Directory misconfigured | Set Root Directory in Vercel to `greenquote/apps/web`. Vercel automatically accesses `@greenquote/shared` via npm workspaces and `next.config.mjs` transpilation. |
| **CORS Error in Browser Console** | API rejecting frontend origin | Update `CORS_ORIGIN` environment variable on Render to match your exact Vercel domain (including `https://`, no trailing slash). |
| **MongoDB Connection Timeout on Render** | Atlas IP whitelist blocking Render | In MongoDB Atlas → Network Access, verify that IP Whitelist has `0.0.0.0/0` (Allow Access from Anywhere) enabled. |
