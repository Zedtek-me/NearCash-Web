import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import {
  fetchAndUpdateUserCurrentLocation,
  fetchUserLatestLocation,
  updateUserPosition,
} from '../../../utils/helpers';
import { google_key } from '../../../configs/environs';
import { useWebSocket } from '../../Notification/WebSocketProvider';

const mapContainerStyle = { width: '100%', height: '100%' };

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  fullscreenControl: false,
};

// ── Custom SVG marker icons ───────────────────────────────────────────────────

const PIN_SVG = (color, innerSvg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58">
    <path d="M22 0C10 0 0 10 0 22c0 9 5 17 12 21.5L22 58l10-14.5C39 39 44 31 44 22 44 10 34 0 22 0z" fill="${color}"/>
    <circle cx="22" cy="22" r="15" fill="rgba(255,255,255,0.15)"/>
    ${innerSvg}
  </svg>`;

const PERSON_INNER =
  `<circle cx="22" cy="17" r="6.5" fill="white"/>
   <path d="M9 36c0-7.5 5.8-12 13-12s13 4.5 13 12" fill="white"/>`;

const STORE_INNER =
  `<rect x="13" y="25" width="18" height="12" rx="1" fill="white"/>
   <path d="M11 25l2.5-6.5h17l2.5 6.5z" fill="white"/>
   <rect x="19" y="29" width="6" height="8" rx="0.5" fill="${'#F59E0B'}"/>
   <rect x="14" y="27" width="4" height="4" rx="0.5" fill="${'#F59E0B'}"/>`;

const toIconUrl = (color, inner) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN_SVG(color, inner))}`;

const YOU_URL    = toIconUrl('#3B82F6', PERSON_INNER);   // blue  — current user
const CLIENT_URL = toIconUrl('#10B981', PERSON_INNER);   // green — client
const VENDOR_URL = toIconUrl('#F59E0B', STORE_INNER);    // amber — vendor/business

/** Builds a google.maps.Icon object (requires Maps SDK to be loaded). */
const buildIcon = (url) => ({
  url,
  scaledSize: new window.google.maps.Size(44, 58),
  anchor:     new window.google.maps.Point(22, 58),
});

// ─────────────────────────────────────────────────────────────────────────────

/** Normalises any location shape — {lat,lng} or {latitude,longitude} — to {lat, lng}. */
const toLatLng = (loc) => {
  if (!loc) return null;
  const lat = Number(loc.lat ?? loc.latitude);
  const lng = Number(loc.lng ?? loc.longitude);
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
};

export default function TransactionMap({
  txnId,
  status,
  collectionMode,
  clientLocation: initialClient,
  vendorLocation: initialVendor,
  userData,
  transaction,
}) {
  const socket            = useWebSocket();
  const [isOpen, setIsOpen]       = useState(true);
  const [vendorLoc, setVendorLoc] = useState(null);
  const [clientLoc, setClientLoc] = useState(null);
  const [directions, setDirections] = useState(null);
  const routeTimer = useRef(null);

  const isPending  = ['INITIATED', 'IN_PROGRESS'].includes(status);
  const isVendor   = userData?.userType === 'VENDOR';
  const business   = transaction?.business;

  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: google_key });

  // ── Seed own location from localStorage on mount ─────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('userLocation');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const loc = { latitude: Number(parsed.lat), longitude: Number(parsed.lng) };
      if (isVendor) setVendorLoc(loc);
      else setClientLoc(loc);
    } catch {}
  }, [isVendor]);

  // ── Live location streaming + WebSocket position updates ─────────────────
  useEffect(() => {
    if (!socket || socket.readyState !== 1 || !isPending || !txnId || !userData) return;

    fetchAndUpdateUserCurrentLocation(
      updateUserPosition,
      () => {},
      { ...userData, transaction },
      socket
    );

    fetchUserLatestLocation(
      userData, socket, txnId,
      transaction?.vendor?.id,
      transaction?.client?.id
    );

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.message_type) {
          case 'vendor_latest_location':
            if (data.location?.latitude && data.location?.longitude)
              setVendorLoc({ latitude: Number(data.location.latitude), longitude: Number(data.location.longitude) });
            break;
          case 'client_latest_location':
            if (data.location?.latitude && data.location?.longitude)
              setClientLoc({ latitude: Number(data.location.latitude), longitude: Number(data.location.longitude) });
            break;
          case 'vendor_location_update_ack':
          case 'client_location_update_ack':
            fetchUserLatestLocation(
              userData, socket, txnId,
              transaction?.vendor?.id, transaction?.client?.id
            );
            break;
        }
      } catch {}
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, isPending, txnId, userData, transaction?.vendor?.id]);

  // ── Derived map points ────────────────────────────────────────────────────
  const myLoc = toLatLng(isVendor ? vendorLoc : clientLoc);

  let otherRaw = isVendor ? clientLoc : vendorLoc;
  if (!isVendor && collectionMode === 'STORE_WALK_IN')
    otherRaw = business?.location || vendorLoc;
  const otherLoc = toLatLng(otherRaw);

  // ── Road-route fetch via Directions API ───────────────────────────────────
  // Debounced so rapid location updates don't flood the API.
  // Falls back to the straight Polyline if the request fails.
  useEffect(() => {
    if (!isLoaded || !myLoc || !otherLoc) return;
    if (!window.google?.maps) return;

    if (routeTimer.current) clearTimeout(routeTimer.current);

    routeTimer.current = setTimeout(() => {
      new window.google.maps.DirectionsService().route(
        {
          origin:      myLoc,
          destination: otherLoc,
          travelMode:  window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') setDirections(result);
          else setDirections(null); // triggers Polyline fallback
        }
      );
    }, 2000); // wait 2 s after last location change before calling the API

    return () => clearTimeout(routeTimer.current);
    // Primitive deps — only re-run when coords actually change, not on object re-creation
  }, [isLoaded, myLoc?.lat, myLoc?.lng, otherLoc?.lat, otherLoc?.lng]);

  // ── UI: collapsed state ───────────────────────────────────────────────────
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

  if (!myLoc) {
    return (
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        📍 Loading your location…
      </div>
    );
  }

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded)  return <div>Loading Google Maps…</div>;

  const otherTitle = isVendor ? 'Client' : 'Vendor';

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="h-96 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={myLoc}
          zoom={15}
          options={mapOptions}
        >
          {/* Current user pin — blue person icon; "You" shown on hover */}
          <Marker
            position={myLoc}
            icon={buildIcon(YOU_URL)}
            title="You"
          />

          {/* Other party pin — "Client" or "Vendor" shown on hover */}
          {otherLoc && (
            <Marker
              position={otherLoc}
              icon={buildIcon(isVendor ? CLIENT_URL : VENDOR_URL)}
              title={otherTitle}
            />
          )}

          {/*
           * Road route — rendered when the Directions API returns a result.
           * suppressMarkers keeps our custom "You" / "Client/Vendor" pins
           * instead of the default A/B markers.
           */}
          {directions && otherLoc && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor:   '#3B82F6',
                  strokeWeight:  5,
                  strokeOpacity: 0.85,
                },
              }}
            />
          )}

          {/* Straight-line fallback — only when route hasn't loaded yet */}
          {!directions && otherLoc && (
            <Polyline
              path={[myLoc, otherLoc]}
              options={{
                strokeColor:   '#3B82F6',
                strokeWeight:  4,
                strokeOpacity: 0.6,
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
