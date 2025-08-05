# Backend Architecture Documentation

## Overview

The PDF Question Answering backend has been completely modularized following Flask best practices and modern software architecture patterns. The new structure provides better maintainability, scalability, and testability.

## Project Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py              # Package initialization
│   ├── main.py                  # Application factory
│   ├── config.py                # Configuration management
│   ├── extensions.py            # Flask extensions and services
│   ├── middleware.py            # Request/response middleware
│   │
│   ├── routes/                  # API route blueprints
│   │   ├── __init__.py         # Blueprint registration
│   │   ├── upload_routes.py    # File upload endpoints
│   │   ├── question_routes.py  # Question answering endpoints
│   │   ├── model_routes.py     # Model configuration endpoints
│   │   └── health_routes.py    # Health check endpoints
│   │
│   ├── services/               # Business logic services
│   │   ├── __init__.py        
│   │   ├── pdf_service.py     # PDF processing service
│   │   ├── ai_service.py      # AI/LLM service
│   │   └── embedding_service.py # Embedding and search service
│   │
│   └── utils/                 # Utility modules
│       ├── __init__.py       
│       ├── logger.py         # Logging configuration
│       └── validators.py     # Input validation utilities
│
├── run.py                    # Application entry point
├── requirements.txt          # Python dependencies
└── BACKEND_ARCHITECTURE.md  # This documentation
```

## Key Components

### 1. Application Factory (`app/main.py`)

The application factory pattern allows for:
- Multiple app configurations (development, production, testing)
- Better testing capabilities
- Cleaner initialization process

```python
def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions, middleware, and blueprints
    init_extensions(app)
    register_middleware(app)
    register_blueprints(app)
    
    return app
```

### 2. Configuration Management (`app/config.py`)

- Environment-based configuration classes
- Centralized model configuration
- Secure handling of API keys and sensitive data

### 3. Service Layer (`app/services/`)

#### PDF Service (`pdf_service.py`)
- PDF text extraction using PyMuPDF
- Document domain detection (medical, legal, general)
- Text block extraction with coordinates
- OCR fallback for scanned documents

#### AI Service (`ai_service.py`)
- Multi-provider LLM support (OpenAI, Gemini)
- Intelligent fallback mechanisms
- Configurable model parameters
- Structured prompt engineering

#### Embedding Service (`embedding_service.py`)
- Semantic search using ChromaDB
- Multiple embedding providers
- Enhanced chunking strategies
- Domain-specific collections

### 4. Route Blueprints (`app/routes/`)

#### Upload Routes (`upload_routes.py`)
- `POST /api/upload` - Upload and process PDF files
- `GET /api/extracted-text` - Get extracted text
- `POST /api/clear` - Clear current document

#### Question Routes (`question_routes.py`)
- `POST /api/ask` - Answer questions about uploaded PDF

#### Model Routes (`model_routes.py`)
- `GET /api/models/config` - Get current model configuration
- `POST /api/models/config` - Update model configuration
- `GET /api/models/available` - Get available models
- `GET /api/models/status` - Get model service status

#### Health Routes (`health_routes.py`)
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed service status
- `GET /health/system` - System information

### 5. Middleware (`app/middleware.py`)

- Request/response logging
- Security headers
- Error handling
- Input validation decorators
- Rate limiting (placeholder)

### 6. Utilities (`app/utils/`)

#### Logger (`logger.py`)
- Structured logging configuration
- File and console handlers
- Log rotation

#### Validators (`validators.py`)
- Input validation functions
- Custom validation exceptions
- File upload validation
- Model configuration validation

## Best Practices Implemented

### 1. Separation of Concerns
- Routes handle HTTP concerns only
- Services contain business logic
- Utilities provide reusable functions

### 2. Error Handling
- Centralized error handling middleware
- Structured error responses
- Proper HTTP status codes
- Comprehensive logging

### 3. Input Validation
- Request data validation
- File upload validation
- Model configuration validation
- Sanitization of user inputs

### 4. Security
- Security headers middleware
- Input sanitization
- File type validation
- Environment-based configuration

### 5. Logging
- Structured logging with timestamps
- Different log levels
- File rotation
- Request/response logging

### 6. Configuration Management
- Environment-based configs
- Centralized model configuration
- Secure API key handling
- Easy configuration updates

## API Endpoints

### File Upload
```
POST /api/upload
- Upload PDF file
- Extract text and create embeddings
- Return document metadata

GET /api/extracted-text
- Get extracted text from current document
- Return structured text with coordinates

POST /api/clear
- Clear current document and embeddings
```

### Question Answering
```
POST /api/ask
- Answer questions about uploaded PDF
- Use semantic search and AI models
- Return answer with source citations
```

### Model Configuration
```
GET /api/models/config
- Get current model configuration

POST /api/models/config
- Update LLM and embedding model settings

GET /api/models/available
- Get list of available models

GET /api/models/status
- Get status of AI and embedding services
```

### Health Checks
```
GET /health
- Basic health check

GET /health/detailed
- Detailed service status

GET /health/system
- System resource information
```

## Running the Application

### Development
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Production
```bash
cd backend
pip install -r requirements.txt
export FLASK_ENV=production
export FLASK_DEBUG=false
python run.py
```

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Optional
FLASK_ENV=development
FLASK_DEBUG=true
FLASK_PORT=5002
FLASK_HOST=127.0.0.1
LOG_LEVEL=INFO
```

## Migration from Monolithic Structure

The original `app.py` file has been completely refactored into this modular structure:

1. **Routes** moved to `app/routes/` blueprints
2. **Business logic** extracted to `app/services/`
3. **Configuration** centralized in `app/config.py`
4. **Utilities** organized in `app/utils/`
5. **Error handling** standardized in middleware
6. **Logging** properly configured
7. **Input validation** centralized

## Benefits of New Architecture

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Each component can be tested independently
3. **Scalability**: Easy to add new features and services
4. **Reusability**: Services can be reused across different routes
5. **Configuration**: Centralized and environment-aware
6. **Error Handling**: Consistent across the application
7. **Logging**: Comprehensive and structured
8. **Security**: Built-in security best practices

## Future Enhancements

1. **Database Integration**: Add SQLAlchemy for persistent storage
2. **Caching**: Implement Redis for caching embeddings
3. **Authentication**: Add JWT-based authentication
4. **Rate Limiting**: Implement proper rate limiting
5. **API Documentation**: Add Swagger/OpenAPI documentation
6. **Testing**: Add comprehensive unit and integration tests
7. **Monitoring**: Add application performance monitoring
8. **Docker**: Containerize the application
