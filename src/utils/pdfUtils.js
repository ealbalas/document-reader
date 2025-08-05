/**
 * PDF Utility Functions
 * Common utilities for PDF processing and display
 */

/**
 * Validate if a file is a valid PDF
 */
export const isValidPDF = (file) => {
  if (!file) return false;
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extract page numbers from citation text
 */
export const extractPageNumbers = (text) => {
  if (!text) return [];
  
  const pageNumbers = [];
  const patterns = [
    /\(Source:\s*Pages?\s*([\d,\s-]+)\)/gi,
    /Page\s*(\d+)/gi,
    /Pages\s*([\d,\s-]+)/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const pageText = match[1];
      if (pageText) {
        // Handle different formats: "1, 2, 3" or "1-3" or "1, 3-5"
        const parts = pageText.split(',');
        parts.forEach(part => {
          part = part.trim();
          if (part.includes('-')) {
            // Handle ranges like "1-3"
            const [start, end] = part.split('-').map(n => parseInt(n.trim()));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
              }
            }
          } else {
            // Handle single page numbers
            const pageNum = parseInt(part);
            if (!isNaN(pageNum)) {
              pageNumbers.push(pageNum);
            }
          }
        });
      }
    }
  });
  
  // Remove duplicates and sort
  return [...new Set(pageNumbers)].sort((a, b) => a - b);
};

/**
 * Calculate highlight coordinates for PDF display
 */
export const calculateHighlightCoordinates = (highlight, scale, pageElement) => {
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
  
  return {
    x: adjustedX,
    y: adjustedY,
    width: adjustedWidth,
    height: adjustedHeight
  };
};

/**
 * Get highlight style based on match type
 */
export const getHighlightStyle = (highlight, coordinates) => {
  const baseStyle = {
    position: 'absolute',
    left: `${coordinates.x}px`,
    top: `${coordinates.y}px`,
    width: `${coordinates.width}px`,
    height: `${coordinates.height}px`,
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

/**
 * Generate tooltip text for highlights
 */
export const getHighlightTooltip = (highlight) => {
  const matchType = highlight.match_type || 'Highlighted';
  const text = highlight.text?.substring(0, 100) || '';
  const truncated = highlight.text?.length > 100 ? '...' : '';
  
  return `${matchType} text: "${text}${truncated}"`;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Clean up object URLs to prevent memory leaks
 */
export const cleanupObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Format page range for display
 */
export const formatPageRange = (pages) => {
  if (!pages || pages.length === 0) return '';
  if (pages.length === 1) return `Page ${pages[0]}`;
  
  const sortedPages = [...pages].sort((a, b) => a - b);
  
  if (sortedPages.length <= 3) {
    return `Pages ${sortedPages.join(', ')}`;
  }
  
  return `Pages ${sortedPages[0]}-${sortedPages[sortedPages.length - 1]}`;
};
