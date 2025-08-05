/**
 * PDFHighlights Component
 * Renders highlights overlay on PDF pages
 */
import React from 'react';
import { 
  calculateHighlightCoordinates, 
  getHighlightStyle, 
  getHighlightTooltip 
} from '../../utils/pdfUtils';
import { HIGHLIGHT_TYPES } from '../../constants';
import './PDFHighlights.css';

const PDFHighlights = ({ highlights, currentPage, scale }) => {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  // Filter highlights for the current page
  const currentPageHighlights = highlights.filter(h => h.page === currentPage);
  
  if (currentPageHighlights.length === 0) {
    return null;
  }

  const renderHighlight = (highlight, index) => {
    // Get the actual rendered page dimensions
    const pageElement = document.querySelector('.react-pdf__Page__canvas');
    
    // Calculate adjusted coordinates
    const coordinates = calculateHighlightCoordinates(highlight, scale, pageElement);
    
    // Get highlight style
    const style = getHighlightStyle(highlight, coordinates);
    
    // Generate tooltip
    const tooltip = getHighlightTooltip(highlight);

    return (
      <div
        key={`highlight-${currentPage}-${index}`}
        className={`pdf-highlight highlight-${highlight.match_type || 'default'}`}
        style={style}
        title={tooltip}
        data-highlight-type={highlight.match_type}
        data-page={currentPage}
      />
    );
  };

  return (
    <div className="pdf-highlights-overlay">
      {currentPageHighlights.map(renderHighlight)}
      <HighlightLegend highlights={currentPageHighlights} />
    </div>
  );
};

/**
 * HighlightLegend Component
 * Shows legend for different highlight types
 */
const HighlightLegend = ({ highlights }) => {
  if (!highlights || highlights.length === 0) return null;

  const highlightTypes = [...new Set(highlights.map(h => h.match_type))].filter(Boolean);
  
  if (highlightTypes.length === 0) return null;

  const typeLabels = {
    [HIGHLIGHT_TYPES.EXACT]: 'Exact Matches',
    [HIGHLIGHT_TYPES.WORD]: 'Word Matches',
    [HIGHLIGHT_TYPES.SEMANTIC]: 'Semantic Matches',
    [HIGHLIGHT_TYPES.DEBUG]: 'Debug',
    [HIGHLIGHT_TYPES.DEFAULT]: 'General'
  };

  return (
    <div className="highlight-legend">
      <span className="legend-title">Highlights:</span>
      {highlightTypes.map(type => (
        <span 
          key={type} 
          className={`legend-item highlight-${type}`}
          data-type={type}
        >
          <span className="legend-color"></span>
          {typeLabels[type] || type}
        </span>
      ))}
    </div>
  );
};

export default PDFHighlights;
