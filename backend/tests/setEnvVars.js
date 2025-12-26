/**
 * Set environment variables before tests run
 * This file runs BEFORE setupFilesAfterEnv
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
process.env.SESSION_SECRET = 'test_session_secret_for_testing';
process.env.CSRF_SECRET = 'test_csrf_secret_for_testing';
