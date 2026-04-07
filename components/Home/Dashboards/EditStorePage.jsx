import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, ChevronDown, Plus, X, Check, Search, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router';
import { useLoadScript } from '@react-google-maps/api';
import { toast } from 'react-toastify';

import { GET_SUB_BUSINESSES } from '../../Auths/queries/userQueries';
import { UPDATE_STORE, UPDATE_ASSET } from '../../Auths/mutations/userMutations'; 
import { google_key } from '../../../configs/environs';
import { backArrowReturnFunc } from '../../../utils/auths';
import useAuth from '../../../hooks/useAuth';
import { formatAmountInput } from '../../../utils/transactionHelpers';

const libraries = ['places'];

const rangeOptions = [
  { label: '1000-5000',     value: '1000-5000:200',       charge: '200' },
  { label: '5001-10000',    value: '5001-10000:300',       charge: '300' },
  { label: '10001-20000',   value: '10001-20000:400',      charge: '400' },
  { label: '20001-50000',   value: '20001-50000:500',      charge: '500' },
  { label: '50001-100000',  value: '50001-100000:600',     charge: '600' },
  { label: '100001+',       value: '100001+:700',          charge: '700' },
];

const EditStorePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();


  const [formData, setFormData] = useState({
    name: '', address: '', location: { latitude: '', longitude: '' },
    range: [], description: '', country: '', businessType: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customRange, setCustomRange] = useState({ min: '', max: '', charge: '' });
  const [errors, setErrors] = useState({});
  const [initialized, setInitialized] = useState(false);

  const addressInputRef = useRef(null);
  const rangeDropdownRef = useRef(null);

  const { isLoaded } = useLoadScript({ googleMapsApiKey: google_key, libraries });

  const { data: subBizData, loading: subBizLoading } = useQuery(GET_SUB_BUSINESSES, {
    variables: { pageCount: 10, pageNumber: 1, id, ownerId: userData?.id || "" },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!subBizData || initialized) return;

    const biz = subBizData?.businesses?.businesses[0];

    if (!biz) return;

    const prefillRanges = (biz.assets || []).map(asset => {
      const match = rangeOptions.find(o => o.label === asset.range);
      if (match) return match;
      return {
        label: asset.range,
        value: `${asset.range}:${asset.chargeRate}`,
        charge: String(asset.chargeRate),
      };
    });

    setFormData({
      name:        biz.businessName  || biz.name || '',
      address:     biz.address       || '',
      description: biz.description   || '',
      country:     biz.country        || '',
      businessType: biz.businessType,
      location: {
        latitude:  biz.location?.latitude  || '',
        longitude: biz.location?.longitude || '',
      },
      range: prefillRanges,
    });
    setInitialized(true);
  }, [subBizData, id, initialized]);

  const [updateStore, { loading: updating }] = useMutation(UPDATE_STORE);
  const [updateAsset] = useMutation(UPDATE_ASSET);

  const fetchAddressSuggestions = (input) =>
    new Promise((resolve) => {
      if (!window.google?.maps?.places) { resolve([]); return; }
      setIsLoadingAddress(true);
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions({ input, types: ['geocode'] }, (predictions, status) => {
        setIsLoadingAddress(false);
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]); return;
        }
        resolve(predictions.map(p => ({ id: p.place_id, description: p.description })));
      });
    });

  const handleAddressChange = async (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, address: val }));
    const results = await fetchAddressSuggestions(val);
    setAddressSuggestions(results);
    setShowSuggestions(true);
  };

  const handleAddressSelect = (suggestion) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails({ placeId: suggestion.id, fields: ['geometry', 'formatted_address'] }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address,
          location: {
            latitude:  place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          },
        }));
      }
    });
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleRangeSelect = (option) => {
    const isSelected = formData.range.some(r => r.value === option.value);
    setFormData(prev => ({
      ...prev,
      range: isSelected
        ? prev.range.filter(r => r.value !== option.value)
        : [...prev.range, option],
    }));
  };

  const handleCustomRangeSubmit = () => {
    if (customRange.min && customRange.max && customRange.charge) {
      const rawMin = customRange.min.replace(/,/g, '');
      const rawMax = customRange.max.replace(/,/g, '');
      setFormData(prev => ({
        ...prev,
        range: [...prev.range, {
          label: `${rawMin}-${rawMax}`,
          value: `${rawMin}-${rawMax}:${customRange.charge}`,
          charge: customRange.charge,
        }],
      }));
      setShowCustomRange(false);
      setCustomRange({ min: '', max: '', charge: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim())    newErrors.name    = 'Business name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.range.length)   newErrors.range   = 'At least one range must be selected';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = {
      businessName: formData.name,
      address:      formData.address,
      description:  formData.description,
      country:      formData.country,
      businessType: formData.businessType
    };

    const financialAssets = formData.range.map(item => ({
      range:      item.label,
      chargeRate: Number(item.charge),
    }));

    updateStore({ variables: { updateData: data, financialAssets, businessId: id } })
      .then(() => {
        toast.success('Business updated successfully!');
        navigate('/dashboard/VENDOR');
      })
      .catch(err => toast.error(err?.message));
  };

  // ─── Click outside ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(e.target))
        setShowRangeDropdown(false);
      if (addressInputRef.current && !addressInputRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Loading skeleton ─────────────────────────────────────────────────────────
  if (subBizLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="text-gray-500 text-sm">Loading business details…</p>
      </div>
    </div>
  );

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <button className="mr-4 p-2 hover:bg-gray-800 rounded-full transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" onClick={() => backArrowReturnFunc(navigate)} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Edit Sub Business</h1>
          </div>
          <p className="text-gray-300 text-sm sm:text-base">
            Update the details of your sub business below
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="space-y-6">

          {/* Business Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">Business Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-5 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
              placeholder="Enter your business name"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">Country *</label>
            <input
              type="text"
              value={formData.country}
              onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className={`w-full px-4 py-5 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.country ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
              placeholder="Enter Country name"
            />
            {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2 relative" ref={addressInputRef}>
            <label className="block text-sm font-semibold text-black">Address *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.address}
                onChange={handleAddressChange}
                className={`w-full px-4 py-5 pr-10 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
                placeholder="Start typing your address..."
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoadingAddress
                  ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : <Search className="w-5 h-5 text-gray-400" />}
              </div>
            </div>
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
          </div>

          {/* Price Range */}
          <div className="space-y-2 relative" ref={rangeDropdownRef}>
            <label className="block text-sm font-semibold text-black">Price Range *</label>
            <div
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className={`w-full px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${errors.range ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {formData.range.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.range.map((selectedRange, index) => (
                        <span key={index} className="bg-black text-white px-2 py-1 rounded text-xs flex items-center">
                          {selectedRange.label}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, range: prev.range.filter((_, i) => i !== index) }));
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
                        className={`flex items-center p-2 rounded cursor-pointer transition-all duration-200 ${isSelected ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-gray-300'}`}>
                          {isSelected && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className={`text-xs ${isSelected ? 'text-gray-200' : 'text-gray-500'}`}>charge: {option.charge}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200 mt-2">
                  <div
                    onClick={() => setShowCustomRange(!showCustomRange)}
                    className="flex items-center p-2 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="text-sm text-gray-700">Add Custom Range</span>
                  </div>
                  {showCustomRange && (
                    <div className="p-4 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" inputMode="numeric" placeholder="Min" value={customRange.min}
                          onChange={e => setCustomRange(prev => ({ ...prev, min: formatAmountInput(e.target.value) }))}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                        <input type="text" inputMode="numeric" placeholder="Max" value={customRange.max}
                          onChange={e => setCustomRange(prev => ({ ...prev, max: formatAmountInput(e.target.value) }))}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                      </div>
                      <input type="number" placeholder="Charge" value={customRange.charge}
                        onChange={e => setCustomRange(prev => ({ ...prev, charge: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleCustomRangeSubmit}
                          className="flex-1 bg-black text-white py-2 rounded text-sm hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center">
                          <Check className="w-4 h-4 mr-1" /> Add
                        </button>
                        <button type="button" onClick={() => setShowCustomRange(false)}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center">
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {errors.range && <p className="text-red-500 text-sm">{errors.range}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-5 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent border-gray-300 hover:border-gray-400"
              placeholder="Enter Description"
            />
          </div>

          {/* Submit */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={updating}
              className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              {updating ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStorePage;