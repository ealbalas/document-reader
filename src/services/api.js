/**
 * API Service Module
 * Handles all HTTP requests to the backend
 */
import axios from 'axios';

// Use Fly.io backend for production, fallback to local for development
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://192.168.68.60:5002";

// Debug logging
console.log('Using API URL:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for regular requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * PDF Upload Service with extended timeout for large files
 */
export const uploadPDF = async (file, onUploadProgress = null) => {
  const formData = new FormData();
  formData.append('pdf', file);
  
  // Calculate estimated timeout based on file size (minimum 5 minutes, up to 15 minutes for very large files)
  const fileSizeMB = file.size / (1024 * 1024);
  const estimatedTimeoutMs = Math.max(300000, Math.min(900000, fileSizeMB * 2000)); // 5-15 minutes
  
  console.log(`Uploading ${fileSizeMB.toFixed(1)}MB PDF with ${estimatedTimeoutMs/1000}s timeout`);
  
  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: estimatedTimeoutMs, // Extended timeout for large files
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
  
  return response.data;
};

/**
 * Question Asking Service
 */
export const askQuestion = async (question, fileId) => {
  const response = await apiClient.post('/ask', { question, fileId });
  return response.data;
};

/**
 * Get Extracted Text Service
 */
export const getExtractedText = async (fileId) => {
  const response = await apiClient.get(`/extracted-text/${fileId}`);
  return response.data;
};

/**
 * Model Configuration Services
 */
export const getModelConfig = async () => {
  const response = await apiClient.get('/api/models/config');
  return response.data;
};

export const updateModelConfig = async (config) => {
  const response = await apiClient.post('/api/models/config', config);
  return response.data;
};

/**
 * Health Check Service
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
