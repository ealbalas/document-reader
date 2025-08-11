import React, { useState, useEffect } from 'react';
import './ModelConfig.css';
import { getModelConfig, updateModelConfig } from '../services/api';

const ModelConfig = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState({
    llm: {},
    embedding: {},
    available_models: {}
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getModelConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
      setMessage('Error fetching configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async () => {
    try {
      setLoading(true);
      await updateModelConfig({
        llm: config.llm,
        embedding: config.embedding
      });
      
      setMessage('Configuration updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating config:', error);
      setMessage('Error updating configuration');
    } finally {
      setLoading(false);
      onClose()
    }
  };

  const handleLLMChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      llm: {
        ...prev.llm,
        [field]: value
      }
    }));
  };

  const handleEmbeddingChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      embedding: {
        ...prev.embedding,
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="model-config-overlay">
      <div className="model-config-modal">
        <div className="model-config-header">
          <h2>Model Configuration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {loading && <div className="loading">Loading...</div>}
        {message && <div className={`message ${message.includes('Error') ? 'error' : ''}`}>{message}</div>}
        
        <div className="model-config-content">
          {/* LLM Configuration */}
          <div className="config-section">
            <h3>Language Model (LLM)</h3>
            
            <div className="form-group">
              <label>Provider:</label>
              <select 
                value={config.llm.provider || ''} 
                onChange={(e) => handleLLMChange('provider', e.target.value)}
              >
                <option value="">Select Provider</option>
                {Object.keys(config.available_models.llm || {}).map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            
            {config.llm.provider && (
              <div className="form-group">
                <label>Model:</label>
                <select 
                  value={config.llm.model || ''} 
                  onChange={(e) => handleLLMChange('model', e.target.value)}
                >
                  <option value="">Select Model</option>
                  {(config.available_models.llm?.[config.llm.provider] || []).map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-group">
              <label>Temperature:</label>
              <input 
                type="number" 
                min="0" 
                max="2" 
                step="0.1"
                value={config.llm.temperature || 0.1} 
                onChange={(e) => handleLLMChange('temperature', parseFloat(e.target.value))}
              />
              <small>Lower values (0.1) for factual accuracy, higher values (1.0+) for creativity</small>
            </div>
            
            <div className="form-group">
              <label>Max Tokens:</label>
              <input 
                type="number" 
                min="100" 
                max="4000"
                value={config.llm.max_tokens || 1000} 
                onChange={(e) => handleLLMChange('max_tokens', parseInt(e.target.value))}
              />
              <small>Maximum length of the response</small>
            </div>
          </div>
          
          {/* Embedding Configuration */}
          <div className="config-section">
            <h3>Embedding Model</h3>
            
            <div className="form-group">
              <label>Provider:</label>
              <select 
                value={config.embedding.provider || ''} 
                onChange={(e) => handleEmbeddingChange('provider', e.target.value)}
              >
                <option value="">Select Provider</option>
                {Object.keys(config.available_models.embedding || {}).map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            
            {config.embedding.provider && (
              <div className="form-group">
                <label>Model:</label>
                <select 
                  value={config.embedding.model || ''} 
                  onChange={(e) => handleEmbeddingChange('model', e.target.value)}
                >
                  <option value="">Select Model</option>
                  {(config.available_models.embedding?.[config.embedding.provider] || []).map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="info-box">
              <strong>Note:</strong> Changing the embedding model will require re-processing any uploaded documents.
            </div>
          </div>
        </div>
        
        <div className="model-config-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={async () => {
            await updateConfig();
          }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelConfig;
