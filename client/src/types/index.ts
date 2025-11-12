// src/types/index.ts

// ==========================================
// User Types (Firebase)
// ==========================================
export interface User {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt?: Date;
  lastLogin?: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

// ==========================================
// Bus Master Types (Static Bus Records)
// ==========================================
export interface BusMaster {
  _id: string;
  busNumber: string;
  busType: 'AC' | 'Non-AC' | 'Mini' | 'Deluxe';
  driverName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusMasterInput {
  busNumber: string;
  busType: 'AC' | 'Non-AC' | 'Mini' | 'Deluxe';
  driverName?: string;
}

// ==========================================
// Route Types (Simplified - No Stops)
// ==========================================
export interface Route {
  _id: string;
  routeNumber: string;
  routeName: string;
  departureLocation: string;
  arrivalLocation: string;
  rideTime: string; // e.g., "45 minutes"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteInput {
  routeNumber: string;
  routeName: string;
  departureLocation: string;
  arrivalLocation: string;
  rideTime: string;
}

// ==========================================
// Scheduled Ride Types (Daily Scheduling)
// ==========================================
export interface RideLocation {
  lat: number;
  lng: number;
  timestamp: Date | string;
}

export interface ScheduledRide {
  _id: string;
  busId: BusMaster | string;
  routeId: Route | string;
  date: Date | string;
  departureTime: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  currentLocation?: RideLocation;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledRideInput {
  busId: string;
  routeId: string;
  date: Date | string;
  departureTime: string;
  status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

// ==========================================
// API Response Types
// ==========================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}

// ==========================================
// Component Props Types
// ==========================================
export interface BusMasterManagementProps {
  buses: BusMaster[];
  onUpdate: () => void;
}

export interface RouteManagementProps {
  routes: Route[];
  onUpdate: () => void;
}

export interface ScheduleManagementProps {
  buses: BusMaster[];
  routes: Route[];
  scheduledRides: ScheduledRide[];
  onUpdate: () => void;
}

export interface RideListProps {
  rides: ScheduledRide[];
  selectedRide: string | null;
  onSelectRide: (rideId: string | null) => void;
}

export interface RideDetailsProps {
  ride: ScheduledRide | null;
}

export interface RideMapProps {
  rides: ScheduledRide[];
  selectedRide?: string | null;
}

// ==========================================
// Socket Event Types
// ==========================================
export interface RideLocationUpdate {
  rideId: string;
  busNumber: string;
  location: RideLocation;
}