/**
 * PDFControls Component
 * Navigation and zoom controls for PDF viewer
 */
import React, { useState } from 'react';
import './PDFControls.css';

const PDFControls = ({
  currentPage,
  numPages,
  canGoToPrev,
  canGoToNext,
  canZoomIn,
  canZoomOut,
  pageInfo,
  zoomPercentage,
  citationPages,
  currentCitationIndex,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onNextCitation,
  onPrevCitation,
}) => {
  const [pageInput, setPageInput] = useState('');
  const [showPageInput, setShowPageInput] = useState(false);
  
  const hasCitations = citationPages && citationPages.length > 0;
  const currentCitation = citationPages?.[currentCitationIndex];

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (pageNum >= 1 && pageNum <= numPages) {
      onGoToPage(pageNum);
      setPageInput('');
      setShowPageInput(false);
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      setPageInput('');
      setShowPageInput(false);
    }
  };

  return (
    <div className="pdf-controls">
      {/* Page Navigation */}
      <div className="controls-group navigation">
        <button 
          onClick={onPrevPage} 
          disabled={!canGoToPrev}
          className="control-btn"
          title="Previous page"
        >
          <span className="icon">←</span>
          Previous
        </button>
        
        {showPageInput ? (
          <form onSubmit={handlePageInputSubmit} className="page-input-form">
            <input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={() => setShowPageInput(false)}
              placeholder={`1-${numPages}`}
              min="1"
              max={numPages}
              className="page-input"
              autoFocus
            />
            <span className="page-input-total">of {numPages}</span>
          </form>
        ) : (
          <button 
            className="page-info"
            onClick={() => setShowPageInput(true)}
            title="Click to go to specific page"
          >
            {pageInfo}
          </button>
        )}
        
        <button 
          onClick={onNextPage} 
          disabled={!canGoToNext}
          className="control-btn"
          title="Next page"
        >
          Next
          <span className="icon">→</span>
        </button>
      </div>

      {/* Citation Navigation */}
      {hasCitations && (
        <div className="controls-group citations">
          <button 
            onClick={onPrevCitation} 
            disabled={citationPages.length <= 1}
            className="control-btn secondary"
            title="Previous citation"
          >
            <span className="icon">←</span>
            Prev Citation
          </button>
          <div className="citation-info">
            Citation {currentCitationIndex + 1} of {citationPages.length}
            {currentCitation && (
              <div className="citation-details">
                Page {currentCitation.page}
                {currentCitation.highlightCount > 0 && 
                  ` • ${currentCitation.highlightCount} highlights`
                }
              </div>
            )}
          </div>
          <button 
            onClick={onNextCitation} 
            disabled={citationPages.length <= 1}
            className="control-btn secondary"
            title="Next citation"
          >
            Next Citation
            <span className="icon">→</span>
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="controls-group zoom">
        <div className="btn-group">
          <button 
            onClick={onZoomOut} 
            disabled={!canZoomOut}
            className="control-btn"
            title="Zoom out"
          >
            −
          </button>
          <button 
            onClick={onResetZoom}
            className="control-btn"
            title="Reset zoom"
          >
            {zoomPercentage}%
          </button>
          <button 
            onClick={onZoomIn} 
            disabled={!canZoomIn}
            className="control-btn"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFControls;
