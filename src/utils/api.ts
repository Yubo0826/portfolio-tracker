const getAPIBaseURL = (): string => {
    if (window.location.hostname === 'localhost') {
        return 'http://localhost:3000';
    }
    return import.meta.env.VITE_API_URL_BASE || '';
}

interface RequestConfig extends RequestInit {
    headers?: Record<string, string>;
}

const request = async <T = any>(url: string, method: string = 'GET', data: any = null, headers: Record<string, string> = {}): Promise<T> => {
    const apiURL = getAPIBaseURL() + url;
    const config: RequestConfig = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(apiURL, config);
        const contentType = response.headers.get('content-type');
        const isJSON = contentType && contentType.includes('application/json');
        const result = isJSON ? await response.json() : await response.text();

        if (!response.ok) {
            throw new Error(result.message || response.statusText || 'Network response was not ok');
        }

        return result as T;
    } catch (error) {
        throw error;
    }
};

const api = {
    get: <T = any>(url: string, headers?: Record<string, string>) => request<T>(url, 'GET', null, headers),
    post: <T = any>(url: string, data: any, headers?: Record<string, string>) => request<T>(url, 'POST', data, headers),
    put: <T = any>(url: string, data: any, headers?: Record<string, string>) => request<T>(url, 'PUT', data, headers),
    delete: <T = any>(url: string, data?: any, headers?: Record<string, string>) => request<T>(url, 'DELETE', data, headers)
};

export default api;
