import React, { useState } from 'react';
import PDFViewer from './components/PDFViewer';
import QuestionPanel from './components/QuestionPanel';
import ExtractedTextViewer from './components/ExtractedTextViewer';
import ContextViewer from './components/ContextViewer';
import ModelConfig from './components/ModelConfig';
import { usePDFUpload } from './hooks/usePDFUpload';
import { askQuestion } from './services/api';
import './App.css';

function App() {
  // Use the PDF upload hook for better state management
  const {
    pdfFile,
    pdfUrl,
    uploadStatus,
    uploadError,
    uploadProgress,
    isUploading,
    isUploaded,
    hasError,
    fileInputRef,
    handleFileUpload,
    resetUpload,
    triggerFileSelect
  } = usePDFUpload();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [lastContext, setLastContext] = useState(null);
  const [lastPagesUsed, setLastPagesUsed] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [citationPages, setCitationPages] = useState([]);
  const [currentCitationIndex, setCurrentCitationIndex] = useState(0);

  const handleFileChange = async (event) => {
    // Clear previous answers when uploading new file
    setAnswer(null);
    setHighlights([]);
    setLastContext(null);
    setLastPagesUsed([]);
    setQuestion('');
    
    // Use the hook's upload handler
    await handleFileUpload(event);
  };

  // Calculate highlight relevance and navigate to most important page
  const navigateToMostRelevantPage = (highlights) => {
    if (!highlights || highlights.length === 0) return;

    // Group highlights by page and calculate relevance scores
    const pageScores = {};
    highlights.forEach(highlight => {
      const page = highlight.page;
      if (!pageScores[page]) {
        pageScores[page] = {
          page: page,
          highlightCount: 0,
          totalRelevance: 0,
          highlights: []
        };
      }
      
      // Calculate relevance score based on highlight type and text length
      let relevanceScore = 1;
      if (highlight.match_type === 'exact') relevanceScore = 3;
      else if (highlight.match_type === 'word') relevanceScore = 2;
      
      // Boost score for longer, more substantial text
      if (highlight.text && highlight.text.length > 50) relevanceScore *= 1.5;
      
      pageScores[page].highlightCount++;
      pageScores[page].totalRelevance += relevanceScore;
      pageScores[page].highlights.push(highlight);
    });

    // Sort pages by relevance (total relevance * highlight count)
    const sortedPages = Object.values(pageScores)
      .map(pageData => ({
        ...pageData,
        finalScore: pageData.totalRelevance * Math.sqrt(pageData.highlightCount)
      }))
      .sort((a, b) => b.finalScore - a.finalScore);

    // Set up citation navigation
    setCitationPages(sortedPages);
    setCurrentCitationIndex(0);

    // Navigate to most relevant page
    if (sortedPages.length > 0) {
      setCurrentPage(sortedPages[0].page);
      console.log(`Navigating to most relevant page: ${sortedPages[0].page} (score: ${sortedPages[0].finalScore.toFixed(2)})`);
    }
  };

  // Navigation functions for citations
  const goToNextCitation = () => {
    if (citationPages.length > 0) {
      const nextIndex = (currentCitationIndex + 1) % citationPages.length;
      setCurrentCitationIndex(nextIndex);
      setCurrentPage(citationPages[nextIndex].page);
    }
  };

  const goToPrevCitation = () => {
    if (citationPages.length > 0) {
      const prevIndex = currentCitationIndex === 0 ? citationPages.length - 1 : currentCitationIndex - 1;
      setCurrentCitationIndex(prevIndex);
      setCurrentPage(citationPages[prevIndex].page);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim() || !pdfFile || !isUploaded) return;

    setLoading(true);
    try {
      const response = await askQuestion(question.trim());

      setAnswer(response.answer);
      setLastContext(response.context);
      setLastPagesUsed(response.pages_used || []);
      setHighlights(response.highlights || []);

      // Enhanced navigation: go to most relevant page based on highlights
      if (response.highlights && response.highlights.length > 0) {
        navigateToMostRelevantPage(response.highlights);
      } else if (response.pages_used && response.pages_used.length > 0) {
        // Fallback to first cited page if no highlights
        const firstCitedPage = response.pages_used[0];
        setCurrentPage(firstCitedPage);
        setCitationPages([{ page: firstCitedPage, highlightCount: 0, totalRelevance: 1 }]);
        setCurrentCitationIndex(0);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Sorry, there was an error processing your question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>PDF Document Q&A</h1>
            <p>Upload a PDF document and ask questions to get cited response</p>
          </div>
          <button 
            className="config-button"
            onClick={() => setShowModelConfig(true)}
            title="Configure Models"
          >
            ⚙️ Models
          </button>
        </div>
      </header>

      <div className="upload-section">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          style={{ display: 'none' }}
        />
        
        <div className="upload-controls">
          <button 
            className={`upload-btn ${uploadStatus}`}
            onClick={triggerFileSelect}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="upload-spinner">⏳</span>
                Uploading... {uploadProgress}%
              </>
            ) : pdfFile ? (
              <>
                <span className="upload-icon">📄</span>
                {pdfFile.name}
              </>
            ) : (
              <>
                <span className="upload-icon">📁</span>
                Choose PDF File
              </>
            )}
          </button>
          
          {pdfFile && !isUploading && (
            <button 
              className="reset-btn"
              onClick={resetUpload}
              title="Remove file and start over"
            >
              ✕
            </button>
          )}
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">Uploading and processing PDF...</span>
          </div>
        )}

        {/* Upload Status Messages */}
        {hasError && (
          <div className="upload-status error">
            <span className="status-icon">❌</span>
            <span className="status-text">{uploadError}</span>
          </div>
        )}

        {isUploaded && !hasError && (
          <div className="upload-status success">
            <span className="status-icon">✅</span>
            <span className="status-text">
              PDF uploaded successfully! You can now ask questions about the document.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="upload-actions">
          {pdfFile && isUploaded && (
            <button 
              className="view-text-btn"
              onClick={() => setShowExtractedText(true)}
            >
              <span className="btn-icon">📖</span>
              View Extracted Text
            </button>
          )}
        </div>
      </div>

      <div className="main-content">
        <QuestionPanel
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleQuestionSubmit}
          answer={answer}
          loading={loading}
          disabled={!pdfFile || !isUploaded}
          uploadStatus={uploadStatus}
          isUploaded={isUploaded}
          onViewContext={() => setShowContext(true)}
          hasContext={!!lastContext}
        />

        {pdfUrl && (
          <PDFViewer
            pdfUrl={pdfUrl}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            citationPages={citationPages}
            currentCitationIndex={currentCitationIndex}
            onNextCitation={goToNextCitation}
            onPrevCitation={goToPrevCitation}
          />
        )}
      </div>

      <ExtractedTextViewer
        isVisible={showExtractedText}
        onClose={() => setShowExtractedText(false)}
      />

      <ContextViewer
        context={lastContext}
        pagesUsed={lastPagesUsed}
        isVisible={showContext}
        onClose={() => setShowContext(false)}
      />

      <ModelConfig 
        isOpen={showModelConfig}
        onClose={() => setShowModelConfig(false)}
      />
    </div>
  );
}

export default App;
