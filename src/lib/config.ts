export const API_CONFIG = {
    // In development, we use the local PHP server
    // You may need to adjust this if your PHP server runs on a different port
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    TIMEOUT: 5000
};
