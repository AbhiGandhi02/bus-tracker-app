// Environment configuration
export const config = {
  MAPBOX_TOKEN: process.env.REACT_APP_MAPBOX_TOKEN || '',
  GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  // Map default settings
  MAP_DEFAULTS: {
    longitude: 12.8496, 
    latitude: 77.6649,   
    zoom: 11,
  }
} as const;

// Validation
if (!config.MAPBOX_TOKEN) {
  console.error('Warning: MAPBOX_TOKEN is not set in environment variables');
}

export default config;