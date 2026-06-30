import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthTokens } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  verify2FA: (tempToken: string, code: string) => api.post('/auth/verify-2fa', { tempToken, code }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  setup2FA: () => api.get('/auth/setup-2fa'),
  enable2FA: (secret: string, code: string) => api.post('/auth/enable-2fa', { secret, code }),
  disable2FA: (code: string) => api.post('/auth/disable-2fa', { code }),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const importApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 });
  },
  listFiles: (page = 1, limit = 20) => api.get(`/import/files?page=${page}&limit=${limit}`),
  getFile: (id: string) => api.get(`/import/files/${id}`),
  deleteFile: (id: string) => api.delete(`/import/files/${id}`),
  getSheet: (id: string, params?: any) => api.get(`/import/sheets/${id}`, { params }),
  getSheetColumns: (id: string) => api.get(`/import/sheets/${id}/columns`),
};

export const dataApi = {
  create: (sheetId: string, data: any) => api.post(`/data/${sheetId}`, { data }),
  update: (sheetId: string, id: string, data: any) => api.put(`/data/${sheetId}/${id}`, { data }),
  delete: (sheetId: string, id: string) => api.delete(`/data/${sheetId}/${id}`),
  get: (sheetId: string, id: string) => api.get(`/data/${sheetId}/${id}`),
  duplicate: (sheetId: string, id: string) => api.post(`/data/${sheetId}/${id}/duplicate`),
  getStats: (sheetId: string) => api.get(`/data/${sheetId}/stats`),
  bulkDelete: (sheetId: string, ids: string[]) => api.post(`/data/${sheetId}/bulk-delete`, { ids }),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getChart: (params: any) => api.get('/analytics/chart', { params }),
  getAdvanced: (params: any) => api.get('/analytics/advanced', { params }),
  getTimeSeries: (params: any) => api.get('/analytics/timeseries', { params }),
};

export const exportApi = {
  excel: (sheetId: string) => api.get(`/exports/${sheetId}/excel`, { responseType: 'blob' }),
  csv: (sheetId: string) => api.get(`/exports/${sheetId}/csv`, { responseType: 'blob' }),
  pdf: (sheetId: string) => api.get(`/exports/${sheetId}/pdf`, { responseType: 'blob' }),
  json: (sheetId: string) => api.get(`/exports/${sheetId}/json`, { responseType: 'blob' }),
};

export const reportApi = {
  list: () => api.get('/reports'),
  create: (data: any) => api.post('/reports', data),
  get: (id: string) => api.get(`/reports/${id}`),
  update: (id: string, data: any) => api.put(`/reports/${id}`, data),
  delete: (id: string) => api.delete(`/reports/${id}`),
  generate: (id: string) => api.post(`/reports/${id}/generate`, {}, { responseType: 'blob' }),
};

export const dashboardApi = {
  list: () => api.get('/dashboards'),
  create: (data: any) => api.post('/dashboards', data),
  get: (id: string) => api.get(`/dashboards/${id}`),
  update: (id: string, data: any) => api.put(`/dashboards/${id}`, data),
  delete: (id: string) => api.delete(`/dashboards/${id}`),
  getDefault: () => api.get('/dashboards/default'),
};

export const adminApi = {
  listUsers: () => api.get('/admin/users'),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (page = 1, limit = 50) => api.get(`/admin/audit-logs?page=${page}&limit=${limit}`),
  getStats: () => api.get('/admin/stats'),
};

export const searchApi = {
  global: (q: string) => api.get(`/search/global?q=${encodeURIComponent(q)}`),
  advanced: (data: any) => api.post('/search/advanced', data),
};

export const mapApi = {
  getData: (params: any) => api.get('/map/data', { params }),
  getRegions: () => api.get('/map/regions'),
};
