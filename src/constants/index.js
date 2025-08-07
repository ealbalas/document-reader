/**
 * Application Constants
 * Centralized configuration and constant values
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5002',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// PDF Configuration
export const PDF_CONFIG = {
  MAX_FILE_SIZE: 150 * 1024 * 1024, // 150MB
  ALLOWED_TYPES: ['application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf'],
  DEFAULT_SCALE: 1.0,
  MIN_SCALE: 0.5,
  MAX_SCALE: 3.0,
  SCALE_STEP: 0.2,
  DEFAULT_PAGE_WIDTH: 600,
  MAX_PAGE_WIDTH: 800,
};

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
};

// Question Answering Configuration
export const QA_CONFIG = {
  MAX_QUESTION_LENGTH: 1000,
  MIN_QUESTION_LENGTH: 3,
  MAX_CONTEXT_DISPLAY_LENGTH: 2000,
  HIGHLIGHT_ANIMATION_DURATION: 500,
};

// Highlight Types and Colors
export const HIGHLIGHT_TYPES = {
  EXACT: 'exact',
  WORD: 'word',
  SEMANTIC: 'semantic',
  DEBUG: 'test_debug',
  DEFAULT: 'default',
};

export const HIGHLIGHT_COLORS = {
  [HIGHLIGHT_TYPES.EXACT]: {
    background: 'rgba(255, 215, 0, 0.4)', // Gold
    border: 'rgba(255, 140, 0, 0.8)',
    shadow: 'rgba(255, 140, 0, 0.6)',
  },
  [HIGHLIGHT_TYPES.WORD]: {
    background: 'rgba(0, 255, 127, 0.3)', // Green
    border: 'rgba(0, 200, 100, 0.7)',
    shadow: 'rgba(0, 200, 100, 0.5)',
  },
  [HIGHLIGHT_TYPES.SEMANTIC]: {
    background: 'rgba(135, 206, 250, 0.3)', // Light blue
    border: 'rgba(70, 130, 180, 0.7)',
    shadow: 'rgba(70, 130, 180, 0.5)',
  },
  [HIGHLIGHT_TYPES.DEBUG]: {
    background: 'rgba(255, 0, 255, 0.2)', // Magenta
    border: 'rgba(255, 0, 255, 0.6)',
    shadow: 'rgba(255, 0, 255, 0.4)',
  },
  [HIGHLIGHT_TYPES.DEFAULT]: {
    background: 'rgba(135, 206, 250, 0.3)', // Light blue
    border: 'rgba(70, 130, 180, 0.7)',
    shadow: 'rgba(70, 130, 180, 0.5)',
  },
};

// Status Constants
export const UPLOAD_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const QA_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File size exceeds ${PDF_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
  INVALID_FILE_TYPE: 'Please select a valid PDF file',
  UPLOAD_FAILED: 'Failed to upload PDF file',
  QUESTION_TOO_SHORT: `Question must be at least ${QA_CONFIG.MIN_QUESTION_LENGTH} characters`,
  QUESTION_TOO_LONG: `Question must be less than ${QA_CONFIG.MAX_QUESTION_LENGTH} characters`,
  NO_PDF_UPLOADED: 'Please upload a PDF file first',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PDF_UPLOADED: 'PDF uploaded successfully',
  QUESTION_ANSWERED: 'Question answered successfully',
  CONFIG_UPDATED: 'Configuration updated successfully',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  MODEL_CONFIG: 'pdf_qa_model_config',
  USER_PREFERENCES: 'pdf_qa_user_preferences',
  RECENT_QUESTIONS: 'pdf_qa_recent_questions',
};

// Model Configuration
export const MODEL_PROVIDERS = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  SENTENCE_TRANSFORMERS: 'sentence-transformers',
};

// Default Model Configuration
export const DEFAULT_MODEL_CONFIG = {
  llm: {
    provider: MODEL_PROVIDERS.OPENAI,
    model: 'gpt-4o', // For Gemini, use 'gemini-1.5-flash', 'gemini-1.5-pro', or 'gemini-pro'
    temperature: 0.1,
    max_tokens: 1000,
  },
  embedding: {
    provider: MODEL_PROVIDERS.SENTENCE_TRANSFORMERS,
    model: 'all-mpnet-base-v2',
  },
};

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  SUBMIT_QUESTION: 'Enter',
  NEW_LINE: 'Shift+Enter',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  RESET_ZOOM: 'Ctrl+0',
  NEXT_PAGE: 'ArrowRight',
  PREV_PAGE: 'ArrowLeft',
  NEXT_CITATION: 'Ctrl+ArrowRight',
  PREV_CITATION: 'Ctrl+ArrowLeft',
};

// Feature Flags
export const FEATURES = {
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_AUTO_SAVE: true,
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_OFFLINE_MODE: false,
};

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info',
  ENABLE_REDUX_DEVTOOLS: process.env.NODE_ENV === 'development',
};

export default {
  API_CONFIG,
  PDF_CONFIG,
  UI_CONFIG,
  QA_CONFIG,
  HIGHLIGHT_TYPES,
  HIGHLIGHT_COLORS,
  UPLOAD_STATUS,
  QA_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  MODEL_PROVIDERS,
  DEFAULT_MODEL_CONFIG,
  KEYBOARD_SHORTCUTS,
  FEATURES,
  DEV_CONFIG,
};
