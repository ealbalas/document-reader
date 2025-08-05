import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PDFViewer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ 
  pdfUrl, 
  currentPage, 
  setCurrentPage, 
  highlights = [], 
  citationPages = [], 
  currentCitationIndex = 0, 
  onNextCitation, 
  onPrevCitation 
}) => {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(600);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setPageWidth(Math.min(containerWidth - 40, 800));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const getHighlightStyle = (highlight) => {
    // Different styles based on highlight type and match quality
    const baseStyle = {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: 1000,
      boxSizing: 'border-box',
      borderRadius: '2px',
      transition: 'all 0.3s ease'
    };

    // Color coding based on match type
    switch (highlight.match_type) {
      case 'exact':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 215, 0, 0.4)', // Gold for exact matches
          border: '2px solid rgba(255, 140, 0, 0.8)',
          boxShadow: '0 0 8px rgba(255, 140, 0, 0.6)'
        };
      case 'word':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(0, 255, 127, 0.3)', // Green for word matches
          border: '2px solid rgba(0, 200, 100, 0.7)',
          boxShadow: '0 0 6px rgba(0, 200, 100, 0.5)'
        };
      case 'test_debug':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 0, 255, 0.2)', // Magenta for debug
          border: '1px dashed rgba(255, 0, 255, 0.6)'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(135, 206, 250, 0.3)', // Light blue for general
          border: '2px solid rgba(70, 130, 180, 0.7)',
          boxShadow: '0 0 4px rgba(70, 130, 180, 0.5)'
        };
    }
  };

  const renderHighlights = () => {
    if (!highlights || highlights.length === 0) {
      return null;
    }

    // Filter highlights for the current page
    const currentPageHighlights = highlights.filter(h => h.page === currentPage);
    
    if (currentPageHighlights.length === 0) {
      return null;
    }

    return currentPageHighlights.map((highlight, index) => {
      // Get the actual rendered page dimensions
      const pageElement = document.querySelector('.react-pdf__Page__canvas');
      
      let adjustedX = highlight.x;
      let adjustedY = highlight.y;
      let adjustedWidth = highlight.width;
      let adjustedHeight = highlight.height;
      
      if (pageElement) {
        // Get the actual displayed dimensions of the PDF page
        const displayedWidth = pageElement.offsetWidth;
        const displayedHeight = pageElement.offsetHeight;
        
        // Get the original PDF page dimensions from the highlight data
        const pdfWidth = highlight.page_width || 595;
        const pdfHeight = highlight.page_height || 842;
        
        // Calculate the scaling factors
        const scaleX = displayedWidth / pdfWidth;
        const scaleY = displayedHeight / pdfHeight;
        
        // Apply the scaling to coordinates
        adjustedX = highlight.x * scaleX;
        adjustedY = highlight.y * scaleY;
        adjustedWidth = highlight.width * scaleX;
        adjustedHeight = highlight.height * scaleY;
      } else {
        // Fallback: use the component's scale factor
        adjustedX = highlight.x * scale;
        adjustedY = highlight.y * scale;
        adjustedWidth = highlight.width * scale;
        adjustedHeight = highlight.height * scale;
      }

      const highlightStyle = getHighlightStyle(highlight);

      return (
        <div
          key={`highlight-${currentPage}-${index}`}
          className={`pdf-highlight highlight-${highlight.match_type || 'default'}`}
          style={{
            ...highlightStyle,
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
            width: `${adjustedWidth}px`,
            height: `${adjustedHeight}px`
          }}
          title={`${highlight.match_type || 'Highlighted'} text: "${highlight.text?.substring(0, 100)}${highlight.text?.length > 100 ? '...' : ''}"`}
        />
      );
    });
  };

  // Add highlight legend
  const renderHighlightLegend = () => {
    if (!highlights || highlights.length === 0) return null;

    const highlightTypes = [...new Set(highlights.map(h => h.match_type))].filter(Boolean);
    
    if (highlightTypes.length === 0) return null;

    const typeLabels = {
      'exact': 'Exact Matches',
      'word': 'Word Matches', 
      'test_debug': 'Debug',
      'default': 'General'
    };

    return (
      <div className="highlight-legend">
        <span className="legend-title">Highlights:</span>
        {highlightTypes.map(type => (
          <span key={type} className={`legend-item highlight-${type}`}>
            {typeLabels[type] || type}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <div className="pdf-controls">
        <div className="page-navigation">
          <button onClick={goToPrevPage} disabled={currentPage <= 1}>
            ← Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {numPages || 1}
          </span>
          <button onClick={goToNextPage} disabled={currentPage >= numPages}>
            Next →
          </button>
        </div>

        {citationPages.length > 0 && (
          <div className="citation-navigation">
            <button 
              onClick={onPrevCitation} 
              disabled={citationPages.length <= 1}
              className="citation-btn"
            >
              ← Prev Citation
            </button>
            <span className="citation-info">
              Citation {currentCitationIndex + 1} of {citationPages.length}
              {citationPages[currentCitationIndex] && (
                <span className="citation-details">
                  (Page {citationPages[currentCitationIndex].page}, {citationPages[currentCitationIndex].highlightCount} highlights)
                </span>
              )}
            </span>
            <button 
              onClick={onNextCitation} 
              disabled={citationPages.length <= 1}
              className="citation-btn"
            >
              Next Citation →
            </button>
          </div>
        )}

        <div className="zoom-controls">
          <button onClick={zoomOut} disabled={scale <= 0.5}>
            Zoom Out
          </button>
          <span className="zoom-info">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 3.0}>
            Zoom In
          </button>
        </div>
      </div>

      <div className="pdf-container">
        <div className="pdf-page-wrapper" style={{ position: 'relative' }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="loading">Loading PDF...</div>}
            error={<div className="error">Failed to load PDF</div>}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          {renderHighlights()}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
