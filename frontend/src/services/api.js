import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '');

const API = axios.create({
  baseURL: `${normalizedBaseUrl}/api`,
});

// Attach JWT to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
};

export const examAPI = {
  getDashboard: () => API.get('/exams/dashboard'),
  joinExam: (code) => API.post('/exams/join-exam', { code }),
  getExam: (id) => API.get(`/exams/${id}`),
  createExam: (data) => API.post('/exams/create', data),
  submitExam: (id) => API.post(`/exams/${id}/submit`),
  getAdminExamList: () => API.get('/exams/admin/list'),
  getAdminExamAttempts: (id) => API.get(`/exams/admin/${id}/attempts`),
};

export const monitoringAPI = {
  logEvent: (data) => API.post('/monitoring/log-event', data),
  uploadFrame: (data) => API.post('/monitoring/upload-frame', data),
  getLive: () => API.get('/monitoring/live'),
  getAttemptEvents: (id) => API.get(`/monitoring/attempt/${id}/events`),
  getAttemptDetail: (id) => API.get(`/monitoring/attempt/${id}/detail`),
};

export default API;
