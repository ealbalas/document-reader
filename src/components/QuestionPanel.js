import React from 'react';
import './QuestionPanel.css';

const QuestionPanel = ({ 
  question, 
  setQuestion, 
  onSubmit, 
  answer, 
  loading, 
  disabled,
  uploadStatus,
  isUploaded,
  onViewContext,
  hasContext
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const getPlaceholderText = () => {
    if (!isUploaded && uploadStatus === 'idle') {
      return "Please upload a PDF document first to ask questions...";
    }
    if (uploadStatus === 'uploading') {
      return "Please wait while your PDF is being uploaded and processed...";
    }
    if (uploadStatus === 'error') {
      return "Please fix the upload error and try again...";
    }
    return "Enter your question about the document...";
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    if (!isUploaded) return 'Upload PDF First';
    return 'Ask Question';
  };

  return (
    <div className="question-panel">
      <div className="question-section">
        <h3>Ask a Question</h3>
        
        {!isUploaded && uploadStatus !== 'uploading' && (
          <div className="upload-reminder">
            <span className="reminder-icon">💡</span>
            <span className="reminder-text">
              Upload a PDF document above to start asking questions
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            rows={4}
            disabled={disabled}
            className={disabled ? 'disabled' : ''}
          />
          <button 
            type="submit" 
            disabled={disabled || !question.trim() || loading}
            className={`ask-button ${disabled ? 'disabled' : ''}`}
          >
            {getButtonText()}
          </button>
        </form>
      </div>

      {answer && (
        <div className="answer-section">
          <h3>Answer</h3>
          <div className="answer-text">{answer}</div>
          <div className="answer-actions">
            {hasContext && (
              <button 
                className="view-context-button"
                onClick={onViewContext}
              >
                View Context Used
              </button>
            )}
          </div>
          <div className="evidence-info">
            <small>This answer was generated using AI analysis of the document content</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPanel;
