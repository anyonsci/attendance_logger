import axios from 'axios';
import { getWorkspaceId } from '../data/workspace/workspaceContext';

const DEFAULT_BACKEND_URL = 'https://attendance-logger-backend-git-main-anyonscis-projects.vercel.app/api';

const normalizeBaseUrl = (value) => {
  if (!value) return `${DEFAULT_BACKEND_URL}/`;
  const trimmed = value.replace(/\/auth\/?$/, '').replace(/\/+$/, '');
  return `${trimmed}/`;
};

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL),
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

const getStoredToken = () => localStorage.getItem('auth_token');

const persistAuthToken = (token) => {
  if (!token) return;
  localStorage.setItem('auth_token', token);
};

const clearAuthState = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

const onRefreshComplete = (error, token = null) => {
  refreshSubscribers.forEach((subscriber) => {
    if (error) {
      subscriber.reject(error);
    } else {
      subscriber.resolve(token);
    }
  });
  refreshSubscribers = [];
};

const isAuthEndpoint = (url = '') => /\/auth(?:_refresh)?\/?$/.test(url);

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  const shouldAttachToken = token && !isAuthEndpoint(config.url || '');

  config.headers = {
    ...(config.headers || {}),
  };

  if (shouldAttachToken) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const workspaceId = getWorkspaceId();
  if (workspaceId) {
    config.params = { workspaceId, ...(config.params || {}) };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    // If a DELETE request returns 404 Not Found, consider the delete action successful.
    const method = originalRequest?.method?.toLowerCase();
    if (method === 'delete' && status === 404) {
      return Promise.resolve({
        data: { success: true, message: 'Resource not found or already deleted' },
        status: 200,
        statusText: 'OK',
        headers: error.response?.headers || {},
        config: originalRequest,
      });
    }

    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint(originalRequest?.url || '')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post('/auth_refresh');
        const refreshedToken = refreshResponse?.data?.token;

        if (refreshedToken) {
          persistAuthToken(refreshedToken);
          api.defaults.headers.common.Authorization = `Bearer ${refreshedToken}`;
          originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        }

        onRefreshComplete(null, refreshedToken);
        return api(originalRequest);
      } catch (refreshError) {
        onRefreshComplete(refreshError, null);
        clearAuthState();
        if (typeof window !== 'undefined') {
          window.location.hash = '#/signin';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
