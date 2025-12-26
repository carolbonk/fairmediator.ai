/**
 * Unit Tests for Utility Functions
 * Tests DRY utilities in isolation
 */

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound
} = require('../../src/utils/responseHandlers');

const {
  sanitizeString,
  sanitizeObject,
  removeDangerousChars
} = require('../../src/utils/sanitization');

describe('Response Handlers', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      sendSuccess(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data
      });
    });

    it('should send success response with custom status code', () => {
      sendSuccess(mockRes, { id: 1 }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should send success response with message', () => {
      sendSuccess(mockRes, { id: 1 }, 200, 'Created successfully');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created successfully',
        data: { id: 1 }
      });
    });
  });

  describe('sendError', () => {
    it('should send error response', () => {
      sendError(mockRes, 500, 'Internal server error');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should send error response with details', () => {
      sendError(mockRes, 400, 'Validation failed', { field: 'email' });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        field: 'email'
      });
    });
  });

  describe('sendValidationError', () => {
    it('should send validation error with array of errors', () => {
      const errors = ['Email is required', 'Password too short'];
      sendValidationError(mockRes, errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        errors
      });
    });
  });

  describe('sendUnauthorized', () => {
    it('should send 401 unauthorized', () => {
      sendUnauthorized(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });
  });

  describe('sendForbidden', () => {
    it('should send 403 forbidden', () => {
      sendForbidden(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('sendNotFound', () => {
    it('should send 404 not found', () => {
      sendNotFound(mockRes, 'User');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });
});

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const dirty = '<script>alert("xss")</script>Hello';
      const clean = sanitizeString(dirty);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('</script>');
      expect(clean).toContain('Hello');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string properties', () => {
      const dirty = {
        name: '<b>Test</b>',
        description: '<script>alert("xss")</script>',
        age: 25
      };

      const clean = sanitizeObject(dirty);

      expect(clean.name).not.toContain('<b>');
      expect(clean.description).not.toContain('<script>');
      expect(clean.age).toBe(25);
    });

    it('should remove MongoDB operators', () => {
      const dirty = {
        '$where': 'malicious',
        'user.name': 'test',
        normal: 'value'
      };

      const clean = sanitizeObject(dirty);

      expect(clean).not.toHaveProperty('$where');
      expect(clean).not.toHaveProperty('user.name');
      expect(clean.normal).toBe('value');
    });

    it('should handle nested objects', () => {
      const dirty = {
        user: {
          name: '<script>xss</script>',
          profile: {
            bio: '<b>Hello</b>'
          }
        }
      };

      const clean = sanitizeObject(dirty);

      expect(clean.user.name).not.toContain('<script>');
      expect(clean.user.profile.bio).not.toContain('<b>');
    });

    it('should handle arrays', () => {
      const dirty = ['<script>xss</script>', 'normal', '<b>bold</b>'];
      const clean = sanitizeObject(dirty);

      clean.forEach(item => {
        expect(item).not.toContain('<script>');
        expect(item).not.toContain('<b>');
      });
    });
  });

  describe('removeDangerousChars', () => {
    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const clean = removeDangerousChars(input);

      expect(clean).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = '<img src=x onerror=alert(1)>';
      const clean = removeDangerousChars(input);

      expect(clean).not.toContain('onerror=');
    });

    it('should remove eval calls', () => {
      const input = 'eval(malicious)';
      const clean = removeDangerousChars(input);

      expect(clean).not.toContain('eval(');
    });
  });
});
