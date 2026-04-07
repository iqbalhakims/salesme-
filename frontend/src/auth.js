// Simple auth helpers using localStorage
export const getToken = () => localStorage.getItem('crm_token');
export const setToken = (t) => localStorage.setItem('crm_token', t);
export const clearToken = () => localStorage.removeItem('crm_token');

export async function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
