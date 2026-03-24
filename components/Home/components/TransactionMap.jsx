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
const NIGERIA_CENTER    = { lat: 9.082, lng: 8.6753 };

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

/**
 * Haversine straight-line distance in km between two {lat,lng} points.
 * Used as fallback ETA when the Directions API hasn't responded yet.
 */
const haversineKm = (a, b) => {
  const R  = 6371;
  const dL = ((b.lat - a.lat) * Math.PI) / 180;
  const dG = ((b.lng - a.lng) * Math.PI) / 180;
  const h  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

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
  const mapRef     = useRef(null);
  const didInitialPan = useRef(false);

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


  useEffect(() => {
    if (initialVendor) setVendorLoc(initialVendor);
  }, [initialVendor?.lat, initialVendor?.lng]);

  useEffect(() => {
    if (initialClient) setClientLoc(initialClient);
  }, [initialClient?.lat, initialClient?.lng]);

  useEffect(() => {
    if (!socket || !isPending || !txnId || !userData) return;

    const doFetchLocations = () => fetchUserLatestLocation(
      userData, socket, txnId,
      transaction?.vendor?.id,
      transaction?.client?.id
    );

    const cleanupWatch = fetchAndUpdateUserCurrentLocation(
      updateUserPosition,
      () => {},
      { ...userData, transaction },
      socket
    );

    // Initial fetch — fetchUserLatestLocation handles CONNECTING internally
    doFetchLocations();

    // Re-fetch immediately if socket was still connecting when this ran
    socket.addEventListener('open', doFetchLocations);

    // Periodic fallback — every 10 s in case ack-based updates stall
    const pollInterval = setInterval(doFetchLocations, 10000);

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
            doFetchLocations();
            break;
        }
      } catch {}
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('open', doFetchLocations);
      clearInterval(pollInterval);
      cleanupWatch?.();
    };
  }, [socket, isPending, txnId, userData, transaction?.vendor?.id]);

  const myLoc = toLatLng(isVendor ? vendorLoc : clientLoc);

  useEffect(() => {
    if (!myLoc || !mapRef.current || didInitialPan.current) return;
    mapRef.current.panTo(myLoc);
    mapRef.current.setZoom(15);
    didInitialPan.current = true;
  }, [myLoc?.lat, myLoc?.lng]);

  const focusOn = (loc) => {
    if (!loc || !mapRef.current) return;
    mapRef.current.panTo(loc);
    mapRef.current.setZoom(16);
  };

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
          center={NIGERIA_CENTER}
          zoom={6}
          options={mapOptions}
          onLoad={(map) => {
            mapRef.current = map;
            // myLoc may have already resolved before the map instance was ready
            // (localStorage seeding races ahead of SDK load). Pan here as a catch-all.
            if (myLoc && !didInitialPan.current) {
              map.panTo(myLoc);
              map.setZoom(15);
              didInitialPan.current = true;
            }
          }}
        >

          {/* ── Focus buttons overlay ── */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {myLoc && (
              <button
                onClick={() => focusOn(myLoc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
                style={{ background: '#3B82F6', color: '#fff' }}
              >
                <MapPin size={12} />
                You
              </button>
            )}
            {otherLoc && (
              <button
                onClick={() => focusOn(otherLoc)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
                style={{ background: isVendor ? '#10B981' : '#F59E0B', color: '#fff' }}
              >
                <MapPin size={12} />
                {otherTitle}
              </button>
            )}
          </div>
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

      {/* ── ETA strip ── */}
      {otherLoc && (() => {
        // Prefer Directions API duration; fall back to Haversine ÷ 30 km/h
        const leg      = directions?.routes?.[0]?.legs?.[0];
        const etaText  = leg?.duration?.text ?? null;
        const distText = leg?.distance?.text  ?? null;
        const fallbackEta = !etaText
          ? Math.round((haversineKm(myLoc, otherLoc) / 30) * 60)
          : null;

        // Label: MEET_UP — the other party is coming to you (client perspective)
        //                   or you're going to the client (vendor perspective)
        // STORE_WALK_IN  — client walks to vendor store
        const etaLabel = collectionMode === 'STORE_WALK_IN'
          ? isVendor ? `${otherTitle} ETA` : 'Your ETA to the vendor'
          : isVendor ? `${otherTitle} ETA` : 'Your ETA to the vendor';

        return (
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-600">
            <span className="font-medium text-gray-700">{etaLabel}</span>
            <span className="flex items-center gap-3">
              {distText && (
                <span className="text-gray-400">{distText}</span>
              )}
              <span
                className="font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#EFF6FF', color: '#2563EB' }}
              >
                {etaText ?? `~${fallbackEta} min`}
              </span>
              {!etaText && (
                <span className="text-gray-400 italic">est.</span>
              )}
            </span>
          </div>
        );
      })()}
    </div>
  );
}
