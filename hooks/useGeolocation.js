import { useState, useEffect } from "react";

const LOCATION_KEY = "userLocation";

const useGeolocation = () => {
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCATION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    const getLocation = (highAccuracy = false) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(location);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
        },
        (err) => {
          if (err.code === 2) {
            setTimeout(() => getLocation(highAccuracy), 2000);
          }
        },
        { enableHighAccuracy: highAccuracy, timeout: 200000, maximumAge: 5000 }
      );
    };

    getLocation(false);
  }, []);

  const requestLocationPermission = (onSuccess) => {
    if (!navigator.geolocation) return;

    setIsLoadingLocation(true);

    const saveAndNotify = (position) => {
      const location = { lat: position.coords.latitude, lng: position.coords.longitude };
      setUserLocation(location);
      localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
      setIsLoadingLocation(false);
      onSuccess?.(location);
    };

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        saveAndNotify,
        () => setIsLoadingLocation(false),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      saveAndNotify,
      () => tryLowAccuracy(),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return { userLocation, isLoadingLocation, requestLocationPermission };
};

export default useGeolocation;
