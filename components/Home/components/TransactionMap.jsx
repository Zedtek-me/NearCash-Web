import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
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

  const isPending = ['INITIATED', 'IN_PROGRESS'].includes(status);
  const isStoreWalking = category === 'STORE_WALKING';
  const movingRole = isStoreWalking ? 'CLIENT' : 'VENDOR';
  const isVendor = userData?.userType === 'VENDOR';

  const baseURL = process.env.SOCKET_URL;
  const token = localStorage.getItem("nearcash_token");
  const websocketURL = `${baseURL}/notification/${userData.id}/?token=${token}`;

  // Use useLoadScript hook instead of LoadScript component
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: google_key,
  });

  console.log('🗺️ Google Maps Load Status:', { isLoaded, loadError, hasKey: !!google_key });

  // Initialize current user's location from localStorage
  useEffect(() => {
    const locationStr = localStorage.getItem("userLocation");
    console.log('Raw localStorage location:', locationStr);
    
    if (locationStr) {
      try {
        const location = JSON.parse(locationStr);
        console.log('Parsed location:', location);
        
        const userLocation = {
          latitude: Number(location.lat),
          longitude: Number(location.lng)
        };
        
        console.log('Setting user location:', userLocation, 'isVendor:', isVendor);
        
        if (isVendor) {
          setVendorLoc(userLocation);
        } else {
          setClientLoc(userLocation);
        }
      } catch (err) {
        console.error('Error parsing location from localStorage:', err);
      }
    } else {
      console.warn('No userLocation found in localStorage');
    }
  }, [isVendor]);

  // Initialize WebSocket
  useEffect(() => {
    if (!userData?.id || !token) {
      console.warn('Missing userData.id or token');
      return;
    }

    console.log('Connecting to WebSocket:', websocketURL);
    const ws = new WebSocket(websocketURL);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsSocketReady(true);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsSocketReady(false);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userData?.id, token, websocketURL]);

  // Handle location updates via WebSocket
  useEffect(() => {
    if (!isPending || !txnId || !userData || !isSocketReady || !socket) {
      console.log('Skipping location tracking setup:', {
        isPending,
        hasTxnId: !!txnId,
        hasUserData: !!userData,
        isSocketReady,
        hasSocket: !!socket
      });
      return;
    }

    console.log('📍 Setting up location tracking...');

    fetchAndUpdateUserCurrentLocation(
      updateUserPosition,
      (err) => console.error("Location error:", err),
      userData,
      socket
    );

    const handleMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('📨 WebSocket message:', data.message_type, data);

        if (data.message_type === 'vendor_latest_location') {
          if (!isVendor && data.location) {
            const loc = {
              latitude: Number(data.location.latitude),
              longitude: Number(data.location.longitude)
            };
            console.log('🔴 Updating VENDOR location (client view):', loc);
            setVendorLoc(loc);
          }
        } else if (data.message_type === 'client_latest_location') {
          if (isVendor && data.location) {
            const loc = {
              latitude: Number(data.location.latitude),
              longitude: Number(data.location.longitude)
            };
            console.log('🔵 Updating CLIENT location (vendor view):', loc);
            setClientLoc(loc);
          }
        } else if (
          data.message_type === 'vendor_location_update_ack' || 
          data.message_type === 'client_location_update_ack'
        ) {
          console.log('✅ Location update acknowledged, fetching latest...');
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
  }, [isPending, txnId, userData, isSocketReady, socket, transaction?.vendor?.id, isVendor]);

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

  const centerLocation = isVendor ? vendorLoc : clientLoc;
  const otherPartyLocation = isVendor ? clientLoc : vendorLoc;
  //const otherPartyLocation = {latitude: '7.40', longitude: '4.30'}

  console.log('🗺️ Map state:', {
    isVendor,
    centerLocation,
    otherPartyLocation,
    vendorLoc,
    clientLoc
  });

  if (!centerLocation) {
    return (
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800">📍 Loading your location...</p>
        <p className="text-xs text-yellow-600 mt-1">
          Make sure location is enabled and saved in localStorage
        </p>
      </div>
    );
  }

  const center = {
    lat: Number(centerLocation.latitude),
    lng: Number(centerLocation.longitude)
  };

  // Handle Google Maps loading states
  if (loadError) {
    return (
      <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-white font-bold text-lg">Live Tracking</h3>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-96 flex items-center justify-center bg-red-50">
          <div className="text-center p-6 max-w-md">
            <p className="text-red-600 font-bold text-lg mb-3">⚠️ Map Loading Failed</p>
            <p className="text-red-700 text-sm mb-4">
              Error: {loadError.message || 'Unknown error'}
            </p>
            <p className="text-sm text-red-600 mb-4">Common issues:</p>
            <ul className="text-left text-sm text-red-600 mb-4 space-y-1">
              <li>• Check API key restrictions</li>
              <li>• Verify billing is enabled</li>
              <li>• Ensure Maps JavaScript API is activated</li>
            </ul>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-white font-bold text-lg">Live Tracking</h3>
              <p className="text-blue-100 text-sm">
                {movingRole === 'VENDOR' ? 'Vendor is on the way' : 'You are walking to store'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-96 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading Google Maps...</p>
            <p className="text-gray-400 text-sm mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-white font-bold text-lg">Live Tracking</h3>
            <p className="text-blue-100 text-sm">
              {movingRole === 'VENDOR' ? 'Vendor is on the way' : 'You are walking to store'}
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
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={mapOptions}
          onLoad={(map) => {
            console.log('🗺️ Map instance loaded successfully!');
          }}
        >
          {/* Current User Marker */}
          {centerLocation && (
            <Marker
              position={{
                lat: Number(centerLocation.latitude),
                lng: Number(centerLocation.longitude)
              }}
              label={{
                text: isVendor ? 'V' : 'C',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
              icon={{
                url: isVendor 
                  ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
              title={isVendor ? 'Your Location (Vendor)' : 'Your Location (Client)'}
            />
          )}

          {/* Other Party Marker */}
          {otherPartyLocation && otherPartyLocation.latitude && otherPartyLocation.longitude && (
            <Marker
              position={{
                lat: Number(otherPartyLocation.latitude),
                lng: Number(otherPartyLocation.longitude)
              }}
              label={{
                text: isVendor ? 'C' : 'V',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
              icon={{
                url: isVendor
                  ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
              title={isVendor ? 'Client Location' : 'Vendor Location'}
            />
          )}

          {/* Polyline connecting both locations */}
          {centerLocation && otherPartyLocation && otherPartyLocation.latitude && otherPartyLocation.longitude && (
            <Polyline
              path={[
                {
                  lat: Number(centerLocation.latitude),
                  lng: Number(centerLocation.longitude)
                },
                {
                  lat: Number(otherPartyLocation.latitude),
                  lng: Number(otherPartyLocation.longitude)
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

        {/* Floating Info */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 z-10 max-w-xs">
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
              ? `🔴 Red: Vendor • 🔵 Blue: Client` 
              : '⏳ Waiting for other party location...'}
          </div>
          {!otherPartyLocation && (
            <div className="text-xs text-orange-600 mt-1">
              The {isVendor ? 'client' : 'vendor'} hasn't shared their location yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}