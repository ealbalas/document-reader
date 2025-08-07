# Render Deployment Guide

This guide will help you deploy the PDF Reader backend to Render.

## Prerequisites

1. A GitHub account with your code pushed to a repository
2. A Render account (free tier available at https://render.com)
3. API keys for OpenAI and/or Gemini (optional but recommended)

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure your latest code is pushed to your GitHub repository:

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Connect to Render

1. Go to https://render.com and sign up/log in
2. Click "New +" and select "Web Service"
3. Connect your GitHub account if not already connected
4. Select your repository (`document-reader` or whatever you named it)

### 3. Configure the Service

When creating the service, use these settings:

- **Name**: `pdf-reader-backend`
- **Region**: `Oregon (US West)` (or your preferred region)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Environment**: `Docker`
- **Dockerfile Path**: `./Dockerfile` (relative to backend directory)
- **Plan**: `Starter` (free tier)

### 4. Set Environment Variables

In the Render dashboard, add these environment variables:

**Required:**
- `FLASK_ENV` = `production`
- `FLASK_APP` = `app.py`
- `PORT` = `5002`

**Optional (but recommended for full functionality):**
- `OPENAI_API_KEY` = `your_openai_api_key_here`
- `GEMINI_API_KEY` = `your_gemini_api_key_here`

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. The build process will take a few minutes
4. Once deployed, you'll get a URL like: `https://pdf-reader-backend.onrender.com`

## Alternative: Deploy with render.yaml

You can also use the included `render.yaml` file for Infrastructure as Code deployment:

1. In your Render dashboard, go to "Blueprint"
2. Click "New Blueprint Instance"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Review the configuration and deploy

## Testing Your Deployment

Once deployed, test your backend:

```bash
# Health check
curl https://your-app-name.onrender.com/health

# Should return: {"status":"healthy"}
```

## Important Notes

### Free Tier Limitations

- **Sleep Mode**: Free tier services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep may take 30+ seconds
- **Build Time**: Limited to 500 build hours per month
- **Bandwidth**: 100GB per month

### Production Considerations

For production use, consider upgrading to a paid plan for:
- No sleep mode
- Faster builds
- More resources
- Custom domains
- SSL certificates

### Environment Variables

- Never commit API keys to your repository
- Use Render's environment variable feature
- The backend will work without API keys but with limited functionality

### Monitoring

- Use Render's built-in logs and metrics
- Health check endpoint: `/health`
- Monitor response times and error rates

## Troubleshooting

### Build Failures

1. Check the build logs in Render dashboard
2. Ensure all dependencies are in `requirements.txt`
3. Verify Dockerfile syntax

### Runtime Errors

1. Check the service logs in Render dashboard
2. Verify environment variables are set correctly
3. Test locally with Docker first

### Slow Response Times

1. Free tier services sleep - first request will be slow
2. Consider upgrading to paid plan for production
3. Implement proper caching strategies

## Updating Your Deployment

Render automatically deploys when you push to your connected branch:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

The service will automatically rebuild and redeploy.

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: Create issues in your repository
