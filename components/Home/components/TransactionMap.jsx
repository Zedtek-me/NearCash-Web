// src/components/TransactionMap.js
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { fetchAndUpdateUserCurrentLocation, fetchUserLatestLocation, updateUserPosition } from '../../../utils/helpers';
import { useWebSocket } from '../../Notification/WebSocketProvider';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const clientIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/32/25/25694.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function TransactionMap({
  txnId,
  status,
  category,
  userType,
  clientLocation: initialClient,
  vendorLocation: initialVendor,
  userData
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [vendorLoc, setVendorLoc] = useState(initialVendor);
  const [clientLoc, setClientLoc] = useState(initialClient);
  const [isSocketReady, setIsSocketReady] = useState(false);

  const isPending = ['INITIATED', 'IN_PROGRESS'].includes(status);
  const isStoreWalking = category === 'STORE_WALKING';
  const movingRole = isStoreWalking ? 'CLIENT' : 'VENDOR';

    const baseURL = process.env.SOCKET_URL;
  const token = localStorage.getItem("nearcash_token");


  const websocketURL = `${baseURL}/notification/${userData.id}/?token=${token}`;

    const socket = new WebSocket(
      websocketURL
    );


  useEffect(() => {

  if (socket && socket.readyState === WebSocket.OPEN) {
    setIsSocketReady(true);
    console.log('errrrrr');
    
  } else if (socket) {
    const onOpen = () => setIsSocketReady(true);
    console.log('xxxxxxxxxxx');

    socket.addEventListener('open', onOpen);
    return () => socket.removeEventListener('open', onOpen);
  }
}, [socket]);

  useEffect(() => {
  if (!isPending || !txnId || !userData || !isSocketReady) return;

  console.log('errrrrryyyyyyyyyyy');
  

  fetchAndUpdateUserCurrentLocation(
    updateUserPosition,
    (err) => console.log("Location error:", err),
    userData,
    socket
  );

  fetchUserLatestLocation(userData, socket, txnId);

  const handleMessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log('evvvvvvvvvvvvvvv', e.location);
      
      if (data.message_type === 'vendor_location_update') {
        setVendorLoc(data.location);
      } else if (data.message_type === 'client_location_update') {
        setClientLoc(data.location);
      }
    } catch (err) {
      console.log("Invalid WS message");
    }
  };

  socket.addEventListener('message', handleMessage);

  return () => {
    socket.removeEventListener('message', handleMessage);
  };
}, [isPending, txnId, userData, isSocketReady]);

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

  const center = vendorLoc || clientLoc || { lat: 6.5244, lng: 3.3792 };

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-white font-bold text-lg">Live Tracking</h3>
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
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          {vendorLoc && (
            <Marker position={[vendorLoc.lat, vendorLoc.lng]} icon={icon}>
              <Popup>
                <b>Vendor</b>
                {movingRole === 'VENDOR' && <span> (Moving)</span>}
              </Popup>
            </Marker>
          )}

          {clientLoc && (
            <Marker position={[clientLoc.lat, clientLoc.lng]} icon={clientIcon}>
              <Popup>
                <b>Customer</b>
                {movingRole === 'CLIENT' && <span> (Walking)</span>}
              </Popup>
            </Marker>
          )}

          {vendorLoc && clientLoc && (
            <Polyline
              positions={[
                [vendorLoc.lat, vendorLoc.lng],
                [clientLoc.lat, clientLoc.lng]
              ]}
              color="#3B82F6"
              weight={5}
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* Floating Info */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 z-10">
          <div className="text-sm font-medium text-gray-800">
            {movingRole === 'VENDOR'
              ? 'Vendor is approaching...'
              : 'You are nearing the store'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Tap markers for details
          </div>
        </div>
      </div>
    </div>
  );
}