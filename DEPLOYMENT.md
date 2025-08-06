# Cloudflare Deployment Guide

This guide will help you deploy the PDF Reader application to Cloudflare using Cloudflare Pages for the frontend and Cloudflare Workers for the backend.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 18 or higher
3. **Git**: For version control
4. **Wrangler CLI**: Cloudflare's command-line tool

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

## Step 3: Set Up Cloudflare Resources

### Create R2 Bucket for PDF Storage

```bash
wrangler r2 bucket create pdf-reader-files
```

### Create KV Namespace for Metadata Storage

```bash
wrangler kv:namespace create "PDF_STORAGE"
wrangler kv:namespace create "PDF_STORAGE" --preview
```

Note the namespace IDs returned by these commands.

## Step 4: Configure Wrangler

Update the `wrangler.toml` file with your actual namespace IDs:

```toml
name = "pdf-reader-backend"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "PDF_STORAGE"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"

[build]
command = "npm run build:worker"

[[r2_buckets]]
binding = "PDF_BUCKET"
bucket_name = "pdf-reader-files"
preview_bucket_name = "pdf-reader-files-preview"
```

## Step 5: Set Environment Variables

Set your API keys as Cloudflare Worker secrets:

```bash
# Set OpenAI API Key
wrangler secret put OPENAI_API_KEY

# Set Gemini API Key (optional)
wrangler secret put GEMINI_API_KEY
```

When prompted, enter your actual API keys.

## Step 6: Install Worker Dependencies

```bash
npm run install:worker
```

## Step 7: Build and Deploy the Worker

```bash
# Build the worker
npm run build:worker

# Deploy the worker
npm run deploy:worker
```

After deployment, note the worker URL (e.g., `https://pdf-reader-backend.your-subdomain.workers.dev`).

## Step 8: Update Frontend Configuration

Update the API URL in `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf-reader-backend.your-actual-subdomain.workers.dev';
```

Or set the environment variable:

```bash
# Create .env file
echo "REACT_APP_API_URL=https://pdf-reader-backend.your-actual-subdomain.workers.dev" > .env
```

## Step 9: Deploy Frontend to Cloudflare Pages

### Option A: Connect Git Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages**
3. Click **Create a project**
4. Connect your Git repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `build`
   - **Environment variables**: Add `REACT_APP_API_URL` with your worker URL

### Option B: Direct Upload

```bash
# Build the frontend
npm run build

# Install Wrangler Pages plugin
npm install -g @cloudflare/wrangler

# Deploy to Pages
wrangler pages deploy build --project-name pdf-reader-frontend
```

## Step 10: Configure Custom Domain (Optional)

1. In Cloudflare Dashboard, go to **Pages**
2. Select your project
3. Go to **Custom domains**
4. Add your domain and follow DNS configuration instructions

## Environment Variables

### Required for Worker:
- `OPENAI_API_KEY`: Your OpenAI API key
- `GEMINI_API_KEY`: Your Google Gemini API key (optional)

### Required for Frontend:
- `REACT_APP_API_URL`: Your Cloudflare Worker URL

## Testing the Deployment

1. Visit your Cloudflare Pages URL
2. Upload a PDF file
3. Ask a question about the PDF
4. Verify the response is generated correctly

## Troubleshooting

### Worker Issues:
- Check worker logs: `wrangler tail`
- Verify environment variables: `wrangler secret list`
- Test worker directly: Visit worker URL + `/health`

### Frontend Issues:
- Check browser console for errors
- Verify API URL is correct
- Check network tab for failed requests

### Common Problems:

1. **CORS Errors**: Ensure worker has proper CORS headers
2. **API Key Issues**: Verify secrets are set correctly
3. **File Upload Fails**: Check R2 bucket permissions
4. **Large Files**: Cloudflare Workers have size limits

## Monitoring and Logs

- **Worker Logs**: `wrangler tail`
- **Pages Logs**: Available in Cloudflare Dashboard
- **Analytics**: Available in Cloudflare Dashboard under Analytics

## Cost Considerations

- **Cloudflare Workers**: 100,000 requests/day free
- **Cloudflare R2**: 10GB storage free
- **Cloudflare Pages**: Unlimited static requests
- **OpenAI API**: Pay per token usage

## Security Notes

- API keys are stored as encrypted secrets
- Files are stored in private R2 buckets
- CORS is configured for your domain only
- No persistent storage of sensitive data

## Updates and Maintenance

To update the application:

1. **Update Worker**:
   ```bash
   npm run build:worker
   npm run deploy:worker
   ```

2. **Update Frontend**:
   ```bash
   npm run build
   wrangler pages deploy build --project-name pdf-reader-frontend
   ```

## Support

For issues:
1. Check Cloudflare documentation
2. Review worker logs
3. Test API endpoints individually
4. Verify all environment variables are set

Your PDF Reader application should now be fully deployed and accessible via Cloudflare!
