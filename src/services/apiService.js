export const HOST = 'http://localhost:8080';

function getStoredToken(){
  return sessionStorage.getItem("jwtToken") || localStorage.getItem('jwtToken');
}

export function createHeaders(auth) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = auth?.token || getStoredToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${HOST}${endpoint}`, {
    ...options,
    headers: {
      ...createHeaders(options.auth),
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};
