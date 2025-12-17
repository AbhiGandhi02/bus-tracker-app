import React, { ReactNode } from 'react';
import { LoadScript } from '@react-google-maps/api';
import config from '../config';

interface GoogleMapsProviderProps {
    children: ReactNode;
}

const libraries = ['places'] as const;

/**
 * Lazy-loadable Google Maps provider.
 * Only use this in components that actually need Google Maps.
 */
const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
    return (
        <LoadScript
            googleMapsApiKey={config.GOOGLE_MAPS_API_KEY}
            libraries={libraries as any}
        >
            {children}
        </LoadScript>
    );
};

export default GoogleMapsProvider;
