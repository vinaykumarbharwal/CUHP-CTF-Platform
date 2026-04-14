import axios from 'axios';
import toast from 'react-hot-toast';

const normalizeBaseUrl = (rawUrl) => {
  if (!rawUrl || !rawUrl.trim()) {
    return null;
  }

  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL =
  normalizeBaseUrl(process.env.REACT_APP_API_URL) ||
  (process.env.NODE_ENV === 'production' ? 'https://cuhp-ctf-backend.onrender.com/api' : 'http://localhost:5001/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

export default api;
