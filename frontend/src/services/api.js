import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
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
};

export const monitoringAPI = {
  logEvent: (data) => API.post('/monitoring/log-event', data),
  uploadFrame: (data) => API.post('/monitoring/upload-frame', data),
  getLive: () => API.get('/monitoring/live'),
  getAttemptEvents: (id) => API.get(`/monitoring/attempt/${id}/events`),
  getAttemptDetail: (id) => API.get(`/monitoring/attempt/${id}/detail`),
};

export default API;
