import { api } from '../api/client';

export const adminApi = {
  stats: () => api.get('/admin/stats'),

  listCategories: () => api.get('/admin/categories'),
  createCategory: (body) => api.post('/admin/categories', body),
  updateCategory: (id, body) => api.patch(`/admin/categories/${id}`, body),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  listPuzzles: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/puzzles${q ? `?${q}` : ''}`);
  },
  getPuzzle: (id) => api.get(`/admin/puzzles/${id}`),
  createPuzzle: (body) => api.post('/admin/puzzles', body),
  updatePuzzle: (id, body) => api.patch(`/admin/puzzles/${id}`, body),
  deletePuzzle: (id) => api.delete(`/admin/puzzles/${id}`),

  listUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/users${q ? `?${q}` : ''}`);
  },
  updateUser: (id, body) => api.patch(`/admin/users/${id}`, body),

  listPricing: () => api.get('/admin/pricing'),
  upsertPricing: (body) => api.post('/admin/pricing', body),
};
