import { API_CONFIG } from './config';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export const api = {
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });

            if (!response.ok) {
                return { success: false, error: `HTTP Error: ${response.status}` };
            }

            const data = await response.json();
            // If the backend response already follows the structure, return it directly
            if (data && typeof data === 'object' && 'success' in data) {
                return data;
            }
            return { success: true, data };
        } catch (e) {
            console.error(`API GET ${endpoint} failed:`, e);
            return { success: false, error: 'Network or parsing error' };
        }
    },

    async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
            });

            if (!response.ok) {
                return { success: false, error: `HTTP Error: ${response.status}` };
            }

            const data = await response.json();
            // If the backend response already follows the structure, return it directly
            if (data && typeof data === 'object' && 'success' in data) {
                return data;
            }
            return { success: true, data };
        } catch (e) {
            console.error(`API POST ${endpoint} failed:`, e);
            return { success: false, error: 'Network or parsing error' };
        }
    }
};
