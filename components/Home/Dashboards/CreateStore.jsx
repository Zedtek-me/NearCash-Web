import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, ChevronDown, Plus, X, Check, Search } from 'lucide-react';

import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { CREATE_STORE } from '../../Auths/mutations/userMutations';
import { useMutation } from '@apollo/client';
import useAuth from '../../../Hooks/Auths';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';


const CreateStorePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: { latitude: '', longitude: '' },
    range: [],
    description: '',
    country: ''
  });

  const {
  ready,
  value,
  suggestions: { status, data },
  setValue,
  clearSuggestions
} = usePlacesAutocomplete({
  requestOptions: {
    componentRestrictions: { country: "ng" },
  },
  debounce: 300
});
      const { userData } = useAuth();
    const navigate = useNavigate()

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customRange, setCustomRange] = useState({ min: '', max: '', commission: '' });
  const [errors, setErrors] = useState({});
  const [createStore, { loadingStore }] = useMutation(CREATE_STORE);
  
  
  const addressInputRef = useRef(null);
  const rangeDropdownRef = useRef(null);
  
  // Predefined range options
  const rangeOptions = [
    { label: '1000-5000', value: '1000-5000:200', commission: '200' },
    { label: '5001-10000', value: '5001-10000:300', commission: '300' },
    { label: '10001-20000', value: '10001-20000:400', commission: '400' },
    { label: '20001-50000', value: '20001-50000:500', commission: '500' },
    { label: '50001-100000', value: '50001-100000:600', commission: '600' },
    { label: '100001+', value: '100001+:700', commission: '700' }
  ];

 const fetchAddressSuggestions = async (input) => {
  if (!input) return [];

  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        input
      )}&apiKey=63c5a80943bb422bb32c1a54c1c50040`
    );
    const data = await res.json();

    return data.features.map((feature) => ({
      id: feature.properties.place_id,
      description: feature.properties.formatted,
      lat: feature.geometry.coordinates[1], // GeoJSON format: [lng, lat]
      lng: feature.geometry.coordinates[0]
    }));
  } catch (err) {
    console.error("Geoapify error:", err);
    return [];
  }
};


  const handleAddressChange = async (e) => {
  const value = e.target.value;
  setFormData((prev) => ({ ...prev, address: value }));

  const results = await fetchAddressSuggestions(value);
  setShowSuggestions(true);
  setAddressSuggestions(results);
};

console.log(userData);


  const handleAddressSelect = (suggestion) => {
  setFormData((prev) => ({
    ...prev,
    address: suggestion.description,
    location: { latitude: suggestion.lat, longitude: suggestion.lng }
  }));
    setShowSuggestions(false);
  setAddressSuggestions([]);
};

  const handleRangeSelect = (option) => {
    const isSelected = formData.range.some(r => r.value === option.value);
    
    if (isSelected) {
      // Remove from selection
      setFormData(prev => ({
        ...prev,
        range: prev.range.filter(r => r.value !== option.value)
      }));
    } else {
      // Add to selection
      setFormData(prev => ({
        ...prev,
        range: [...prev.range, option]
      }));
    }
  };

  const handleCustomRangeSubmit = () => {
    if (customRange.min && customRange.max && customRange.commission) {
      const customOption = {
        label: `${customRange.min}-${customRange.max}`,
        value: `${customRange.min}-${customRange.max}:${customRange.commission}`,
        commission: customRange.commission
      };
      
      setFormData(prev => ({
        ...prev,
        range: [...prev.range, customOption]
      }));
      
      setShowCustomRange(false);
      setCustomRange({ min: '', max: '', commission: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Store name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.location.latitude || !formData.location.longitude) {
      newErrors.location = 'Please select a valid address from suggestions';
    }
    if (!formData.range.length) newErrors.range = 'At least one range must be selected';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  // if (!validateForm()) return;

  const data = {
          parentBusinessId: userData.id,
          businessName: formData.name,
          address: formData.address,
          description: formData.description,
          country: formData.country,
          // location: {
          //   latitude: formData.location.latitude,
          //   longitude: formData.location.longitude
          // }
    }

    const backendData = formData?.range.map(item => ({
      range: item.label,                
      chargeRate: Number(item.commission) 
    }));

    
  const financialAssets = [...backendData]

   createStore({
          variables: {
         data,
         financialAssets
          }
          })
          .then(({ data }) => {
              navigate(`/dashboard/VENDOR`);
              toast.success(message);
          })
          .catch((err) => {
              toast.error(err?.message);
          })
};


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(event.target)) {
        setShowRangeDropdown(false);
      }
      if (addressInputRef.current && !addressInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <button className="mr-4 p-2 hover:bg-gray-800 rounded-full transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Create New Store</h1>
          </div>
          <p className="text-gray-300 text-sm sm:text-base">
            Fill in the details below to create your new store
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="space-y-6">
          {/* Store Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              Store Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-5 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="Enter your store name"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

           <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              Country *
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className={`w-full px-4 py-5 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                errors.country ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="Enter Country name"
            />
            {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
          </div>


          {/* Address with Autocomplete */}
          <div className="space-y-2 relative" ref={addressInputRef}>
            <label className="block text-sm font-semibold text-black">
              Address *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.address}
                onChange={handleAddressChange}
                className={`w-full px-4 py-5 pr-10 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.address ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
                }`}
                placeholder="Start typing your address..."
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoadingAddress ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Address Suggestions */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAddressSelect(suggestion)}
                    className="w-full px-4 py-5 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center"
                  >
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{suggestion.description}</span>
                  </button>
                ))}
              </div>
            )}
            
            {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
            {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
          </div>

          {/* {formData.location.latitude && formData.location.longitude && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>
                  Coordinates: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                </span>
              </div>
            </div>
          )} */}

          <div className="space-y-2 relative" ref={rangeDropdownRef}>
            <label className="block text-sm font-semibold text-black">
             Price Range *
            </label>
            <div
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer ${
                errors.range ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {formData.range.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.range.map((selectedRange, index) => (
                        <span
                          key={index}
                          className="bg-black text-white px-2 py-1 rounded text-xs flex items-center"
                        >
                          {selectedRange.label}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                range: prev.range.filter((_, i) => i !== index)
                              }));
                            }}
                            className="ml-1 hover:bg-gray-700 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">Select ranges</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showRangeDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Range Dropdown */}
            {showRangeDropdown && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Select Multiple Ranges</div>
                  {rangeOptions.map((option, index) => {
                    const isSelected = formData.range.some(r => r.value === option.value);
                    return (
                      <div
                        key={index}
                        onClick={() => handleRangeSelect(option)}
                        className={`flex items-center p-2 rounded cursor-pointer transition-all duration-200 ${
                          isSelected ? 'bg-black text-white' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                          isSelected ? 'border-white bg-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className={`text-xs ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}>
                            Commission: {option.commission}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Custom Range Option */}
                <div className="border-t border-gray-200 mt-2">
                  <div
                    onClick={() => setShowCustomRange(!showCustomRange)}
                    className="flex items-center p-2 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="text-sm text-gray-700">Add Custom Range</span>
                  </div>
                  
                  {/* Custom Range Form */}
                  {showCustomRange && (
                    <div className="p-4 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Min"
                          value={customRange.min}
                          onChange={(e) => setCustomRange(prev => ({ ...prev, min: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={customRange.max}
                          onChange={(e) => setCustomRange(prev => ({ ...prev, max: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <input
                        type="number"
                        placeholder="Commission"
                        value={customRange.commission}
                        onChange={(e) => setCustomRange(prev => ({ ...prev, commission: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCustomRangeSubmit}
                          className="flex-1 bg-black text-white py-2 rounded text-sm hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomRange(false)}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {errors.range && <p className="text-red-500 text-sm">{errors.range}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">
              Description
            </label>
            <textarea
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-4 py-5 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="Enter Description"
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              Create Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStorePage;