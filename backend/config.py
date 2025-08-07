import os
from typing import Dict, Any

class ModelConfig:
    def __init__(self):
        # Default configurations
        self.llm_config = {
            "provider": "openai",
            "model": "gpt-4o",
            "api_key": os.getenv("OPENAI_API_KEY"),
            "temperature": 0.1,
            "max_tokens": 1000
        }
        
        self.embedding_config = {
            "provider": "sentence-transformers", 
            "model": "all-mpnet-base-v2",
            "api_key": None  # Not needed for sentence-transformers
        }
        
        # Load from environment variables if available
        self._load_from_env()
    
    def _load_from_env(self):
        """Load configuration from environment variables"""
        if os.getenv("LLM_PROVIDER"):
            self.llm_config["provider"] = os.getenv("LLM_PROVIDER")
        if os.getenv("LLM_MODEL"):
            self.llm_config["model"] = os.getenv("LLM_MODEL")
        if os.getenv("LLM_TEMPERATURE"):
            self.llm_config["temperature"] = float(os.getenv("LLM_TEMPERATURE"))
        if os.getenv("LLM_MAX_TOKENS"):
            self.llm_config["max_tokens"] = int(os.getenv("LLM_MAX_TOKENS"))
            
        if os.getenv("EMBEDDING_PROVIDER"):
            self.embedding_config["provider"] = os.getenv("EMBEDDING_PROVIDER")
        if os.getenv("EMBEDDING_MODEL"):
            self.embedding_config["model"] = os.getenv("EMBEDDING_MODEL")
    
    def update_llm_config(self, config: Dict[str, Any]):
        """Update LLM configuration"""
        self.llm_config.update(config)
    
    def update_embedding_config(self, config: Dict[str, Any]):
        """Update embedding configuration"""
        self.embedding_config.update(config)
    
    def get_llm_config(self) -> Dict[str, Any]:
        """Get current LLM configuration"""
        return self.llm_config.copy()
    
    def get_embedding_config(self) -> Dict[str, Any]:
        """Get current embedding configuration"""
        return self.embedding_config.copy()

# Global configuration instance
model_config = ModelConfig()

# Available model options
AVAILABLE_MODELS = {
    "llm": {
        "openai": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
        ],
        "gemini": [
            "gemini-1.5-flash",
            "gemini-2.5-flash",
            "gemini-2.5-pro"
        ]
    },
    "embedding": {
        "openai": [
            "text-embedding-ada-002",
            "text-embedding-3-small",
            "text-embedding-3-large"
        ],
        "sentence-transformers": [
            "all-MiniLM-L6-v2",
            "all-mpnet-base-v2",
            "multi-qa-MiniLM-L6-cos-v1",
            "all-distilroberta-v1"
        ]
    }
}
