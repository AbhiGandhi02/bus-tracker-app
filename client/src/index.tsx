import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LoadScript } from '@react-google-maps/api';
import config from './config';
import './index.css';

// We must specify "places" to enable the Autocomplete feature
const libraries = ['places'];

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadScript
      googleMapsApiKey={config.GOOGLE_MAPS_API_KEY}
      libraries={libraries as any} 
    >
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </LoadScript>
  </React.StrictMode>
);