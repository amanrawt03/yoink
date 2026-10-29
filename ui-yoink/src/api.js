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
  async getReviews(idOrSlug) {
    return (await api.get(`/api/products/${encodeURIComponent(idOrSlug)}/reviews`)).data.reviews;
  },
  async createReview(idOrSlug, review) {
    return (await api.post(`/api/products/${encodeURIComponent(idOrSlug)}/reviews`, review)).data
      .review;
  },
  async updateReview(reviewId, review) {
    return (await api.patch(`/api/reviews/${encodeURIComponent(reviewId)}`, review)).data.review;
  },
  async deleteReview(reviewId) {
    return (await api.delete(`/api/reviews/${encodeURIComponent(reviewId)}`)).data;
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

export const orderApi = {
  async createOrder(shippingAddress, idempotencyKey) {
    return (
      await api.post(
        '/api/orders',
        { shippingAddress },
        { headers: { 'Idempotency-Key': idempotencyKey } },
      )
    ).data.order;
  },
  async myOrders() {
    return (await api.get('/api/orders/my-orders')).data.orders;
  },
  async getOrder(id) {
    return (await api.get(`/api/orders/${encodeURIComponent(id)}`)).data.order;
  },
  async allOrders(params) {
    return (await api.get('/api/orders', { params })).data;
  },
  async updateStatus(id, status) {
    return (await api.patch(`/api/orders/${encodeURIComponent(id)}/status`, { status })).data.order;
  },
  async markPaid(id) {
    return (await api.patch(`/api/orders/${encodeURIComponent(id)}/payment/paid`)).data.order;
  },
};

export const accountApi = {
  async addAddress(address) {
    return (await api.post('/api/auth/addresses', address)).data;
  },
  async makeDefaultAddress(addressId) {
    return (await api.patch(`/api/auth/addresses/${encodeURIComponent(addressId)}/default`)).data;
  },
  async deleteAddress(addressId) {
    return (await api.delete(`/api/auth/addresses/${encodeURIComponent(addressId)}`)).data;
  },
};

export const adminApi = {
  async stats() {
    return (await api.get('/api/admin/dashboard/stats')).data.stats;
  },
  async products(params) {
    return (await api.get('/api/admin/products', { params })).data;
  },
  async users(params) {
    return (await api.get('/api/admin/users', { params })).data;
  },
  async categories() {
    return (await api.get('/api/admin/categories')).data.categories;
  },
  async createProduct(product) {
    return (await api.post('/api/products', product)).data.product;
  },
  async updateProduct(id, product) {
    return (await api.patch(`/api/products/${encodeURIComponent(id)}`, product)).data.product;
  },
  async deactivateProduct(id) {
    return (await api.delete(`/api/products/${encodeURIComponent(id)}`)).data;
  },
};
