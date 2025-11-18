// GPS Simulator for Bus Tracking System
// This simulates a bus moving along a route

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Configuration
const BUS_ID = 'BUS_ID_HERE'; // Replace with actual bus ID from database
const UPDATE_INTERVAL = 5000; // Update every 5 seconds

// Sample route coordinates (Bangalore area)
const route = [
  { lat: 12.9716, lng: 77.5946 },
  { lat: 12.9750, lng: 77.5980 },
  { lat: 12.9780, lng: 77.6020 },
  { lat: 12.9820, lng: 77.6050 },
  { lat: 12.9860, lng: 77.6080 },
  { lat: 12.9900, lng: 77.6110 },
  { lat: 12.9940, lng: 77.6140 },
  { lat: 12.9980, lng: 77.6170 },
  { lat: 13.0020, lng: 77.6200 }
];

let currentIndex = 0;

async function updateBusLocation() {
  try {
    const location = route[currentIndex];
    
    console.log(`📍 Updating location: Lat ${location.lat}, Lng ${location.lng}`);
    
    const response = await axios.post(
      `${API_URL}/buses/${BUS_ID}/location`,
      location
    );

    if (response.data.success) {
      console.log('✅ Location updated successfully');
    }

    // Move to next point in route
    currentIndex = (currentIndex + 1) % route.length;
    
  } catch (error) {
    console.error('❌ Error updating location:', error.message);
  }
}

// Start simulator
console.log('🚌 GPS Simulator Started');
console.log(`Bus ID: ${BUS_ID}`);
console.log(`Update Interval: ${UPDATE_INTERVAL}ms`);
console.log('Press Ctrl+C to stop\n');

// Update immediately, then at intervals
updateBusLocation();
setInterval(updateBusLocation, UPDATE_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Simulator stopped');
  process.exit(0);
});