const API_KEY = import.meta.env.VITE_API_KEY || '';

export function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      ...options.headers,
    },
  });
}
