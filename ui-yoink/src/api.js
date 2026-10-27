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

export const cartApi = {
  async getCart() {
    return (await api.get('/api/cart')).data.cart;
  },
  async addItem(productId, quantity = 1) {
    return (await api.post('/api/cart/items', { productId, quantity })).data.cart;
  },
  async updateItem(productId, quantity) {
    return (await api.patch(`/api/cart/items/${encodeURIComponent(productId)}`, { quantity })).data
      .cart;
  },
  async removeItem(productId) {
    return (await api.delete(`/api/cart/items/${encodeURIComponent(productId)}`)).data.cart;
  },
};
