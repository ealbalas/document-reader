/**
 * PDFViewer Component
 * Displays PDF documents with highlighting and navigation
 */
import React, { useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { usePDFViewer } from '../../hooks/usePDFViewer';
import { 
  calculateHighlightCoordinates, 
  getHighlightStyle, 
  getHighlightTooltip 
} from '../../utils/pdfUtils';
import PDFControls from './PDFControls';
import PDFHighlights from './PDFHighlights';
import './PDFViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ 
  pdfUrl, 
  highlights = [], 
  citationPages = [], 
  currentCitationIndex = 0, 
  onNextCitation, 
  onPrevCitation,
  onPageChange 
}) => {
  const {
    currentPage,
    numPages,
    scale,
    pageWidth,
    containerRef,
    canGoToPrev,
    canGoToNext,
    canZoomIn,
    canZoomOut,
    pageInfo,
    zoomPercentage,
    onDocumentLoadSuccess,
    goToPrevPage,
    goToNextPage,
    goToPage,
    zoomIn,
    zoomOut,
    resetZoom,
  } = usePDFViewer();

  // Auto-navigate to citation pages when citations change
  useEffect(() => {
    if (citationPages.length > 0 && currentCitationIndex >= 0 && currentCitationIndex < citationPages.length) {
      const targetPage = citationPages[currentCitationIndex].page;
      if (targetPage !== currentPage) {
        goToPage(targetPage);
        onPageChange?.(targetPage);
      }
    }
  }, [citationPages, currentCitationIndex, currentPage, goToPage, onPageChange]);

  // Handle page changes and notify parent
  const handlePageChange = (newPage) => {
    goToPage(newPage);
    onPageChange?.(newPage);
  };

  const handlePrevPage = () => {
    goToPrevPage();
    onPageChange?.(currentPage - 1);
  };

  const handleNextPage = () => {
    goToNextPage();
    onPageChange?.(currentPage + 1);
  };

  const handleNextCitation = () => {
    onNextCitation?.();
  };

  const handlePrevCitation = () => {
    onPrevCitation?.();
  };

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-placeholder">
        <div className="placeholder-content">
          <h3>No PDF Selected</h3>
          <p>Upload a PDF file to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <PDFControls
        currentPage={currentPage}
        numPages={numPages}
        canGoToPrev={canGoToPrev}
        canGoToNext={canGoToNext}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        pageInfo={pageInfo}
        zoomPercentage={zoomPercentage}
        citationPages={citationPages}
        currentCitationIndex={currentCitationIndex}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onGoToPage={handlePageChange}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onNextCitation={handleNextCitation}
        onPrevCitation={handlePrevCitation}
      />

      <div className="pdf-container">
        <div className="pdf-page-wrapper">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="pdf-loading">
                <div className="loading-spinner"></div>
                <p>Loading PDF...</p>
              </div>
            }
            error={
              <div className="pdf-error">
                <h3>Failed to load PDF</h3>
                <p>Please check the file and try again</p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          
          <PDFHighlights
            highlights={highlights}
            currentPage={currentPage}
            scale={scale}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
