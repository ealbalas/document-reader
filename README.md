# PDF Document Q&A Application

A sophisticated React-based PDF viewer application with AI-powered question answering capabilities. Upload PDF documents, view them with advanced highlighting features, and ask questions about the content using multiple AI models including OpenAI GPT, Google Gemini, and local embedding models.

## Features

- **PDF Upload & Viewing**: Upload and view PDF documents with zoom, navigation, and page controls
- **AI-Powered Q&A**: Ask natural language questions about PDF content using state-of-the-art AI models
- **Smart Text Extraction**: Advanced text extraction with PyMuPDF and OCR fallback for scanned documents
- **Semantic Search**: Vector embeddings with ChromaDB for intelligent content retrieval
- **Visual Highlighting**: Automatic highlighting of relevant text sections in AI responses
- **Multi-Model Support**: Configure and switch between OpenAI GPT, Google Gemini, and local models
- **Context Management**: View extracted text, conversation history, and AI reasoning context
- **Citation Navigation**: Navigate between cited pages with relevance scoring
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Python** (version 3.8 or higher) - [Download here](https://python.org/)
- **pip** (Python package installer)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pdf
```

### 2. Frontend Setup

Install the React application dependencies:

```bash
npm install
```

### 3. Backend Setup

Navigate to the backend directory and install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

**Note**: If you encounter issues with package installation, consider using a virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

### Environment Variables

Create a `.env` file in the **backend** directory and configure your AI model API keys:

```env
# OpenAI Configuration (for GPT models)
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Other model configurations
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### API Key Setup

1. **OpenAI API Key**: 
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account and generate an API key
   - Add to your `.env` file

2. **Google Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Generate an API key
   - Add to your `.env` file

**Important**: Keep your API keys secure and never commit them to version control.

## Running the Application

### Local Development

#### Method 1: Start Both Servers Simultaneously (Recommended)

From the root directory:

```bash
npm run dev
```

This command will start both the frontend and backend servers concurrently.

#### Method 2: Start Servers Separately

**Start the Backend Server:**

From the backend directory:

```bash
cd backend
python app.py
```

The backend server will start on `http://localhost:5002`

**Start the Frontend Development Server:**

From the root directory (in a new terminal):

```bash
npm start
```

The React application will start on `http://localhost:3000` and automatically open in your browser.

### 🚀 Deploy to Cloudflare (Recommended for Production)

For production deployment, we recommend using Cloudflare's global network for optimal performance and scalability.

#### Quick Deployment

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run automated deployment
./deploy.sh
```

#### Manual Deployment Steps

1. **Set up Cloudflare resources:**
   ```bash
   wrangler r2 bucket create pdf-reader-files
   wrangler kv:namespace create "PDF_STORAGE"
   ```

2. **Deploy the backend:**
   ```bash
   npm run build:worker
   npm run deploy:worker
   ```

3. **Deploy the frontend:**
   ```bash
   npm run build
   wrangler pages deploy build --project-name pdf-reader-frontend
   ```

4. **Configure API keys:**
   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put GEMINI_API_KEY
   ```

📖 **For detailed deployment instructions, see:**
- [Quick Start Guide](CLOUDFLARE_QUICKSTART.md) - Get deployed in minutes
- [Detailed Deployment Guide](DEPLOYMENT.md) - Complete configuration options

#### Deployment Benefits

- **Global CDN**: Fast loading worldwide
- **Serverless Backend**: Auto-scaling with zero maintenance
- **Free Tier**: Generous limits for personal/small business use
- **HTTPS**: Automatic SSL certificates
- **High Availability**: 99.9%+ uptime

## Usage Guide

### 1. Upload a PDF Document

1. Click the **"Choose PDF File"** button
2. Select a PDF file from your computer (max 150MB)
3. Wait for the file to upload and text extraction to complete
4. The PDF will appear in the viewer on the right side

### 2. Configure AI Models (Optional but Recommended)

1. Click the **"⚙️ Models"** button in the top-right corner
2. Configure your preferred AI model:
   - **LLM Provider**: Choose between OpenAI, Gemini, or other available models
   - **Model**: Select specific model (e.g., gpt-4, gemini-pro)
   - **Parameters**: Adjust temperature, max tokens, etc.
3. Configure embedding model for semantic search
4. Click **"Save Configuration"**

### 3. Ask Questions About Your PDF

1. In the question input field, type your question about the PDF content
2. Examples of effective questions:
   - "Who signed this document?"
   - "What is the patient's diagnosis?"
   - "What are the key terms of this contract?"
   - "When was this document created?"
   - "What are the main conclusions?"
3. Click **"Ask Question"** or press Enter
4. Wait for the AI to analyze the document and provide an answer

### 4. Navigate Results

- **Automatic Navigation**: The app automatically navigates to the most relevant page
- **Citation Navigation**: Use the citation controls to jump between referenced pages
- **Highlighting**: Relevant text sections are highlighted in the PDF viewer
- **Page Controls**: Use zoom, fit-to-width, and page navigation controls

### 5. View Additional Information

- **View Context**: Click to see the context used by the AI for answering
- **View Extracted Text**: See the raw text extracted from the PDF
- **Citation Pages**: Navigate between pages that contain relevant information

## Advanced Features

### Semantic Search

The application uses advanced vector embeddings to understand document content:
- **Automatic Domain Detection**: Detects medical, legal, or general documents
- **Optimized Models**: Uses domain-specific embedding models for better accuracy
- **Context Preservation**: Maintains document structure and relationships

### Multi-Granularity Analysis

- **Full Page Analysis**: Analyzes entire pages for broad context
- **Semantic Chunking**: Breaks content into meaningful segments
- **Overlapping Context**: Ensures no information is lost between chunks

### Smart Highlighting

- **Relevance Scoring**: Highlights are ranked by relevance to your question
- **Multiple Match Types**: Exact matches, word matches, and semantic matches
- **Visual Indicators**: Different highlight styles for different match types

## API Endpoints

The backend provides the following REST API endpoints:

- `POST /upload` - Upload a PDF file for processing
- `POST /ask` - Ask a question about the uploaded PDF
- `GET /extracted-text` - Retrieve extracted text from the PDF
- `GET /api/models/config` - Get current model configuration
- `POST /api/models/config` - Update model configuration
- `GET /health` - Health check endpoint

## Project Structure

```
pdf/
├── src/                          # React frontend source
│   ├── components/              # React components
│   │   ├── PDFViewer/          # Modular PDF viewer components
│   │   │   ├── PDFViewer.js    # Main PDF display component
│   │   │   ├── PDFControls.js  # Navigation and zoom controls
│   │   │   └── PDFHighlights.js # Text highlighting system
│   │   ├── QuestionPanel.js    # Question input and answer display
│   │   ├── ModelConfig.js      # AI model configuration interface
│   │   ├── ExtractedTextViewer.js # Raw text display
│   │   └── ContextViewer.js    # AI context and reasoning display
│   ├── hooks/                  # Custom React hooks
│   │   ├── usePDFViewer.js     # PDF viewing logic
│   │   ├── usePDFUpload.js     # File upload handling
│   │   └── useQuestionAnswering.js # Q&A logic
│   ├── services/               # API service functions
│   │   └── api.js              # Backend communication
│   ├── utils/                  # Utility functions
│   │   └── pdfUtils.js         # PDF processing utilities
│   └── constants/              # Application constants
├── backend/                    # Python Flask backend
│   ├── app.py                 # Main Flask application
│   ├── config.py              # Model configuration management
│   └── requirements.txt       # Python dependencies
├── public/                     # Static assets
├── package.json               # Node.js dependencies and scripts
└── README.md                  # This file
```

## Troubleshooting

### Common Issues

1. **Backend won't start**:
   ```bash
   # Check if Python dependencies are installed
   cd backend
   pip install -r requirements.txt
   
   # Check if port 5002 is available
   lsof -i :5002  # On macOS/Linux
   ```

2. **Frontend won't start**:
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **PDF not loading**:
   - Ensure the file is a valid PDF (not password-protected)
   - Check file size (must be under 150MB)
   - Try a different PDF file

4. **AI not responding**:
   - Verify API keys are correctly set in `.env` file
   - Check that the backend server is running on port 5002
   - Ensure you have sufficient API credits

5. **No highlights appearing**:
   - The AI might not have found relevant text
   - Try rephrasing your question
   - Check if text extraction was successful in "View Extracted Text"

### Error Messages

- **"No PDF uploaded"**: Upload a PDF file before asking questions
- **"Error processing PDF"**: The PDF might be corrupted, password-protected, or too large
- **"No question provided"**: Enter a question in the text area
- **"API key not configured"**: Add your API keys to the `.env` file
- **"Connection refused"**: Ensure the backend server is running

### Performance Tips

1. **Large PDFs**: For documents over 50MB, processing may take longer
2. **Complex Questions**: More specific questions generally yield better results
3. **API Limits**: Be aware of your API usage limits and costs
4. **Browser Memory**: Close other tabs if experiencing performance issues

## Model Configuration

### Supported Models

**LLM Models**:
- OpenAI: GPT-4, GPT-3.5-turbo, GPT-4-turbo
- Google: Gemini-Pro, Gemini-Pro-Vision
- Local models (via compatible APIs)

**Embedding Models**:
- Sentence Transformers: Various domain-specific models
- OpenAI: text-embedding-ada-002
- Custom models via API

### Configuration Options

- **Temperature**: Controls response creativity (0.0-1.0)
- **Max Tokens**: Maximum response length
- **Model Selection**: Choose optimal model for your use case
- **Domain Detection**: Automatic optimization for medical/legal/general documents

## Security Considerations

- API keys are stored locally in `.env` files
- No document content is stored permanently
- All processing happens locally or via your configured APIs
- Temporary files are cleaned up automatically

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly with different PDF types
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

If you encounter issues:

1. Check this README for troubleshooting steps
2. Verify your environment setup matches the prerequisites
3. Check the browser console and terminal for error messages
4. Ensure all dependencies are properly installed

## Future Enhancements

- Support for additional document formats (DOCX, TXT, etc.)
- Batch processing of multiple documents
- Advanced annotation and note-taking features
- Integration with more AI providers
- Enhanced OCR capabilities for scanned documents
- Document comparison and analysis tools
