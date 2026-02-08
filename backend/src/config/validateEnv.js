/**
 * Environment Variable Validation
 * Ensures all required environment variables are set before starting the server
 * Prevents using fallback secrets in production
 */

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
  'CORS_ORIGIN',
  'FRONTEND_URL'
];

const optionalEnvVars = [
  'HUGGINGFACE_API_KEY',
  // 'STRIPE_SECRET_KEY',
  // 'STRIPE_WEBHOOK_SECRET',
  // 'STRIPE_PREMIUM_PRICE_ID',
  'RESEND_API_KEY',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
];

/**
 * Validate environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
      `Please create a .env file based on .env.example and set all required variables.`
    );
  }

  // Validate JWT secret strength (production only)
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const sessionSecret = process.env.SESSION_SECRET;

    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }

    if (jwtRefreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long in production');
    }

    if (sessionSecret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long in production');
    }

    // Check for obviously insecure values
    const insecureValues = ['secret', 'password', 'test', 'dev', 'changeme', 'fallback'];
    for (const insecure of insecureValues) {
      if (jwtSecret.toLowerCase().includes(insecure)) {
        throw new Error(`JWT_SECRET appears to contain insecure value: "${insecure}"`);
      }
      if (jwtRefreshSecret.toLowerCase().includes(insecure)) {
        throw new Error(`JWT_REFRESH_SECRET appears to contain insecure value: "${insecure}"`);
      }
      if (sessionSecret.toLowerCase().includes(insecure)) {
        throw new Error(`SESSION_SECRET appears to contain insecure value: "${insecure}"`);
      }
    }
  }

  // Warn about optional variables
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      '\n⚠️  Optional environment variables not set:\n  - ' +
      warnings.join('\n  - ') +
      '\n\nSome features may be disabled.\n'
    );
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get environment variable with type safety
 * @param {string} name - Environment variable name
 * @param {string} defaultValue - Default value (only for non-production)
 * @returns {string} Environment variable value
 */
function getEnv(name, defaultValue = null) {
  const value = process.env[name];

  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment variable ${name} is required in production`);
    }

    if (defaultValue === null) {
      throw new Error(`Environment variable ${name} is required`);
    }

    return defaultValue;
  }

  return value;
}

module.exports = {
  validateEnv,
  getEnv
};
