/**
 * Environment Configuration
 * Handles different environments (development, staging, production)
 */

export interface EnvironmentConfig {
    apiBaseUrl: string;
    apiTimeout: number;
    enableLogging: boolean;
    enableAnalytics: boolean;
    version: string;
}

// Environment configurations
const environments: Record<string, EnvironmentConfig> = {
    development: {
        apiBaseUrl: 'http://103.146.234.88:3006/api',
        apiTimeout: 30000,
        enableLogging: true,
        enableAnalytics: false,
        version: '1.0.0-dev',
    },
    staging: {
        apiBaseUrl: 'http://103.146.234.88:3006/api',
        apiTimeout: 30000,
        enableLogging: true,
        enableAnalytics: true,
        version: '1.0.0-staging',
    },
    production: {
        apiBaseUrl: 'http://103.146.234.88:3006/api',
        apiTimeout: 15000,
        enableLogging: false,
        enableAnalytics: true,
        version: '1.0.0',
    },
};

// Get current environment (defaults to development)
const getCurrentEnvironment = (): string => {

    if (__DEV__) {
        return 'development';
    }

    // You can also check for environment variables or build configurations
    // For now, defaulting to production for non-dev builds
    return 'production';
};

export const currentEnvironment = getCurrentEnvironment();
export const config: EnvironmentConfig = environments[currentEnvironment];

// Validation function to ensure required config is present
export const validateConfig = (): boolean => {
    const requiredFields: (keyof EnvironmentConfig)[] = ['apiBaseUrl', 'apiTimeout'];

    for (const field of requiredFields) {
        if (!config[field]) {
            console.error(`Missing required configuration: ${field}`);
            return false;
        }
    }

    // Optional warning for HTTP, but allow it
    if (currentEnvironment === 'production' && config.apiBaseUrl.startsWith('http://')) {
        console.warn('⚠️ Production API is using HTTP instead of HTTPS');
    }

    return true;
};

// Initialize and validate configuration
if (!validateConfig()) {
    throw new Error('Invalid environment configuration');
}

export default config;
