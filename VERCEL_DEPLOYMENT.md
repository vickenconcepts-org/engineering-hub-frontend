# Vercel Deployment Guide

This guide will help you deploy the frontend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your backend API URL (for production)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Choose the `frontend` folder as the root directory (or deploy the entire repo and set root to `frontend`)

3. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Root Directory: `frontend` (if deploying from monorepo)
   - Build Command: `npm run build` (should auto-detect)
   - Output Directory: `build` (should auto-detect)
   - Install Command: `npm install` (should auto-detect)

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following:
     ```
     VITE_API_BASE_URL = https://your-backend-domain.com/api
     ```
   - Replace `your-backend-domain.com` with your actual backend API URL
   - Make sure to add it for **Production**, **Preview**, and **Development** environments

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked for environment variables, add:
     ```
     VITE_API_BASE_URL=https://your-backend-domain.com/api
     ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

### Required Variables

- `VITE_API_BASE_URL`: Your backend API base URL
  - Local: `http://localhost:8000/api`
  - Production: `https://your-backend-domain.com/api`

### Setting Environment Variables in Vercel

1. Go to your project on Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your API URL
   - **Environment**: Select Production, Preview, and Development
4. Click **Save**
5. Redeploy your application for changes to take effect

## Important Notes

1. **CORS Configuration**: Make sure your backend allows requests from your Vercel domain
   - Add your Vercel URL to the backend's CORS allowed origins
   - Example: `https://your-project.vercel.app`

2. **API Base URL**: 
   - The app uses `VITE_API_BASE_URL` environment variable
   - If not set, it defaults to `http://localhost:8000/api`
   - Make sure to set this in Vercel environment variables

3. **Build Output**: 
   - The build output is in the `build` directory
   - Vercel will automatically detect this from `vercel.json`

4. **SPA Routing**: 
   - The `vercel.json` includes rewrites to handle React Router routes
   - All routes will be served through `index.html`

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)
- Check build logs in Vercel dashboard

### API Calls Fail
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings on your backend
- Ensure backend is accessible from the internet

### Routes Not Working
- Verify `vercel.json` rewrites are correct
- Check that all routes redirect to `index.html`

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches and pull requests

Each deployment gets a unique URL for preview builds.

