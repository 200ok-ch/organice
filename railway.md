# Deploying Organice to Railway

This guide explains how to deploy Organice to [Railway](https://railway.app) using Nixpacks.

## Prerequisites

- A Railway account
- GitLab OAuth application credentials (if using GitLab sync)

## Environment Variables

Configure these environment variables in your Railway project settings:

### Required for GitLab Integration

- `ORGANICE_GITLAB_CLIENT_ID` - Your GitLab OAuth application client ID
- `ORGANICE_GITLAB_SECRET` - Your GitLab OAuth application secret

### Build Process

The build process uses the `bin/build_env.sh` script to:
1. Generate environment variable mappings from `ORGANICE_*` to `REACT_APP_*` format
2. Inject these variables into the built JavaScript files
3. Create a production-ready build in `build-runtime/`

## Deployment Steps

### Option 1: Using Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project (or create new)
railway link

# Set environment variables
railway variables set ORGANICE_GITLAB_CLIENT_ID=your_client_id
railway variables set ORGANICE_GITLAB_SECRET=your_secret

# Deploy
railway up
```

### Option 2: Using Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your Organice fork/repository
4. Railway will automatically detect the `nixpacks.toml` configuration
5. Add environment variables in the "Variables" tab:
   - `ORGANICE_GITLAB_CLIENT_ID`
   - `ORGANICE_GITLAB_SECRET`
6. Railway will automatically build and deploy

### Option 3: Using Railway Button

Add this button to your README for one-click deployment:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template?referralCode=YOUR_CODE)

## Configuration Details

### nixpacks.toml

The `nixpacks.toml` file configures the build process:

- **Setup phase**: Installs Node.js and Yarn via Nix packages
- **Install phase**: Installs dependencies with `yarn install --frozen-lockfile`
- **Build phase**: 
  - Builds the React app
  - Runs the environment variable injection script
  - Creates the runtime build directory
- **Start phase**: Serves static files using `serve` on Railway's assigned port

### Custom Domain

To add a custom domain:

1. Go to your Railway project settings
2. Navigate to "Domains"
3. Click "Add Domain" and follow the instructions

## Troubleshooting

### Build fails with permission denied

Ensure the build script is executable:
```bash
chmod +x bin/build_env.sh
```

### Environment variables not applied

Make sure you're using the `ORGANICE_` prefix for environment variables in Railway, not `REACT_APP_`. The build script handles the conversion.

### Port binding issues

Railway automatically provides a `$PORT` environment variable. The nixpacks configuration uses this for the serve command.
