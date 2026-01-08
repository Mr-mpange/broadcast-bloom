import { useState, useEffect } from 'react';

interface GeolocationData {
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationData>({
    country: null,
    city: null,
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const getLocation = async () => {
      try {
        // First try to get user's permission for location
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              try {
                // Use a free IP geolocation service to get country
                const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=free&lat=${latitude}&long=${longitude}`);
                const data = await response.json();
                
                setLocation({
                  country: data.country_name || 'Unknown',
                  city: data.city || 'Unknown',
                  latitude,
                  longitude,
                  loading: false,
                  error: null,
                });
              } catch (apiError) {
                // Fallback to IP-based location
                await getLocationByIP();
              }
            },
            async (error) => {
              console.log('Geolocation denied, using IP-based location');
              await getLocationByIP();
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            }
          );
        } else {
          await getLocationByIP();
        }
      } catch (error) {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to get location',
        }));
      }
    };

    const getLocationByIP = async () => {
      try {
        // Free IP geolocation service
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        setLocation({
          country: data.country_name || 'Unknown',
          city: data.city || 'Unknown',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          loading: false,
          error: null,
        });
      } catch (error) {
        // Final fallback
        setLocation({
          country: 'Unknown',
          city: 'Unknown',
          latitude: null,
          longitude: null,
          loading: false,
          error: 'Could not determine location',
        });
      }
    };

    getLocation();
  }, []);

  return location;
};