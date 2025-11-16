import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { MapPin, X } from 'lucide-react';
import { fetchAndUpdateUserCurrentLocation, fetchUserLatestLocation, updateUserPosition } from '../../../utils/helpers';
import { google_key } from '../../../configs/environs';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

export default function TransactionMap({
  txnId,
  status,
  category,
  userType,
  clientLocation: initialClient,
  vendorLocation: initialVendor,
  userData,
  transaction
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [vendorLoc, setVendorLoc] = useState(null);
  const [clientLoc, setClientLoc] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentUserLoc, setCurrentUserLoc] = useState(null);

  const isPending = ['INITIATED', 'IN_PROGRESS'].includes(status);
  const isStoreWalking = category === 'STORE_WALKING';
  const movingRole = isStoreWalking ? 'CLIENT' : 'VENDOR';
  const isVendor = userData?.userType === 'VENDOR';

  const baseURL = process.env.SOCKET_URL;
  const token = localStorage.getItem("nearcash_token");
  const websocketURL = `${baseURL}/notification/${userData.id}/?token=${token}`;

  useEffect(() => {
    const locationStr = localStorage.getItem("userLocation");
    if (locationStr) {
      try {
        const location = JSON.parse(locationStr);
        const userLocation = {
          latitude: location.lat,
          longitude: location.lng
        };
        setCurrentUserLoc(userLocation);
        
        if (isVendor) {
          setVendorLoc(userLocation);
        } else {
          setClientLoc(userLocation);
        }
      } catch (err) {
        console.error('Error parsing location from localStorage:', err);
      }
    }
  }, [isVendor]);

  useEffect(() => {
    if (!userData?.id || !token) return;

    const ws = new WebSocket(websocketURL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsSocketReady(true);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsSocketReady(false);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userData?.id, token, websocketURL]);

  useEffect(() => {
    if (!isPending || !txnId || !userData || !isSocketReady || !socket) return;

    console.log('Setting up location tracking...');

    fetchAndUpdateUserCurrentLocation(
      updateUserPosition,
      (err) => console.error("Location error:", err),
      userData,
      socket
    );

    const handleMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('WebSocket message received:', data);

        if (data.message_type === 'vendor_latest_location') {
          if (data.location) {
            setVendorLoc({
              latitude: data.location.latitude,
              longitude: data.location.longitude
            });
          }
        } else if (data.message_type === 'client_latest_location') {
          if (data.location) {
            setClientLoc({
              latitude: data.location.latitude,
              longitude: data.location.longitude
            });
          }
        } else if (
          data.message_type === 'vendor_location_update_ack' || 
          data.message_type === 'client_location_update_ack'
        ) {
          fetchUserLatestLocation(userData, socket, txnId, transaction?.vendor?.id);
        }
      } catch (err) {
        console.error("Invalid WebSocket message:", err);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [isPending, txnId, userData, isSocketReady, socket, transaction?.vendor?.id]);

  if (!isOpen || !isPending) {
    return (
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <button
          onClick={() => setIsOpen(true)}
          className="text-blue-600 font-medium hover:underline flex items-center gap-2"
        >
          <MapPin className="w-5 h-5" />
          Show Live Map
        </button>
      </div>
    );
  }

  // Determine which location to center the map on
  // Vendor sees their own location (from localStorage), Client sees their own location
  const centerLocation = isVendor 
    ? (vendorLoc || currentUserLoc)
    : (clientLoc || currentUserLoc);

  // Get the other party's location for display
  const otherPartyLocation = isVendor ? clientLoc : vendorLoc;

  if (!centerLocation) {
    return (
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800">Loading location data...</p>
      </div>
    );
  }

  const center = {
    lat: centerLocation.latitude,
    lng: centerLocation.longitude
  };

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-white font-bold text-lg">Live map</h3>
            <p className="text-blue-100 text-sm">
              {movingRole === 'VENDOR'
                ? 'Vendor is on the way'
                : 'You are walking to store'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 p-2 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Map */}
      <div className="h-96 relative">
        <LoadScript googleMapsApiKey={google_key}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            options={mapOptions}
          >
            {/* Current User Marker (Vendor or Client based on userType) */}
            {centerLocation && (
              <Marker
                position={{
                  lat: centerLocation.latitude,
                  lng: centerLocation.longitude
                }}
                label={{
                  text: isVendor ? 'V' : 'C',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                icon={{
                  url: isVendor 
                    ? 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
                    : 'https://cdn-icons-png.flaticon.com/32/25/25694.png',
                  scaledSize: new window.google.maps.Size(32, 41)
                }}
                title={isVendor ? 'Your Location (Vendor)' : 'Your Location (Client)'}
              />
            )}

            {/* Other Party Marker */}
            {otherPartyLocation && (
              <Marker
                position={{
                  lat: otherPartyLocation.latitude,
                  lng: otherPartyLocation.longitude
                }}
                label={{
                  text: isVendor ? 'C' : 'V',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                icon={{
                  url: isVendor
                    ? 'https://cdn-icons-png.flaticon.com/32/25/25694.png'
                    : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                  scaledSize: new window.google.maps.Size(32, 41)
                }}
                title={isVendor ? 'Client Location' : 'Vendor Location'}
              />
            )}

            {/* Polyline connecting both locations */}
            {centerLocation && otherPartyLocation && (
              <Polyline
                path={[
                  {
                    lat: centerLocation.latitude,
                    lng: centerLocation.longitude
                  },
                  {
                    lat: otherPartyLocation.latitude,
                    lng: otherPartyLocation.longitude
                  }
                ]}
                options={{
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.8,
                  strokeWeight: 5,
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>

        {/* Floating Info */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 z-10">
          <div className="text-sm font-medium text-gray-800">
            {movingRole === 'VENDOR'
              ? isVendor 
                ? 'You are approaching the client...'
                : 'Vendor is approaching...'
              : isVendor
                ? 'Client is nearing your store'
                : 'You are nearing the store'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {otherPartyLocation 
              ? 'Tap markers for details' 
              : 'Waiting for other party location...'}
          </div>
        </div>
      </div>
    </div>
  );
}