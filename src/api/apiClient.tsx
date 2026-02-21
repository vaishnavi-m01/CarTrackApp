// src/api/apiClient.tsx
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import config from '../config/enviroment';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false,
    validateStatus: (status) => status >= 200 && status < 300,
});

// ✅ Request interceptor (NO AsyncStorage)
apiClient.interceptors.request.use(
    async (config: any) => {
        // If you want to add token later, you can do it here
        // Example (later):
        // config.headers.Authorization = `Bearer ${token}`;
        config.metadata = { startTime: Date.now() };
        return config;
    },
    (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        if (config.enableLogging && __DEV__) {
            const start = (response.config as any).metadata?.startTime;
            const duration = start ? Date.now() - start : 'unknown';
            const fullUrl = axios.getUri(response.config);
            console.log(
                `✅ API Success: ${response.config.method?.toUpperCase()} ${fullUrl} (${duration}ms)`
            );
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (config.enableLogging) {
            console.error(`❌ API Error: ${originalRequest?.url}`, {
                status: error.response?.status,
                message: error.message,
            });
        }

        // Handle 401 unauthorized
        if (error.response?.status === 401) {
            console.warn('⚠️ Unauthorized (401) - user may need to login again');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
