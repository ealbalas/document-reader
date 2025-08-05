import React from 'react';
import './ContextViewer.css';

const ContextViewer = ({ context, pagesUsed, isVisible, onClose }) => {
  if (!isVisible || !context) return null;

  const parseContext = (contextText) => {
    // Split context by page markers
    const pageRegex = /=== PAGE (\d+) ===([\s\S]*?)=== END PAGE \d+ ===/g;
    const pages = [];
    let match;

    while ((match = pageRegex.exec(contextText)) !== null) {
      pages.push({
        pageNumber: parseInt(match[1]),
        content: match[2].trim()
      });
    }

    return pages;
  };

  const contextPages = parseContext(context);

  return (
    <div className="context-overlay">
      <div className="context-modal">
        <div className="context-header">
          <h2>Context Used for Answer</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="context-info">
          <div className="context-stats">
            <span><strong>Pages Used:</strong> {pagesUsed.join(', ')}</span>
            <span><strong>Total Context Length:</strong> {context.length.toLocaleString()} characters</span>
            <span><strong>Number of Pages:</strong> {contextPages.length}</span>
          </div>
          <p className="context-description">
            This is the exact content that was sent to the AI to generate the answer to your question.
          </p>
        </div>

        <div className="context-content">
          {contextPages.map((page, index) => (
            <div key={index} className="context-page">
              <div className="page-header">
                <h3>Page {page.pageNumber}</h3>
                <span className="page-length">{page.content.length} characters</span>
              </div>
              <div className="page-content">
                <pre>{page.content}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContextViewer;
