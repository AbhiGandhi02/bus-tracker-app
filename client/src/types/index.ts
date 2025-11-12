// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
}

// Bus Types
export interface BusLocation {
  lat: number;
  lng: number;
  timestamp: Date | string;
}

export interface Bus {
  _id: string;
  busNumber: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  location: BusLocation;
  routeId?: Route | string | {
    _id: string;
    routeName: string;
    routeNumber: string;
    stops?: Stop[];
  };
  driverName?: string;
  driverPhone?: string;
  capacity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Bus Input for create/update
export interface BusInput {
  busNumber: string;
  routeId: string;
  driverName?: string;
  driverPhone?: string;
  capacity?: number;
  status: 'Active' | 'Inactive' | 'Maintenance';
}

// Route Types
export interface Stop {
  name: string;
  lat: number;
  lng: number;
  arrivalTime: string;
  order: number;
  _id?: string;
}

export interface Route {
  _id: string;
  routeName: string;
  routeNumber: string;
  startTime: string;
  endTime: string;
  stops: Stop[];
  isActive?: boolean;
  createdAt?: Date;
}

// Route Input for create/update
export interface RouteInput {
  routeName: string;
  routeNumber: string;
  startTime: string;
  endTime: string;
  stops: Stop[];
  isActive?: boolean;
}

// Component Props Types
export interface BusListProps {
  buses: Bus[];
  selectedBus: string | null;
  onSelectBus: (busId: string) => void;
}

export interface BusMapProps {
  buses: Bus[];
  selectedBus?: string | null;
}

export interface BusDetailsProps {
  bus: Bus | null;
}

export interface BusManagementProps {
  buses: Bus[];
  routes: Route[];
  onUpdate: () => void;
}

export interface RouteManagementProps {
  routes: Route[];
  onUpdate: () => void;
}