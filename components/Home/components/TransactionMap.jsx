import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
import { MapPin, X } from 'lucide-react';
import { fetchAndUpdateUserCurrentLocation, fetchUserLatestLocation, updateUserPosition } from '../../../utils/helpers';
import { google_key } from '../../../configs/environs';
import { useWebSocket } from '../../Notification/WebSocketProvider';

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
  clientLocation: initialClient,
  vendorLocation: initialVendor,
  userData,
  transaction
}) {
  const socket = useWebSocket();               
  const [isOpen, setIsOpen] = useState(true);
  const [vendorLoc, setVendorLoc] = useState(initialVendor);
  const [clientLoc, setClientLoc] = useState(initialClient);

  const isPending = ['INITIATED', 'IN_PROGRESS'].includes(status);
  const isVendor = userData?.userType === 'VENDOR';
  const movingRole = category === 'STORE_WALKING' ? 'CLIENT' : 'VENDOR';

  /** Google Maps Loader */
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: google_key,
  });

  /** Initialize user’s own location from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("userLocation");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const loc = {
        latitude: Number(parsed.lat),
        longitude: Number(parsed.lng)
      };

      if (isVendor) setVendorLoc(loc);
      else setClientLoc(loc);

    } catch (e) {
      console.error("Invalid stored location:", e);
    }
  }, [isVendor]);

  /**
   * 🔄 Handle all WebSocket updates from the provider
   */
  useEffect(() => {
    if (!socket || socket.readyState !== 1) return;
    if (!isPending || !txnId || !userData) return;

    console.log("📡 Socket ready — enabling live map tracking...");

    // Start sending current user location every X seconds
    fetchAndUpdateUserCurrentLocation(
      updateUserPosition,
      (err) => console.error("Location error:", err),
      userData,
      socket
    );

    // Handle incoming messages
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.message_type) {
          case "vendor_latest_location":
            if (!isVendor && data.location) {
              setVendorLoc({
                latitude: Number(data.location.latitude),
                longitude: Number(data.location.longitude)
              });
            }
            break;

          case "client_latest_location":
            if (isVendor && data.location) {
              setClientLoc({
                latitude: Number(data.location.latitude),
                longitude: Number(data.location.longitude)
              });
            }
            break;

          case "vendor_location_update_ack":
          case "client_location_update_ack":
            fetchUserLatestLocation(
              userData,
              socket,
              txnId,
              transaction?.vendor?.id
            );
            break;
        }

      } catch (err) {
        console.error("Invalid WebSocket message:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);

  }, [socket, isPending, txnId, userData, isVendor, transaction?.vendor?.id]);

  /** UI Conditions */
  if (!isOpen || !isPending) {
    return (
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <button
          onClick={() => setIsOpen(true)}
          className="text-blue-600 font-medium hover:underline flex items-center gap-2"
        >
          <MapPin className="w-5 h-5" /> Show Live Map
        </button>
      </div>
    );
  }

  /** Determine Map Centers */
  const centerLocation = isVendor ? vendorLoc : clientLoc;
  //const otherPartyLocation = isVendor ? clientLoc : vendorLoc;
  const otherPartyLocation = {latitude: '7.40', longitude: '4.30'}

  if (!centerLocation) {
    return (
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        📍 Loading your location...
      </div>
    );
  }

  const center = {
    lat: Number(centerLocation.latitude),
    lng: Number(centerLocation.longitude)
  };

  /** Google Maps Loading UI */
  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="h-96 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={mapOptions}
        >
          {/* Current user marker */}
          <Marker
            position={center}
            label={{
              text: isVendor ? "V" : "C",
              color: "white",
              fontWeight: "bold"
            }}
          />

          {/* Other party marker */}
          {otherPartyLocation && (
            <Marker
              position={{
                lat: Number(otherPartyLocation.latitude),
                lng: Number(otherPartyLocation.longitude)
              }}
              label={{
                text: isVendor ? "C" : "V",
                color: "white",
                fontWeight: "bold"
              }}
            />
          )}

          {/* Route line */}
          {otherPartyLocation && (
            <Polyline
              path={[
                center,
                {
                  lat: Number(otherPartyLocation.latitude),
                  lng: Number(otherPartyLocation.longitude)
                }
              ]}
              options={{
                strokeColor: "#3B82F6",
                strokeWeight: 4
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
