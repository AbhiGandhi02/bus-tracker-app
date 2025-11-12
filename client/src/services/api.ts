import axios, { AxiosInstance } from 'axios';
import { 
  Bus, Route, LoginCredentials, SignupData, User, 
  BusLocation, BusInput, RouteInput 
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Response Types matching backend structure
interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

interface UserResponse {
  success: boolean;
  user: User;
}

interface BusesResponse {
  success: boolean;
  count: number;
  data: Bus[];
}

interface BusResponse {
  success: boolean;
  data: Bus;
}

interface RoutesResponse {
  success: boolean;
  count: number;
  data: Route[];
}

interface RouteResponse {
  success: boolean;
  data: Route;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// Auth API
export const authAPI = {
  signup: (data: SignupData) => api.post<AuthResponse>('/auth/signup', data),
  login: (data: LoginCredentials) => api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<UserResponse>('/auth/me')
};

// Bus API
export const busAPI = {
  getAll: () => api.get<BusesResponse>('/buses'),
  getOne: (id: string) => api.get<BusResponse>(`/buses/${id}`),
  create: (data: BusInput) => api.post<BusResponse>('/buses', data),
  update: (id: string, data: Partial<BusInput>) => api.put<BusResponse>(`/buses/${id}`, data),
  delete: (id: string) => api.delete<DeleteResponse>(`/buses/${id}`),
  updateLocation: (id: string, location: BusLocation) => api.post<BusResponse>(`/buses/${id}/location`, location)
};

// Route API
export const routeAPI = {
  getAll: () => api.get<RoutesResponse>('/routes'),
  getOne: (id: string) => api.get<RouteResponse>(`/routes/${id}`),
  create: (data: RouteInput) => api.post<RouteResponse>('/routes', data),
  update: (id: string, data: Partial<RouteInput>) => api.put<RouteResponse>(`/routes/${id}`, data),
  delete: (id: string) => api.delete<DeleteResponse>(`/routes/${id}`)
};

export default api;