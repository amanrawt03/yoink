import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;

export const catalogApi = {
  async listProducts(params) {
    return (await api.get('/api/products', { params })).data;
  },
  async getProduct(idOrSlug) {
    return (await api.get(`/api/products/${encodeURIComponent(idOrSlug)}`)).data;
  },
  async listCategories() {
    return (await api.get('/api/categories')).data;
  },
};
