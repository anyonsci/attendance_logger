import axios from 'axios';
import { getWorkspaceId } from '../data/workspace/workspaceContext';
import { showToast } from '../components/Toast';
import { supabase } from './supabase';

const DEFAULT_BACKEND_URL = 'https://attendance-logger-backend-git-main-anyonscis-projects.vercel.app/api';

const normalizeBaseUrl = (value) => {
  if (!value) return `${DEFAULT_BACKEND_URL}/`;
  const trimmed = value.replace(/\/+$/, '');
  return `${trimmed}/`;
};

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL),
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();

  config.headers = {
    ...(config.headers || {}),
  };

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
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

    if (status === 401 && !originalRequest?._retry) {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') window.location.hash = '#/signin';
    }

    if (status === 403) {
      const errorMessage = error.response?.data?.error || 'Forbidden: You do not have permission for this action.';
      showToast(errorMessage, 'error');
    }

    return Promise.reject(error);
  }
);

export default api;
