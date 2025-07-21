import React from "react";
import Button from "./Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      // Default: reload the page
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ reset: this.handleReset });
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-6">An unexpected error occurred. Please try again.</p>
          <Button
            variant="secondary"
            onClick={this.handleReset}
            className="px-4 py-2"
          >
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 