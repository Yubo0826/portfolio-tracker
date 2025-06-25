const request = async (url, method = 'GET', data = null, headers = {}) => {
    const config = {
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
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      const isJSON = contentType && contentType.includes('application/json');
      const result = isJSON ? await response.json() : await response.text();
  
      if (!response.ok) {
        throw new Error(result.message || response.statusText || 'Network response was not ok');
      }
  
      return result;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

const api = {
    get: (url, headers) => request(url, 'GET', null, headers),
    post: (url, data, headers) => request(url, 'POST', data, headers),
    put: (url, data, headers) => request(url, 'PUT', data, headers),
    delete: (url, headers) => request(url, 'DELETE', null, headers)
  };

export default api;

  