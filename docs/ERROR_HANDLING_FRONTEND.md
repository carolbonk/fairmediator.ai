# Frontend Error Handling & Boundaries

## Overview

This document describes how to implement error boundaries and error handling in the FairMediator React frontend. Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI.

---

## Table of Contents

1. [Error Boundary Implementation](#error-boundary-implementation)
2. [Sentry Integration](#sentry-integration)
3. [Error Types](#error-types)
4. [Best Practices](#best-practices)
5. [Testing Error Boundaries](#testing-error-boundaries)

---

## Error Boundary Implementation

### Basic Error Boundary Component

Create `/frontend/src/components/ErrorBoundary.jsx`:

```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Store error details
    this.setState({
      error,
      errorInfo,
    });

    // Send to Sentry (if configured)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h2 className="mt-4 text-xl font-semibold text-gray-900 text-center">
                Oops! Something went wrong
              </h2>

              <p className="mt-2 text-sm text-gray-600 text-center">
                {this.props.fallbackMessage ||
                  'An unexpected error occurred. Please try refreshing the page.'}
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-gray-700 font-medium">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Usage in App.jsx

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallbackMessage="The application encountered an error.">
      <Header />
      <main>
        {/* Your app components */}
      </main>
    </ErrorBoundary>
  );
}
```

### Multiple Error Boundaries

Use multiple boundaries for granular error handling:

```jsx
function App() {
  return (
    <ErrorBoundary fallbackMessage="Application error">
      <Header />

      <ErrorBoundary fallbackMessage="Search error">
        <SearchComponent />
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Results error">
        <ResultsComponent />
      </ErrorBoundary>

      <ErrorBoundary fallbackMessage="Chat error">
        <ChatPanel />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

---

## Sentry Integration

### Install Sentry SDK

```bash
cd frontend
npm install @sentry/react
```

### Initialize Sentry

Create `/frontend/src/config/sentry.js`:

```javascript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initSentry = () => {
  // Only initialize if DSN is configured
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,

    // Environment
    environment: import.meta.env.MODE,

    // Release tracking
    release: import.meta.env.VITE_RELEASE_VERSION || 'fairmediator@0.1.0',

    // Performance monitoring
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        // Mask all text content
        maskAllText: true,
        // Mask all media elements
        blockAllMedia: true,
      }),
    ],

    // Traces sample rate (10% in production)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session replay sample rate
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Before sending events
    beforeSend(event, hint) {
      // Filter out certain errors
      const error = hint.originalException;

      // Don't send cancelled requests
      if (error?.name === 'AbortError') {
        return null;
      }

      // Don't send network errors in development
      if (import.meta.env.DEV && error?.name === 'NetworkError') {
        return null;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Random plugins/extensions
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',

      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',

      // ResizeObserver (non-critical)
      'ResizeObserver loop limit exceeded',
    ],
  });

  console.log('Sentry initialized for frontend');
};
```

### Update main.jsx

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { initSentry } from './config/sentry';
import App from './App.jsx';
import './index.css';

// Initialize Sentry first
initSentry();

// Wrap App with Sentry error boundary
const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>An error occurred: {error.message}</div>
      )}
      showDialog
    >
      <SentryApp />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
```

### Update .env.example

Add to `/frontend/.env.example`:

```bash
# Sentry Error Tracking (FREE tier)
# Sign up at: https://sentry.io/signup/
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
VITE_RELEASE_VERSION=fairmediator@0.1.0
```

---

## Error Types

### 1. Component Errors

Caught by Error Boundaries:

```jsx
class MyComponent extends React.Component {
  render() {
    // This error will be caught by the nearest Error Boundary
    throw new Error('Component render error');
  }
}
```

### 2. Async Errors

NOT caught by Error Boundaries - handle with try/catch:

```jsx
const fetchData = async () => {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { location: 'fetchData' }
      });
    }

    // Show user-friendly message
    toast.error('Failed to load data. Please try again.');

    // Re-throw or handle
    throw error;
  }
};
```

### 3. Event Handler Errors

NOT caught by Error Boundaries - use try/catch:

```jsx
const handleClick = async () => {
  try {
    await doSomething();
  } catch (error) {
    console.error('Click handler error:', error);
    // Handle error appropriately
  }
};
```

### 4. Network Errors

Handle in API service layer:

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action.');
          break;
        case 429:
          // Rate limited
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          // Server error
          toast.error('Server error. Please try again.');
          // Send to Sentry
          if (window.Sentry) {
            window.Sentry.captureException(error);
          }
          break;
        default:
          toast.error(data.error?.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Best Practices

### 1. Strategic Error Boundary Placement

```jsx
// ✅ GOOD: Multiple boundaries for isolation
<ErrorBoundary>
  <Header />
  <ErrorBoundary>
    <CriticalFeature />
  </ErrorBoundary>
  <ErrorBoundary>
    <NonCriticalFeature />
  </ErrorBoundary>
</ErrorBoundary>

// ❌ BAD: Single boundary for entire app
<ErrorBoundary>
  <EntireApp />
</ErrorBoundary>
```

### 2. User-Friendly Error Messages

```jsx
// ✅ GOOD
"We couldn't load the mediator profiles. Please try again."

// ❌ BAD
"TypeError: Cannot read property 'map' of undefined"
```

### 3. Provide Recovery Actions

```jsx
<div>
  <p>Failed to load data.</p>
  <button onClick={retry}>Try Again</button>
  <button onClick={goHome}>Go Home</button>
  <button onClick={contactSupport}>Contact Support</button>
</div>
```

### 4. Log Errors Appropriately

```javascript
// Development: Full error details
if (import.meta.env.DEV) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('Component:', errorInfo.componentStack);
}

// Production: Send to monitoring service
if (import.meta.env.PROD && window.Sentry) {
  window.Sentry.captureException(error, { extra: errorInfo });
}
```

### 5. Handle Async Operations

```jsx
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await fetchData();
    setData(data);
  } catch (err) {
    setError(err.message);
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(err);
    }
  } finally {
    setLoading(false);
  }
};

// Render error state
if (error) {
  return <ErrorDisplay message={error} onRetry={loadData} />;
}
```

### 6. Graceful Degradation

```jsx
// Instead of crashing, show fallback
{data ? (
  <DataDisplay data={data} />
) : (
  <EmptyState message="No data available" />
)}
```

---

## Testing Error Boundaries

### Manual Testing

Create a test component:

```jsx
// TestError.jsx
const TestError = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error!');
  }

  return (
    <button onClick={() => setShouldError(true)}>
      Trigger Error
    </button>
  );
};
```

### Unit Testing

```jsx
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches errors and displays fallback', () => {
  // Suppress console.error for this test
  const spy = jest.spyOn(console, 'error').mockImplementation();

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

  spy.mockRestore();
});
```

---

## Common Scenarios

### Scenario 1: API Call Failure

```jsx
const MediatorList = () => {
  const [mediators, setMediators] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMediators();
        setMediators(data);
      } catch (err) {
        setError('Failed to load mediators');
        window.Sentry?.captureException(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return <div>{/* Render mediators */}</div>;
};
```

### Scenario 2: Form Submission Error

```jsx
const RegistrationForm = () => {
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 400) {
        // Validation error
        setError(err.response.data.error.message);
      } else {
        // Unexpected error
        setError('Registration failed. Please try again.');
        window.Sentry?.captureException(err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 p-3 rounded">
          {error}
        </div>
      )}
      {/* Form fields */}
    </form>
  );
};
```

---

## Checklist

- [ ] Install @sentry/react
- [ ] Create ErrorBoundary component
- [ ] Add Sentry configuration
- [ ] Update main.jsx with Sentry init
- [ ] Add VITE_SENTRY_DSN to .env
- [ ] Wrap app in ErrorBoundary
- [ ] Add error boundaries to critical features
- [ ] Implement try/catch for async operations
- [ ] Add error handling to API interceptors
- [ ] Test error scenarios
- [ ] Configure Sentry project settings
- [ ] Set up Sentry alerts

---

## Resources

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Error Handling in React](https://react.dev/learn/error-boundaries)

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
