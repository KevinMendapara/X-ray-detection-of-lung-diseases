import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tb_detect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.access_token) {
      localStorage.setItem('tb_detect_token', res.data.access_token);
      localStorage.setItem('tb_detect_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.access_token) {
      localStorage.setItem('tb_detect_token', res.data.access_token);
      localStorage.setItem('tb_detect_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('tb_detect_token');
    localStorage.removeItem('tb_detect_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('tb_detect_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
};

export const patientsAPI = {
  list: async (search = '') => {
    const res = await api.get('/patients', { params: { search } });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/patients/${id}`, data);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/patients', data);
    return res.data;
  }
};

export const xrayAPI = {
  getSamples: async () => {
    const res = await api.get('/xray/samples');
    return res.data;
  },
  checkQuality: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/xray/quality-check', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  upload: async (file, patientId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (patientId) formData.append('patient_id', patientId);
    const res = await api.post('/xray/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  predict: async (imageFilename, patientId) => {
    const formData = new FormData();
    formData.append('image_filename', imageFilename);
    formData.append('patient_id', patientId);
    const res = await api.post('/xray/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getGradcam: async (analysisId) => {
    const formData = new FormData();
    formData.append('analysis_id', analysisId);
    const res = await api.post('/xray/gradcam', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export const reportsAPI = {
  list: async (search = '', filter = 'All', options = {}) => {
    const params = typeof search === 'object'
      ? search
      : { search, prediction_filter: filter, ...options };
    const res = await api.get('/reports', { params });
    return res.data;
  },
  updateReview: async (id, review) => {
    const res = await api.patch(`/reports/${id}/review`, review);
    return res.data;
  },
  exportCsv: async (params = {}) => {
    const res = await api.get('/reports/export.csv', { params, responseType: 'blob' });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/reports/${id}`);
    return res.data;
  },
  getPdfUrl: (id) => `/api/reports/${id}/pdf`
};

export const contactAPI = {
  submit: async (payload) => {
    const res = await api.post('/contact', payload);
    return res.data;
  },
  inbox: async () => {
    const res = await api.get('/admin/messages');
    return res.data;
  }
};

export const adminAPI = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  getMetrics: async () => {
    const res = await api.get('/admin/metrics');
    return res.data;
  },
  getLogs: async () => {
    const res = await api.get('/admin/logs');
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  getMessages: async () => {
    const res = await api.get('/admin/messages');
    return res.data;
  }
};

export default api;
