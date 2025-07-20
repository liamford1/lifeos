'use client';
import ErrorBoundary from './ErrorBoundary';

export default function ErrorBoundaryWrapper(props) {
  return <ErrorBoundary {...props}>{props.children}</ErrorBoundary>;
} 