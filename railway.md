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

The build process uses the `bin/transcient_env_vars.sh` script to:
1. Build the React application to the `build/` directory
2. Copy the build to `build-runtime/` directory
3. Replace placeholder strings in JavaScript files with actual environment variable values
4. The script converts `ORGANICE_*` environment variables into the built JavaScript bundle

**How it works:**
- During build, Railway provides `ORGANICE_GITLAB_CLIENT_ID` and `ORGANICE_GITLAB_SECRET` as environment variables
- The `transcient_env_vars.sh switch` command copies `build/` to `build-runtime/` and injects these values into the JavaScript files
- This allows environment-specific configuration without rebuilding the application

## Deployment Steps

### Option 1: Using Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project (or create new)
railway link

# set env variables
# Deploy
railway up
```

### Option 2: Using Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your Organice fork/repository
4. Add environment variables in the "Variables" tab:
   - `ORGANICE_GITLAB_CLIENT_ID`
   - `ORGANICE_GITLAB_SECRET`
5. Railway will automatically build and deploy

### Option 3: Using Railway Button

Add this button to your README for one-click deployment:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template?referralCode=YOUR_CODE)

## Configuration Details

### Environment Variable Injection

The deployment uses a unique approach to inject environment variables:

1. React build creates static JavaScript files with placeholder strings
2. The `transcient_env_vars.sh` script performs string replacement in the built files
3. `ORGANICE_*` prefixed variables are injected into the JavaScript bundle
4. This allows the same build to be configured for different environments

### Custom Domain

To add a custom domain:

1. Go to your Railway project settings
2. Navigate to "Domains"
3. Click "Add Domain" and follow the instructions

## Troubleshooting

### Build fails with permission denied

Ensure the script is executable:
```bash
chmod +x bin/transcient_env_vars.sh
```
This is automatically handled in the nixpacks build phase.

### Environment variables not applied

Make sure you're using the `ORGANICE_` prefix for environment variables in Railway, not `REACT_APP_`. The `transcient_env_vars.sh` script handles the variable naming conversion and injection.

### Port binding issues

Railway automatically provides a `$PORT` environment variable. The nixpacks configuration uses this for the serve command.

### GitLab OAuth not working

Verify that:
1. Your GitLab OAuth application callback URL is set correctly
2. Environment variables `ORGANICE_GITLAB_CLIENT_ID` and `ORGANICE_GITLAB_SECRET` are set in Railway
3. The variables were set before the deployment (redeploy if you added them after)
