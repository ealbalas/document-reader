/**
 * Custom Hook for Question Answering Management
 * Handles Q&A state, highlighting, and navigation
 */
import { useState } from 'react';
import { askQuestion } from '../services/api';

export const useQuestionAnswering = (fileId) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastContext, setLastContext] = useState(null);
  const [lastPagesUsed, setLastPagesUsed] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [citationPages, setCitationPages] = useState([]);
  const [currentCitationIndex, setCurrentCitationIndex] = useState(0);

  /**
   * Calculate highlight relevance and determine most important pages
   */
  const calculatePageRelevance = (highlights) => {
    if (!highlights?.length) return [];

    const pageScores = {};
    
    highlights.forEach(highlight => {
      const page = highlight.page;
      if (!pageScores[page]) {
        pageScores[page] = { 
          page, 
          highlightCount: 0, 
          totalRelevance: 0, 
          highlights: [] 
        };
      }
      
      // Calculate relevance score based on match type and text length
      let relevanceScore = 1;
      switch (highlight.match_type) {
        case 'exact':
          relevanceScore = 3;
          break;
        case 'word':
          relevanceScore = 2;
          break;
        default:
          relevanceScore = 1;
      }
      
      // Boost score for longer text matches
      if (highlight.text?.length > 50) {
        relevanceScore *= 1.5;
      }
      
      pageScores[page].highlightCount++;
      pageScores[page].totalRelevance += relevanceScore;
      pageScores[page].highlights.push(highlight);
    });

    // Calculate final scores and sort pages
    const sortedPages = Object.values(pageScores)
      .map(pageData => ({
        ...pageData,
        finalScore: pageData.totalRelevance * Math.sqrt(pageData.highlightCount)
      }))
      .sort((a, b) => b.finalScore - a.finalScore);

    return sortedPages;
  };

  /**
   * Submit a question and process the response
   */
  const submitQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await askQuestion(question.trim(), fileId);

      setAnswer(response.answer);
      setLastContext(response.context);
      setLastPagesUsed(response.pages_used || []);
      setHighlights(response.highlights || []);

      // Calculate and set citation pages
      if (response.highlights && response.highlights.length > 0) {
        const sortedPages = calculatePageRelevance(response.highlights);
        setCitationPages(sortedPages);
        setCurrentCitationIndex(0);
      } else if (response.pages_used && response.pages_used.length > 0) {
        // Fallback to first cited page if no highlights
        const firstCitedPage = response.pages_used[0];
        setCitationPages([{ 
          page: firstCitedPage, 
          highlightCount: 0, 
          totalRelevance: 1,
          finalScore: 1
        }]);
        setCurrentCitationIndex(0);
      }

      return response;
    } catch (error) {
      console.error('Error asking question:', error);
      const errorMessage = error.response?.data?.error || 'Sorry, there was an error processing your question.';
      setError(errorMessage);
      setAnswer(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to next citation page
   */
  const goToNextCitation = () => {
    if (citationPages.length > 0) {
      const nextIndex = (currentCitationIndex + 1) % citationPages.length;
      setCurrentCitationIndex(nextIndex);
    }
  };

  /**
   * Navigate to previous citation page
   */
  const goToPrevCitation = () => {
    if (citationPages.length > 0) {
      const prevIndex = currentCitationIndex === 0 
        ? citationPages.length - 1 
        : currentCitationIndex - 1;
      setCurrentCitationIndex(prevIndex);
    }
  };

  /**
   * Reset all Q&A state
   */
  const resetQA = () => {
    setQuestion('');
    setAnswer(null);
    setError(null);
    setLastContext(null);
    setLastPagesUsed([]);
    setHighlights([]);
    setCitationPages([]);
    setCurrentCitationIndex(0);
  };

  /**
   * Clear current answer but keep question
   */
  const clearAnswer = () => {
    setAnswer(null);
    setError(null);
    setLastContext(null);
    setLastPagesUsed([]);
    setHighlights([]);
    setCitationPages([]);
    setCurrentCitationIndex(0);
  };

  return {
    // State
    question,
    answer,
    loading,
    error,
    lastContext,
    lastPagesUsed,
    highlights,
    citationPages,
    currentCitationIndex,
    
    // Computed state
    hasAnswer: !!answer,
    hasContext: !!lastContext,
    hasHighlights: highlights.length > 0,
    hasCitations: citationPages.length > 0,
    
    // Actions
    setQuestion,
    submitQuestion,
    goToNextCitation,
    goToPrevCitation,
    resetQA,
    clearAnswer,
  };
};
