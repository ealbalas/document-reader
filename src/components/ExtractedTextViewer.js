import React, { useState, useEffect } from 'react';
import { getExtractedText } from '../services/api';
import './ExtractedTextViewer.css';

const ExtractedTextViewer = ({ isVisible, onClose, fileId }) => {
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState(1);
  const [viewMode, setViewMode] = useState('text'); // 'text' or 'blocks'

  useEffect(() => {
    if (isVisible) {
      fetchExtractedText();
    }
  }, [isVisible]);

  const fetchExtractedText = async () => {
    if (!fileId) {
      setError('No file ID provided');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await getExtractedText(fileId);
      setExtractedData(data);
      setSelectedPage(1);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch extracted text');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  const currentPageData = extractedData?.pages?.find(p => p.page_number === selectedPage);

  return (
    <div className="extracted-text-overlay">
      <div className="extracted-text-modal">
        <div className="modal-header">
          <h2>Extracted Text Viewer</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {loading && <div className="loading">Loading extracted text...</div>}
        {error && <div className="error">{error}</div>}

        {extractedData && (
          <div className="modal-content">
            <div className="text-info">
              <div className="info-stats">
                <span><strong>Total Pages:</strong> {extractedData.total_pages}</span>
                <span><strong>Total Text Length:</strong> {extractedData.total_text_length.toLocaleString()} characters</span>
                <span><strong>Extraction Method:</strong> {extractedData.extraction_method}</span>
              </div>
              
              <div className="controls">
                <div className="page-selector">
                  <label>Page: </label>
                  <select 
                    value={selectedPage} 
                    onChange={(e) => setSelectedPage(parseInt(e.target.value))}
                  >
                    {extractedData.pages.map(page => (
                      <option key={page.page_number} value={page.page_number}>
                        Page {page.page_number} ({page.total_blocks} blocks)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="view-mode">
                  <label>View: </label>
                  <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
                    <option value="text">Full Text</option>
                    <option value="blocks">Text Blocks</option>
                  </select>
                </div>
              </div>
            </div>

            {currentPageData && (
              <div className="page-content">
                <h3>Page {currentPageData.page_number}</h3>
                
                {viewMode === 'text' ? (
                  <div className="full-text">
                    <div className="text-content">
                      {currentPageData.text || 'No text extracted from this page'}
                    </div>
                  </div>
                ) : (
                  <div className="text-blocks">
                    <div className="blocks-header">
                      <strong>Text Blocks ({currentPageData.total_blocks}):</strong>
                    </div>
                    {currentPageData.text_blocks.map(block => (
                      <div key={block.block_id} className="text-block">
                        <div className="block-header">
                          <span className="block-id">Block {block.block_id}</span>
                          {block.is_ocr && <span className="ocr-badge">OCR</span>}
                          <span className="coordinates">
                            ({block.coordinates.x}, {block.coordinates.y}) 
                            {block.coordinates.width}×{block.coordinates.height}
                          </span>
                        </div>
                        <div className="block-text">
                          {block.text}
                        </div>
                        {block.page_dimensions && (
                          <div className="page-dimensions">
                            Page size: {block.page_dimensions.width}×{block.page_dimensions.height}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return null; // Disable the View Extracted Text button by returning null
}
export default ExtractedTextViewer;
