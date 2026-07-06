/**
 * Auth API calls — maps 1:1 to the backend /api/auth endpoints.
 * Also includes dedicated /api/profile endpoint methods.
 */
import api from './api.js';

const authService = {
  // --- Legacy /api/auth endpoints (kept for backward compatibility) ---
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((r) => r.data),
  getProfile: () => api.get('/auth/profile').then((r) => r.data.data.user),
  updateProfile: (payload) => api.put('/auth/profile', payload).then((r) => r.data.data.user),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),

  // --- Dedicated /api/profile endpoints ---
  getProfileFromProfileEndpoint: () => api.get('/profile').then((r) => r.data.data.user),
  updateProfileDetails: (payload) => api.put('/profile', payload).then((r) => r.data.data.user),
  changeEmail: (payload) => api.put('/profile/email', payload).then((r) => r.data.data.user),
  changePassword: (payload) => api.put('/profile/password', payload).then((r) => r.data.data.user),
  uploadAvatar: (avatar) => api.post('/profile/avatar', { avatar }).then((r) => r.data.data.user)
};

export default authService;
