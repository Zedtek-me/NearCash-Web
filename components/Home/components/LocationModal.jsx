import React from "react";
import { X, Navigation, Loader2 } from "lucide-react";

export default function LocationModal({ onClose, onAllow, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Location Permission Required
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Navigation className="text-blue-500 mr-3" size={24} />
            <span className="text-gray-700">Enable Location Access</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This app needs access to your location to show you the best route to
            vendors and provide accurate directions.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              Your location data is only used to calculate routes and is stored
              locally on your device.
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAllow}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Getting Location…
              </>
            ) : (
              "Allow Location"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
