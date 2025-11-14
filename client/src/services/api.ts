import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { 
  BusMaster, Route, ScheduledRide,
  BusMasterInput, RouteInput, ScheduledRideInput,
  RideLocation, ApiResponse, User 
} from '../types';
import { auth } from '../config/firebase';
import config from '../config'; // Import config for API_URL

const api: AxiosInstance = axios.create({
  baseURL: config.API_URL, // Use API_URL from config
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add Firebase token to requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
         // Force refresh token if it's about to expire
        const token = await currentUser.getIdToken(false);
        if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error getting token", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call. Token might be expired or invalid.");
      // We don't redirect here, we let ProtectedRoute handle it.
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getMe: () => api.get<ApiResponse<{user: User}>>('/auth/me'),
  setAdmin: (email: string) => api.post<ApiResponse<any>>('/auth/set-admin', { email })
};

// Bus Master API
export const busMasterAPI = {
  getAll: () => api.get<ApiResponse<BusMaster[]>>('/bus-master'),
  create: (data: BusMasterInput) => api.post<ApiResponse<BusMaster>>('/bus-master', data),
  update: (id: string, data: Partial<BusMasterInput>) => api.put<ApiResponse<BusMaster>>(`/bus-master/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/bus-master/${id}`)
};

// Route API (Simplified)
export const routeAPI = {
  getAll: () => api.get<ApiResponse<Route[]>>('/routes'),
  create: (data: RouteInput) => api.post<ApiResponse<Route>>('/routes', data),
  update: (id: string, data: Partial<RouteInput>) => api.put<ApiResponse<Route>>(`/routes/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/routes/${id}`)
};

// Scheduled Ride API
export const scheduledRideAPI = {
  getByDate: (date?: string) => api.get<ApiResponse<ScheduledRide[]>>('/scheduled-rides', { params: { date } }),
  create: (data: ScheduledRideInput) => api.post<ApiResponse<ScheduledRide>>('/scheduled-rides', data),
  update: (id: string, data: Partial<ScheduledRideInput>) => api.put<ApiResponse<ScheduledRide>>(`/scheduled-rides/${id}`, data),
  updateLocation: (id: string, location: RideLocation) => api.post<ApiResponse<ScheduledRide>>(`/scheduled-rides/${id}/location`, location),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/scheduled-rides/${id}`)
};

// User Management API ---
export const userAPI = {
  getAll: () => api.get<ApiResponse<User[]>>('/users'),
  updateRole: (id: string, role: 'user' | 'admin' | 'driver') => 
    api.put<ApiResponse<User>>(`/users/${id}/role`, { role })
};

export default api;