# Frontend Utilities

This directory contains shared utility modules to eliminate code duplication and improve maintainability.

## Available Utilities

### apiFactory.js

Factory functions for creating standardized API endpoints.

**Usage:**

```javascript
import { createApiEndpoint, createResourceApi, handleApiError } from '../utils/apiFactory';

// Create single endpoint
const getUsers = createApiEndpoint('get', '/api/users');
const createUser = createApiEndpoint('post', '/api/users');

// Use it
const users = await getUsers();
const newUser = await createUser({ name: 'John', email: 'john@example.com' });

// Create full RESTful resource
const userApi = createResourceApi('/api/users');

// Use CRUD operations
const allUsers = await userApi.getAll();
const user = await userApi.getById('123');
const created = await userApi.create({ name: 'Jane' });
const updated = await userApi.update('123', { name: 'Jane Doe' });
await userApi.delete('123');
```

**Error Handling:**

```javascript
import { handleApiError } from '../utils/apiFactory';

try {
  const data = await getUsers();
} catch (error) {
  const message = handleApiError(error, 'Failed to load users');
  console.error(message); // User-friendly error message
}
```

**Retry Failed Requests:**

```javascript
import { retryApiCall } from '../utils/apiFactory';

// Retry up to 3 times with exponential backoff
const data = await retryApiCall(() => getUsers(), 3, 1000);
```

**Available functions:**
- `createApiEndpoint(method, path)` - Create single API endpoint
- `createResourceApi(resourcePath)` - Create RESTful CRUD endpoints
- `handleApiError(error, defaultMessage)` - Get user-friendly error message
- `retryApiCall(apiCall, retries, delay)` - Retry failed API calls

---

## Why These Utilities?

### Before (Duplicated Code)

```javascript
// In services/api.js
export const getMediators = async () => {
  const response = await api.get('/api/mediators');
  return response.data;
};

export const getMediatorById = async (id) => {
  const response = await api.get(`/api/mediators/${id}`);
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get('/api/dashboard/user-stats');
  return response.data;
};

// ... 10+ more similar functions
```

**Problems:**
- Repetitive boilerplate
- Inconsistent error handling
- Hard to add retry logic globally
- Lots of duplicate code

### After (DRY Utilities)

```javascript
import { createApiEndpoint, createResourceApi } from '../utils/apiFactory';

// Create resource API
export const mediatorApi = createResourceApi('/api/mediators');
// Now you have: getAll, getById, create, update, delete

// Create single endpoints
export const getUserStats = createApiEndpoint('get', '/api/dashboard/user-stats');
export const getSearchTrends = createApiEndpoint('get', '/api/dashboard/search-trends');
```

**Benefits:**
- ✅ Less code (reduces API module by 50%)
- ✅ Consistent error handling
- ✅ Easy to add features (retry, caching, etc.)
- ✅ Better maintainability

---

## Common Components

Reusable React components located in `/src/components/common/`:

### LoadingSpinner

**Usage:**

```jsx
import LoadingSpinner from '../components/common/LoadingSpinner';

function MyComponent() {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {loading && <LoadingSpinner size="lg" color="blue" />}
    </div>
  );
}
```

**Props:**
- `size` - 'sm', 'md', 'lg', 'xl' (default: 'md')
- `color` - 'white', 'blue', 'gray', 'primary' (default: 'white')
- `className` - Additional CSS classes

**Before:**
```jsx
// Duplicated in LoginForm.jsx, RegisterForm.jsx, etc.
<svg className="animate-spin h-5 w-5" ...>
  <circle ... />
  <path ... />
</svg>
```

**After:**
```jsx
<LoadingSpinner size="md" color="white" />
```

---

### EmptyState

**Usage:**

```jsx
import EmptyState from '../components/common/EmptyState';

function MediatorList({ mediators }) {
  if (mediators.length === 0) {
    return (
      <EmptyState
        title="No mediators found"
        description="Try adjusting your search filters"
        icon={<SearchIcon />}
        action={<button>Clear Filters</button>}
      />
    );
  }

  return <div>{/* render mediators */}</div>;
}
```

**Props:**
- `title` - Main heading (default: 'No Data Available')
- `description` - Explanation text
- `icon` - Optional icon component
- `action` - Optional action button/component
- `className` - Additional CSS classes

**Before:**
```jsx
// Duplicated in chart components
<div className="flex flex-col items-center justify-center p-8">
  <h3 className="text-lg font-semibold text-gray-700">No data available</h3>
  <p className="text-gray-500">There is nothing to display</p>
</div>
```

**After:**
```jsx
<EmptyState title="No data available" description="There is nothing to display" />
```

---

## Migration Guide

### Migrating API Calls

1. **Import factory:**
   ```javascript
   import { createApiEndpoint } from '../utils/apiFactory';
   ```

2. **Replace duplicate functions:**
   ```javascript
   // Old
   export const getMediators = async () => {
     const response = await api.get('/api/mediators');
     return response.data;
   };

   // New
   export const getMediators = createApiEndpoint('get', '/api/mediators');
   ```

3. **For resources, use createResourceApi:**
   ```javascript
   export const mediatorApi = createResourceApi('/api/mediators');
   // Access: mediatorApi.getAll(), mediatorApi.getById(id), etc.
   ```

### Migrating Loading Spinners

1. **Import component:**
   ```jsx
   import LoadingSpinner from '../components/common/LoadingSpinner';
   ```

2. **Replace inline SVG:**
   ```jsx
   // Old
   {loading && (
     <svg className="animate-spin h-5 w-5 text-white" ...>
       ...
     </svg>
   )}

   // New
   {loading && <LoadingSpinner size="md" color="white" />}
   ```

---

## Testing

Test utilities with your components:

```javascript
// test/utils/apiFactory.test.js
import { createApiEndpoint, handleApiError } from '../../src/utils/apiFactory';

describe('API Factory', () => {
  it('should create GET endpoint', async () => {
    const getUsers = createApiEndpoint('get', '/api/users');
    // Mock api.get and test
  });

  it('should handle errors', () => {
    const error = { response: { data: { error: 'Not found' } } };
    const message = handleApiError(error);
    expect(message).toBe('Not found');
  });
});
```

---

## Contributing

When adding new utilities:

1. Follow existing patterns
2. Add JSDoc comments
3. Update this README
4. Add tests
5. Update CONTRIBUTING.md

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.
