/**
 * Custom Hook for PDF Viewer Management
 * Handles PDF display, navigation, and zoom functionality
 */
import { useState, useEffect, useRef } from 'react';

export const usePDFViewer = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(600);
  const containerRef = useRef(null);

  // Constants for zoom limits
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3.0;
  const SCALE_STEP = 0.2;
  const DEFAULT_PAGE_WIDTH = 600;
  const MAX_PAGE_WIDTH = 800;

  /**
   * Update page width based on container size
   */
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setPageWidth(Math.min(containerWidth - 40, MAX_PAGE_WIDTH));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  /**
   * Handle PDF document load success
   */
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1); // Reset to first page on new document
  };

  /**
   * Navigate to previous page
   */
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  /**
   * Navigate to next page
   */
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages || 1));
  };

  /**
   * Navigate to specific page
   */
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= (numPages || 1)) {
      setCurrentPage(pageNumber);
    }
  };

  /**
   * Zoom in
   */
  const zoomIn = () => {
    setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  };

  /**
   * Zoom out
   */
  const zoomOut = () => {
    setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
  };

  /**
   * Reset zoom to default
   */
  const resetZoom = () => {
    setScale(1.0);
  };

  /**
   * Set specific zoom level
   */
  const setZoom = (newScale) => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale(clampedScale);
  };

  /**
   * Reset viewer state (useful when loading new document)
   */
  const resetViewer = () => {
    setCurrentPage(1);
    setNumPages(null);
    setScale(1.0);
    setPageWidth(DEFAULT_PAGE_WIDTH);
  };

  /**
   * Get navigation state
   */
  const getNavigationState = () => ({
    canGoToPrev: currentPage > 1,
    canGoToNext: currentPage < (numPages || 1),
    canZoomIn: scale < MAX_SCALE,
    canZoomOut: scale > MIN_SCALE,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === numPages,
    pageInfo: `${currentPage} of ${numPages || 1}`,
    zoomPercentage: Math.round(scale * 100),
  });

  return {
    // State
    currentPage,
    numPages,
    scale,
    pageWidth,
    containerRef,
    
    // Navigation state
    ...getNavigationState(),
    
    // Actions
    setCurrentPage: goToPage,
    onDocumentLoadSuccess,
    goToPrevPage,
    goToNextPage,
    goToPage,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    resetViewer,
    
    // Constants (for external use)
    MIN_SCALE,
    MAX_SCALE,
    SCALE_STEP,
  };
};
