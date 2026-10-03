import axios from 'axios';

// The single Axios instance used by every service.
// Authentication is an HTTP-only cookie, so credentials must be sent with each request.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Turns any Axios error into a user-friendly message.
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request) return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
};

export default api;
