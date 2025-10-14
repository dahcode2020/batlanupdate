// Environment configuration
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Banque Atlantique',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_APP_ENV || 'production',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.banqueatlantique.tg',
  },
  features: {
    enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && import.meta.env.DEV,
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING !== 'false',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
    enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'false',
    maintenanceMode: import.meta.env.VITE_MAINTENANCE_MODE === 'true',
  },
  contact: {
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@banqueatlantique.tg',
    phone: import.meta.env.VITE_CONTACT_PHONE || '+228-XX-XX-XX-XX',
  },
  security: {
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '300000'), // 5 minutes
    maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '3'),
    passwordMinLength: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH || '8'),
  },
  performance: {
    enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER !== 'false',
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
    cacheTimeout: parseInt(import.meta.env.VITE_CACHE_TIMEOUT || '300000'), // 5 minutes
  }
};

export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production';
export const isTest = config.app.environment === 'test';