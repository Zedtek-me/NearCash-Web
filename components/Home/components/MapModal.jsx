import React, { useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";

const getRouteInstructions = (mapData) => {
  const legs = mapData?.features?.[0]?.properties?.legs;
  if (!legs?.[0]?.steps) return [];
  return legs[0].steps.map((step) => step.instruction.text);
};

export default function MapModal({ selectedStore, mapData, userLocation, isLoadingRoute, onClose }) {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapData || !userLocation || !selectedStore || !window.L || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    try {
      const coordinates = mapData.features[0].geometry.coordinates[0];
      const map = window.L.map(mapRef.current).setView(
        [userLocation.lat, userLocation.lng],
        13
      );
      mapInstanceRef.current = map;

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const dotIcon = (color) =>
        window.L.divIcon({
          className: "",
          html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

      const userMarker  = window.L.marker([userLocation.lat, userLocation.lng], { icon: dotIcon("#3b82f6") }).addTo(map).bindPopup("Your Location");
      const storeMarker = window.L.marker(
        [selectedStore.coordinates.lat, selectedStore.coordinates.lng],
        { icon: dotIcon("#ef4444") }
      ).addTo(map).bindPopup(selectedStore.name);

      const group = new window.L.featureGroup([userMarker, storeMarker]);

      if (coordinates?.length > 0) {
        const routeLine = window.L.polyline(
          coordinates.map((c) => [c[1], c[0]]),
          { color: "#3b82f6", weight: 4, opacity: 0.8 }
        ).addTo(map);
        group.addLayer(routeLine);
      }

      map.fitBounds(group.getBounds().pad(0.1));
    } catch {
      // map init failed silently
    }

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [mapData, userLocation, selectedStore]);

  const instructions = getRouteInstructions(mapData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Route to {selectedStore?.name}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[600px]">
          <div className="flex-1 relative">
            {isLoadingRoute ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span>Loading route…</span>
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full" />
            )}
          </div>

          {mapData && (
            <div className="w-80 bg-gray-50 p-4 overflow-y-auto">
              <h4 className="font-semibold text-gray-800 mb-3">Route Instructions</h4>
              <div className="space-y-2">
                {instructions.map((text, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-white rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Route Details</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Mode: {mapData.properties?.mode || "Walking"}</p>
                  <p>Distance: {mapData.features[0]?.properties?.distance || 0} m</p>
                  <p>Duration: {mapData.features[0]?.properties?.time || 0} min</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
