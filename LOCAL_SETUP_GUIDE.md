# 🚀 Local Development Setup Guide

This guide will help you run your PDF Reader application locally with both frontend and backend.

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- Your current `.env` configuration (already set up)

## 🔧 Quick Start (Recommended)

### Option 1: Run Both Frontend & Backend Together
```bash
# Install frontend dependencies (if not already done)
npm install

# Run both frontend and backend simultaneously
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5002

## 🔧 Manual Setup (Alternative)

If you prefer to run them separately or need to troubleshoot:

### Step 1: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (already exists)
source venv/bin/activate

# Install/update Python dependencies
pip install -r requirements.txt

# Run backend server
python app.py
```

Backend will be available at: http://localhost:5002

### Step 2: Frontend Setup (in a new terminal)
```bash
# Navigate back to project root
cd ..

# Install frontend dependencies (if not already done)
npm install

# Start frontend development server
npm start
```

Frontend will be available at: http://localhost:3000

## 🔍 Verification Steps

1. **Backend Health Check**:
   ```bash
   curl http://localhost:5002/health
   ```
   Should return: `{"status":"healthy","timestamp":...}`

2. **Frontend Access**:
   - Open http://localhost:3000 in your browser
   - You should see the PDF Reader interface

3. **Test Upload**:
   - Upload a PDF file
   - Check the backend terminal for detailed logging (you'll see the new step-by-step process logs)

## 📊 What You'll See

### Backend Logs (Enhanced)
When you upload a PDF, you'll now see detailed logs like:
```
🚀 STARTING PDF UPLOAD PROCESS
📁 STEP 1: File validation - Filename: document.pdf
📏 STEP 2: Checking file size...
   File size: 2.3MB
💾 STEP 3: Saving file to temporary location...
📖 STEP 4: Starting PDF text extraction...
   📖 extract_text_from_pdf() - Opening PDF document...
   📄 Document has 5 pages
   📃 Processing page 1/5...
      🔍 Extracting structured text from page 1...
      ✅ Extracted 15 text blocks from page 1
🧠 STEP 6: Setting up embedding system...
✅ STEP 7: Upload process completed successfully!
```

### Frontend Features
- PDF upload and viewing
- Question answering with AI
- Model configuration (OpenAI/Gemini)
- Extracted text viewer
- Context highlighting

## ⚙️ Current Configuration

Your system is optimized with:
- **LLM**: OpenAI GPT-4o
- **Embedding**: OpenAI text-embedding-3-large
- **Unused models removed**: Saved 1GB+ disk space
- **Enhanced logging**: Full process visibility

## 🛠️ Troubleshooting

### Backend Issues
```bash
# Check if virtual environment is activated
which python
# Should show: .../backend/venv/bin/python

# Check Python dependencies
pip list

# Check environment variables
python -c "import os; print('OpenAI:', bool(os.getenv('OPENAI_API_KEY')))"
```

### Frontend Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts
If ports are in use:
- Backend: Edit `backend/app.py` and change `port = 5002` to another port
- Frontend: Set `PORT=3001 npm start` to use a different port

## 🔄 Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `src/` (frontend) or `backend/` (backend)
3. **Auto-Reload**: Both servers will automatically reload on changes
4. **Test Features**: Upload PDFs and ask questions
5. **Check Logs**: Monitor backend terminal for detailed process logs

## 📝 Notes

- Your current configuration is preserved in `backend/.env`
- Optimized configuration available in `backend/config_optimized.py`
- Cleanup script available: `cleanup_unused_models.py`
- All unused AI models have been removed to save space

## 🚨 Important

- Keep your API keys secure and never commit them to version control
- The backend runs with detailed logging to help you track PDF processing
- Your OpenAI configuration is optimized for cost and performance
