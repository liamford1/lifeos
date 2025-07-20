'use client';
import React from 'react';
import ErrorBoundary from './ErrorBoundary';

export default function ErrorBoundaryWrapper(props) {
  return <ErrorBoundary {...props}>{props.children}</ErrorBoundary>;
} 