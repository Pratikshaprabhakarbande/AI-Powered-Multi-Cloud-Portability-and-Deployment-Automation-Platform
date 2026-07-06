import api from './api.js';

const deployService = {
  create: (payload) => api.post('/deploy', payload).then((r) => r.data.data),
  get: (id) => api.get(`/deploy/${id}`).then((r) => r.data.data),
  list: (params) => api.get('/deploy', { params }).then((r) => r.data.data),
  rollback: (id) => api.post(`/deploy/${id}/rollback`).then((r) => r.data.data),
  cancel: (id) => api.delete(`/deploy/${id}`).then((r) => r.data.data),
  regions: (provider) => api.get(`/deploy/regions/${provider}`).then((r) => r.data.data)
};

export default deployService;
