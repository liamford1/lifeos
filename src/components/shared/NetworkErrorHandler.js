'use client';

import { useEffect, useState } from 'react';

export default function NetworkErrorHandler() {
  const [networkErrors, setNetworkErrors] = useState([]);

  useEffect(() => {
    // Listen for network errors
    const handleNetworkError = (event) => {
      if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
        console.warn('Network error detected:', event);
        setNetworkErrors(prev => [...prev, {
          type: 'resource',
          url: event.target.src || event.target.href,
          timestamp: new Date().toISOString()
        }]);
      }
    };

    // Listen for fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          console.warn('Fetch error:', response.status, response.statusText);
          setNetworkErrors(prev => [...prev, {
            type: 'fetch',
            status: response.status,
            statusText: response.statusText,
            url: args[0],
            timestamp: new Date().toISOString()
          }]);
        }
        return response;
      } catch (error) {
        console.warn('Fetch network error:', error);
        setNetworkErrors(prev => [...prev, {
          type: 'network',
          error: error.message,
          url: args[0],
          timestamp: new Date().toISOString()
        }]);
        throw error;
      }
    };

    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('fetch') || 
           event.reason.message.includes('network') ||
           event.reason.message.includes('Failed to fetch'))) {
        console.warn('Unhandled network rejection:', event.reason);
        setNetworkErrors(prev => [...prev, {
          type: 'unhandled',
          error: event.reason.message,
          timestamp: new Date().toISOString()
        }]);
      }
    };

    window.addEventListener('error', handleNetworkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleNetworkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.fetch = originalFetch;
    };
  }, []);

  // Don't render anything visible - this is just for error tracking
  return null;
} 