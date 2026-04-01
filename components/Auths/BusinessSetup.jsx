import React, { useRef, useState } from 'react';
import { User, Store, Building2, MapPin, Globe, FileText, ArrowRight, Check, Contact, X, ChevronDown, Plus, Banknote, TrendingUp } from 'lucide-react';
import { UPDATE_BUSINESS, UpdateUserMutation } from './mutations/userMutations';
import toast from 'react-hot-toast';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router';
import { google_key } from  '../../configs/environs';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

const BUSINESS_TYPES = [
  {
    value: 'LOCAL',
    label: 'Local Currency',
    sublabel: 'NGN · Naira transactions only',
    icon: Banknote,
    description: 'You handle only local currency (NGN) exchanges and POS cash-outs.',
  },
  {
    value: 'FX',
    label: 'FX Exchange',
    sublabel: 'USD · EUR · GBP & more',
    icon: TrendingUp,
    description: 'You deal in foreign currencies — USD, EUR, GBP, etc. alongside or instead of NGN.',
  },
];

export default function AccountTypePage() {
  const [selectedType, setSelectedType] = useState(null);
  const [businessType, setBusinessType] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  useLoadScript({
    googleMapsApiKey: google_key,
    libraries,
  });

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    country: '',
    phoneNumber: '',
    range: [],
    businessType: businessType
  });

  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customRange, setCustomRange] = useState({ min: '', max: '', charge: '' });
  const [updateUserInfo, { loading }] = useMutation(UpdateUserMutation);
  const rangeDropdownRef = useRef(null);
  const [errors] = useState({});
  const [updateBuzInfo, { loading: updatingBuz }] = useMutation(UPDATE_BUSINESS);

  const rangeOptions = [
    { label: '1000-5000',     value: '1000-5000:200',     charge: '100' },
    { label: '5001-10000',    value: '5001-10000:300',     charge: '200' },
    { label: '10001-20000',   value: '10001-20000:400',    charge: '300' },
    { label: '20001-50000',   value: '20001-50000:500',    charge: '500' },
    { label: '50001-100000',  value: '50001-100000:600',   charge: '1000' },
    { label: '100001+',       value: '100001+:700',        charge: '2000' },
  ];

  const handleCustomRangeSubmit = () => {
    if (customRange.min && customRange.max && customRange.charge) {
      const customOption = {
        label: `${customRange.min}-${customRange.max}`,
        value: `${customRange.min}-${customRange.max}:${customRange.charge}`,
        charge: customRange.charge,
      };
      setFormData(prev => ({ ...prev, range: [...prev.range, customOption] }));
      setShowCustomRange(false);
      setCustomRange({ min: '', max: '', charge: '' });
    }
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

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setBusinessType(null);
  };

  const fetchAddressSuggestions = (input) => {
    return new Promise((resolve) => {
      if (!window.google?.maps?.places) { resolve([]); return; }
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input, types: ['geocode'] },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
            resolve([]); return;
          }
          resolve(predictions.map(p => ({ id: p.place_id, description: p.description })));
        }
      );
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, address: value }));
    const results = await fetchAddressSuggestions(value);
    setShowSuggestions(true);
    setAddressSuggestions(results);
  };

  const handleAddressSelect = (suggestion) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      { placeId: suggestion.id, fields: ['geometry', 'formatted_address'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setFormData(prev => ({ ...prev, address: place.formatted_address }));
        }
      }
    );
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const isFormValid =
    formData.businessName &&
    formData.description &&
    formData.address &&
    formData.country &&
    businessType;

  const handleSubmit = async () => {
    if (selectedType === 'vendor' && !isFormValid) return;
    if (!selectedType) return;

    if (selectedType === 'client') {
      updateUserInfo({ variables: { data: { userType: 'CLIENT' } } })
        .then(({ data }) => {
          const { message } = data?.updateUser || {};
          navigate('/kyc', { state: { userType: 'CLIENT' } });
          toast.success(message);
        })
        .catch(err => toast.error(err?.message));
    } else {
      const financialAssets = formData.range.map(item => ({
        range: item.label,
        chargeRate: Number(item.charge),
      }));

      updateUserInfo({
        variables: {
          data: {
            businessData: {
              businessName: formData.businessName,
              description: formData.description,
              address: formData.address,
              country: formData.country,
              businessType: formData?.businessType || businessType,
            },
            userType: 'VENDOR',
            phoneNumber: formData.phoneNumber,
          },
        },
      })
        .then(({ data }) => {
          const { message, user } = data?.updateUser || {};
          updateBuzInfo({
            variables: {
              businessId: user?.businesses[0]?.id,
              updateData: {
                businessName: formData.businessName,
                description: formData.description,
                address: formData.address,
                country: formData.country,
                businessType: formData?.businessType || businessType
              },
              financialAssets,
            },
          }).then(() => {
            navigate('/kyc', { state: { userType: 'VENDOR' } });
            toast.success(message);
          });
        })
        .catch(err => toast.error(err?.message));
    }
  };

  const inputCls =
    'w-full px-5 py-3.5 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors duration-200 text-sm';

  const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2';

  return (
    <div className="min-h-screen bg-black p-4 pb-16">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 pt-10 sm:pt-14">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            Choose Your Account Type
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            Select the account type that best describes how you'll use NearCash
          </p>
        </div>

        {/* Account type cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Client card */}
          <div
            className={`relative bg-white/5 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border transition-all duration-300 cursor-pointer group hover:scale-[1.02] ${
              selectedType === 'client'
                ? 'border-white bg-white/10 shadow-lg shadow-white/10'
                : 'border-gray-800 hover:border-gray-600'
            }`}
            onClick={() => handleTypeSelect('client')}
          >
            <div className="absolute top-5 right-5">
              <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                selectedType === 'client' ? 'border-white bg-white' : 'border-gray-600 group-hover:border-gray-400'
              }`}>
                {selectedType === 'client' && <div className="w-2 h-2 bg-black rounded-full" />}
              </div>
            </div>

            <div className="text-center">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                selectedType === 'client' ? 'bg-white' : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                <User className={`w-7 h-7 sm:w-8 sm:h-8 ${selectedType === 'client' ? 'text-black' : 'text-white'}`} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Client Account</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Find nearby POS agents, request cash, and manage your transactions in one place.
              </p>
            </div>
          </div>

          {/* Vendor card */}
          <div
            className={`relative bg-white/5 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border transition-all duration-300 cursor-pointer group hover:scale-[1.02] ${
              selectedType === 'vendor'
                ? 'border-white bg-white/10 shadow-lg shadow-white/10'
                : 'border-gray-800 hover:border-gray-600'
            }`}
            onClick={() => handleTypeSelect('vendor')}
          >
            <div className="absolute top-5 right-5">
              <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                selectedType === 'vendor' ? 'border-white bg-white' : 'border-gray-600 group-hover:border-gray-400'
              }`}>
                {selectedType === 'vendor' && <div className="w-2 h-2 bg-black rounded-full" />}
              </div>
            </div>

            <div className="text-center">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                selectedType === 'vendor' ? 'bg-white' : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                <Store className={`w-7 h-7 sm:w-8 sm:h-8 ${selectedType === 'vendor' ? 'text-black' : 'text-white'}`} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Vendor Account</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                List your POS shop, set your cash ranges, and connect with clients in your area.
              </p>
            </div>
          </div>
        </div>

        {/* Vendor profile form */}
        {selectedType === 'vendor' && (
          <div className="bg-white/[0.04] backdrop-blur-lg rounded-3xl p-5 sm:p-8 border border-gray-800 mb-6">
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Complete Your Vendor Profile</h2>
              <p className="text-xs sm:text-sm text-gray-500">Tell us about your business to get started</p>
            </div>

            <div className="space-y-6">

              {/* Business Type selector */}
              <div>
                <label className={labelCls}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  Business Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {BUSINESS_TYPES.map(({ value, label, sublabel, icon: Icon, description }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBusinessType(value)}
                      className={`relative text-left rounded-2xl border p-4 transition-all duration-200 focus:outline-none group ${
                        businessType === value
                          ? 'border-white bg-white/10'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          businessType === value ? 'bg-white' : 'bg-gray-800 group-hover:bg-gray-700'
                        }`}>
                          <Icon className={`w-4 h-4 ${businessType === value ? 'text-black' : 'text-gray-300'}`} />
                        </div>
                        <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          businessType === value ? 'border-white bg-white' : 'border-gray-600'
                        }`}>
                          {businessType === value && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white leading-tight">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{sublabel}</p>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed hidden sm:block">{description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Name + Country */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    <Building2 className="w-3.5 h-3.5" />
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={e => handleInputChange('businessName', e.target.value)}
                    className={inputCls}
                    placeholder="Enter your business name"
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Globe className="w-3.5 h-3.5" />
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={e => handleInputChange('country', e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Nigeria"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className={labelCls}>
                  <Contact className="w-3.5 h-3.5" />
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={e => handleInputChange('phoneNumber', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 08012345678"
                />
              </div>

              {/* Address */}
              <div className="relative">
                <label className={labelCls}>
                  <MapPin className="w-3.5 h-3.5" />
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={handleAddressChange}
                  className={inputCls}
                  placeholder="Enter your full business address"
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto mt-1">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleAddressSelect(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{suggestion.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div className="space-y-2 relative" ref={rangeDropdownRef}>
                <label className={labelCls}>Price Range</label>
                <div
                  onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                  className={`w-full px-5 py-3.5 bg-gray-900 border rounded-2xl text-white cursor-pointer transition-colors duration-200 ${
                    errors.range ? 'border-red-500' : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {formData.range.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.range.map((selectedRange, index) => (
                            <span
                              key={index}
                              className="bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-lg text-xs flex items-center gap-1"
                            >
                              {selectedRange.label}
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setFormData(prev => ({
                                    ...prev,
                                    range: prev.range.filter((_, i) => i !== index),
                                  }));
                                }}
                                className="hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Select cash ranges</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200 ${showRangeDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {showRangeDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">Select Multiple Ranges</div>
                      {rangeOptions.map((option, index) => {
                        const isSelected = formData.range.some(r => r.value === option.value);
                        return (
                          <div
                            key={index}
                            onClick={() => handleRangeSelect(option)}
                            className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                              isSelected ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-white bg-white' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{option.label}</div>
                              <div className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                Charge: ₦{option.charge}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-gray-200">
                      <div
                        onClick={() => setShowCustomRange(!showCustomRange)}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer text-sm text-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Custom Range
                      </div>
                      {showCustomRange && (
                        <div className="p-3 bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={customRange.min}
                              onChange={e => setCustomRange(prev => ({ ...prev, min: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black text-gray-800"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={customRange.max}
                              onChange={e => setCustomRange(prev => ({ ...prev, max: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black text-gray-800"
                            />
                          </div>
                          <input
                            type="number"
                            placeholder="Charge (₦)"
                            value={customRange.charge}
                            onChange={e => setCustomRange(prev => ({ ...prev, charge: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black text-gray-800"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCustomRangeSubmit}
                              className="flex-1 bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCustomRange(false)}
                              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {errors.range && <p className="text-red-500 text-xs mt-1">{errors.range}</p>}
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>
                  <FileText className="w-3.5 h-3.5" />
                  Business Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={inputCls}
                  placeholder="Describe your business, services, and what makes you unique..."
                />
              </div>

            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading || updatingBuz || !selectedType || (selectedType === 'vendor' && !isFormValid)}
            className={`w-full py-4 px-8 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-3 ${
              selectedType && (selectedType === 'client' || isFormValid) && !loading && !updatingBuz
                ? 'bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10 hover:scale-[1.01]'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {(loading || updatingBuz) ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-300 rounded-full animate-spin" />
                Creating Your Account...
              </>
            ) : (
              <>
                Complete Registration
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
