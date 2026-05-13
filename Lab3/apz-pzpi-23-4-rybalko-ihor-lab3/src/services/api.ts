import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse, User, Restaurant, Category, Dish, Order } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5082/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthService = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: { fullName: string; email: string; phone: string; password: string }) =>
    api.post('/auth/register', data),

  getProfile: () =>
    api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export const AdminService = {
  getUsers: () =>
    api.get<User[]>('/admin/users'),
  blockUser: (userId: number, reason: string) =>
    api.post('/admin/block', { userId, reason }),

  unblockUser: (userId: number) =>
    api.post(`/admin/unblock/${userId}`),

  changeRole: (userId: number, newRole: string) =>
    api.put('/admin/users/role', { userId, newRole }),

  getLogs: () =>
    api.get('/admin/logs'),

  toggleRestaurantStatus: (id: number, isActive: boolean) =>
    api.patch(`/admin/restaurants/${id}/status?isActive=${isActive}`),
};
export const RestaurantService = {
  getAll: (userLat?: number, userLon?: number) => {
    const params: Record<string, number> = {};
    if (userLat !== undefined) params.userLat = userLat;
    if (userLon !== undefined) params.userLon = userLon;
    return api.get<Restaurant[]>('/restaurants', { params });
  },
  getById: (id: number) =>
    api.get<Restaurant>(`/restaurants/${id}`),
  create: (data: { nameUA: string; nameEN: string; address: string; latitude: number; longitude: number; ownerId?: number }) =>
    api.post<Restaurant>('/restaurants', data),

  delete: (id: number) =>
    api.delete(`/restaurants/${id}`),
};
export const CategoryService = {
  getByRestaurant: (restaurantId: number) =>
    api.get<Category[]>('/categories', { params: { restaurantId } }),

  create: (data: { nameUA: string; nameEN: string; restaurantId: number }) =>
    api.post<Category>('/categories', data),

  delete: (id: number) =>
    api.delete(`/categories/${id}`),
};
export const DishService = {
  getAll: (categoryId?: number) =>
    api.get<Dish[]>('/dishes', { params: categoryId ? { categoryId } : {} }),
  getById: (id: number) =>
    api.get<Dish>(`/dishes/${id}`),

  create: (data: FormData) =>
    api.post<Dish>('/dishes', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  delete: (id: number) =>
    api.delete(`/dishes/${id}`),
};

// C# enum OrderStatus: Pending=0, Paid=1, Cooking=2, Ready=3, Completed=4, Cancelled=5
const ORDER_STATUS_MAP: Record<string, number> = {
  Pending: 0,
  Paid: 1,
  Cooking: 2,
  Ready: 3,
  Completed: 4,
  Cancelled: 5,
};

export const OrderService = {
  getAll: () =>
    api.get<Order[]>('/orders'),

  getById: (id: number) =>
    api.get<Order>(`/orders/${id}`),
  create: (data: { restaurantId: number; visitTime: string; items: { dishId: number; quantity: number }[]; comment?: string }) =>
    api.post<Order>('/orders', data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status`, { status: ORDER_STATUS_MAP[status] ?? 0 }),
  pay: (id: number) =>
    api.post(`/orders/${id}/pay`),
};

export const StatsService = {
  getSalesStats: (restaurantId: number) =>
    api.get(`/statistics/sales?restaurantId=${restaurantId}`),
};
