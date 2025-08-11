// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7cafd70c3f006a1cac003f870ed111c4@o4509702221135872.ingest.us.sentry.io/4509702225002496",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Configure beforeSend to filter out certain errors or modify them
  beforeSend(event, { originalException }) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Filter out network errors that might be temporary
    if (originalException && originalException.message) {
      const message = originalException.message;
      if (message.includes('net::ERR_FAILED') || 
          message.includes('Failed to fetch') ||
          message.includes('NetworkError')) {
        return null;
      }
    }
    
    return event;
  },

  // Configure integrations
  integrations: [
    // Add any specific integrations you need
  ],

  // Set environment
  environment: process.env.NODE_ENV,
}); 