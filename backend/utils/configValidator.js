/**
 * Configuration validator utility
 * Ensures all required environment variables are properly set
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_USER',
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT'
];

const recommendedEnvVars = [
  'NODE_ENV',
  'PORT',
  'FRONTEND_URL',
  'BCRYPT_ROUNDS'
];

export const validateConfig = () => {
  const errors = [];
  const warnings = [];

  // Check required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    } else if (process.env[envVar].startsWith('dev_') || process.env[envVar] === 'postgres' || process.env[envVar] === 'newsletter_app') {
      warnings.push(`Using default/unsafe value for environment variable: ${envVar}. Please set a production value.`);
    }
  }

  // Check recommended environment variables
  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Missing recommended environment variable: ${envVar}`);
    }
  }

  // Check for unsafe defaults in config
  if (process.env.NODE_ENV === 'production' && 
      (process.env.JWT_SECRET === 'dev_secret_key' || 
       process.env.JWT_REFRESH_SECRET === 'dev_refresh_secret_key')) {
    errors.push('Unsafe default JWT secrets detected in production environment');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('✅ Configuration validation passed');
};

export default validateConfig;