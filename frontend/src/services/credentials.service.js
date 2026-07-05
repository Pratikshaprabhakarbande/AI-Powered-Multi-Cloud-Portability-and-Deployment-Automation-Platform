import api from './api.js';

const credentialsService = {
  getStatus: () => api.get('/credentials/status').then((r) => r.data.data),
  save: (provider, creds) => api.put(`/credentials/${provider}`, creds).then((r) => r.data.data),
  remove: (provider) => api.delete(`/credentials/${provider}`).then((r) => r.data.data),
  test: (provider) => api.post(`/credentials/${provider}/test`).then((r) => r.data.data)
};

export default credentialsService;
