# PDF Reader Backend - Fly.io Deployment

This directory contains the Flask backend for the PDF Reader application, configured for deployment on fly.io.

## Features

- PDF text extraction using PyMuPDF
- AI-powered question answering with OpenAI and Google Gemini
- Semantic search using sentence transformers and ChromaDB
- Document domain detection (medical, legal, general)
- Configurable model selection
- CORS enabled for frontend integration

## Prerequisites

1. **Install flyctl CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to fly.io**:
   ```bash
   flyctl auth login
   ```

3. **API Keys** (at least one required):
   - OpenAI API key
   - Google Gemini API key

## Quick Deployment Options

### Option 1: Fly.io Deployment (Recommended for Production)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

3. **Set environment variables**:
   ```bash
   flyctl secrets set OPENAI_API_KEY=your_openai_key_here
   flyctl secrets set GEMINI_API_KEY=your_gemini_key_here
   ```

4. **Deploy the application**:
   ```bash
   flyctl deploy
   ```

### Option 2: Docker Deployment (Local/Self-hosted)

1. **Install Docker and Docker Compose**:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. **Set up environment variables**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Or use the build scripts**:
   ```bash
   ./docker-build.sh    # Build the image
   ./docker-run.sh      # Run the container
   ```

## Manual Deployment Steps

### 1. Initialize Fly App

```bash
flyctl launch --no-deploy
```

This will create a `fly.toml` configuration file (already included).

### 2. Set Environment Variables

```bash
# Required: At least one AI provider
flyctl secrets set OPENAI_API_KEY=your_openai_key_here
flyctl secrets set GEMINI_API_KEY=your_gemini_key_here

# Optional: Model configuration
flyctl secrets set LLM_PROVIDER=openai
flyctl secrets set LLM_MODEL=gpt-4o
flyctl secrets set EMBEDDING_PROVIDER=sentence-transformers
flyctl secrets set EMBEDDING_MODEL=all-mpnet-base-v2
```

### 3. Deploy

```bash
flyctl deploy
```

## Configuration

### App Configuration (`fly.toml`)

- **App name**: `pdf-reader-backend`
- **Region**: `sjc` (San Jose)
- **Memory**: 1GB
- **Port**: 5002
- **Auto-scaling**: Enabled (0 minimum machines)

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | One of OpenAI/Gemini |
| `GEMINI_API_KEY` | Google Gemini API key | - | One of OpenAI/Gemini |
| `LLM_PROVIDER` | LLM provider (openai/gemini) | openai | No |
| `LLM_MODEL` | LLM model name | gpt-4o | No |
| `LLM_TEMPERATURE` | LLM temperature | 0.1 | No |
| `LLM_MAX_TOKENS` | LLM max tokens | 1000 | No |
| `EMBEDDING_PROVIDER` | Embedding provider | sentence-transformers | No |
| `EMBEDDING_MODEL` | Embedding model | all-mpnet-base-v2 | No |

## API Endpoints

- `GET /health` - Health check
- `POST /upload` - Upload PDF file
- `POST /ask` - Ask questions about uploaded PDF
- `GET /extracted-text` - Get extracted text from PDF
- `GET /api/models/config` - Get model configuration
- `POST /api/models/config` - Update model configuration

## Useful Commands

```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Open app in browser
flyctl open

# List environment variables
flyctl secrets list

# Set environment variable
flyctl secrets set KEY=value

# Scale app
flyctl scale count 1

# SSH into app
flyctl ssh console

# Monitor app
flyctl dashboard
```

## Troubleshooting

### Common Issues

1. **Out of memory errors**:
   ```bash
   flyctl scale memory 2gb
   ```

2. **App not starting**:
   ```bash
   flyctl logs
   ```

3. **Environment variables not set**:
   ```bash
   flyctl secrets list
   flyctl secrets set OPENAI_API_KEY=your_key
   ```

4. **CORS issues**:
   - The app is configured with CORS enabled for all origins
   - Check that your frontend is making requests to the correct URL

### Performance Optimization

1. **Increase memory for large PDFs**:
   ```bash
   flyctl scale memory 2gb
   ```

2. **Keep app warm**:
   ```bash
   flyctl scale count 1 --min-machines-running=1
   ```

## Development

### Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   export OPENAI_API_KEY=your_key
   export GEMINI_API_KEY=your_key
   ```

3. **Run locally**:
   ```bash
   python app.py
   ```

### Testing Deployment

```bash
# Test health endpoint
curl https://your-app.fly.dev/health

# Test with local file
curl -X POST -F "pdf=@test.pdf" https://your-app.fly.dev/upload
```

## Architecture

The backend uses:
- **Flask** - Web framework
- **PyMuPDF** - PDF text extraction
- **ChromaDB** - Vector database for semantic search
- **Sentence Transformers** - Text embeddings
- **OpenAI/Gemini APIs** - Language models for Q&A

## Security

- API keys are stored as encrypted secrets
- CORS is configured for cross-origin requests
- File uploads are validated and secured
- Temporary files are cleaned up automatically

## Support

For issues with:
- **Fly.io deployment**: Check [Fly.io docs](https://fly.io/docs/)
- **Application errors**: Check logs with `flyctl logs`
- **API issues**: Test endpoints individually
