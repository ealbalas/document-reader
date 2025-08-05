/**
 * Custom Hook for PDF Upload Management
 * Handles file upload state and operations
 */
import { useState, useRef } from 'react';
import axios from 'axios';

export const usePDFUpload = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      setUploadError('Please select a valid PDF file');
      setUploadStatus('error');
      return;
    }

    // Check file size and warn for very large files
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 500) {
      setUploadError('File size exceeds 500MB limit. Please select a smaller PDF file.');
      setUploadStatus('error');
      return;
    }

    // Reset previous state
    setUploadError(null);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Set local file state immediately for faster UI response
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));

      // Use original fast axios upload approach
      const formData = new FormData();
      formData.append('pdf', file);
      
      // Simulate progress for better UX (since original was very fast)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return Math.min(90, prev + Math.floor(Math.random() * 15) + 5);
        });
      }, 100);

      const result = await axios.post('http://localhost:5002/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadStatus('success');
      console.log('PDF uploaded successfully:', result.data);
      
      return result.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload PDF';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - file may be too large or connection too slow';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large - maximum size is 500MB';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
      setUploadStatus('error');
      setUploadProgress(0);
      
      // Clean up on error
      setPdfFile(null);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      
      throw error;
    }
  };

  const resetUpload = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfFile(null);
    setPdfUrl(null);
    setUploadStatus('idle');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return {
    // State
    pdfFile,
    pdfUrl,
    uploadStatus,
    uploadError,
    uploadProgress,
    isUploading: uploadStatus === 'uploading',
    isUploaded: uploadStatus === 'success',
    hasError: uploadStatus === 'error',
    
    // Refs
    fileInputRef,
    
    // Actions
    handleFileUpload,
    resetUpload,
    triggerFileSelect,
  };
};
