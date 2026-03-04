import React, { useRef, useState } from 'react';
import { User, Store, Building2, MapPin, Globe, FileText, ArrowRight, Check, Contact, X, ChevronDown, Plus } from 'lucide-react';
import AnimatedLoader from '../../utils/components/spinner';
import { UPDATE_BUSINESS, UpdateUserMutation } from './mutations/userMutations';
import { toast } from 'react-toastify';
import { useMutation } from '@apollo/client';
import useAuth from '../../Hooks/Auths';
import { useNavigate } from 'react-router';
import { geoapify_key, google_key } from  '../../configs/environs';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

export default function AccountTypePage() {
  const [selectedType, setSelectedType] = useState(null);
    const { updateUser, clearUser, userData } = useAuth();
    const [addressSuggestions, setAddressSuggestions] = useState([]);
      const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate()
    const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: google_key,
    libraries: libraries, 
  });

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    country: '',
    range: [],

  });
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [showRangeDropdown, setShowRangeDropdown] = useState(false);
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [customRange, setCustomRange] = useState({ min: '', max: '', charge: '' });
  const [updateUserInfo, { loading }] = useMutation(UpdateUserMutation);
    const rangeDropdownRef = useRef(null);
      const [errors, setErrors] = useState({});

      const [updateBuzInfo, { loading: updatingBuz }] = useMutation(UPDATE_BUSINESS);
    
  
   const rangeOptions = [
    { label: '1000-5000', value: '1000-5000:200', charge: '200' },
    { label: '5001-10000', value: '5001-10000:300', charge: '300' },
    { label: '10001-20000', value: '10001-20000:400', charge: '400' },
    { label: '20001-50000', value: '20001-50000:500', charge: '500' },
    { label: '50001-100000', value: '50001-100000:600', charge: '600' },
    { label: '100001+', value: '100001+:700', charge: '700' }
  ];

   const handleCustomRangeSubmit = () => {
    if (customRange.min && customRange.max && customRange.charge) {
      const customOption = {
        label: `${customRange.min}-${customRange.max}`,
        value: `${customRange.min}-${customRange.max}:${customRange.charge}`,
        charge: customRange.charge
      };
      
      setFormData(prev => ({
        ...prev,
        range: [...prev.range, customOption]
      }));
      
      setShowCustomRange(false);
      setCustomRange({ min: '', max: '', charge: '' });
    }
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

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const fetchAddressSuggestions = (input) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.error('Google Maps API not loaded yet');
        resolve([]);
        return;
      }

    const service = new window.google.maps.places.AutocompleteService();

    service.getPlacePredictions(
      { input, types: ["geocode"] }, // "geocode" = only addresses
      (predictions, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
          resolve([]);
          return;
        }

        resolve(
          predictions.map((p) => ({
            id: p.place_id,
            description: p.description,
          }))
        );
      }
    );
  });
};


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = async (e) => {
  const value = e.target.value;
  setFormData((prev) => ({ ...prev, address: value }));

  const results = await fetchAddressSuggestions(value);
  setShowSuggestions(true);
  setAddressSuggestions(results);
};

const handleAddressSelect = (suggestion) => {
  const service = new window.google.maps.places.PlacesService(
    document.createElement("div")
  );

  service.getDetails(
    { placeId: suggestion.id, fields: ["geometry", "formatted_address"] },
    (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address
        }));
      }
    }
  );

  setShowSuggestions(false);
  setAddressSuggestions([]);
};


  const isFormValid = formData.businessName && formData.description && formData.address && formData.country;

  const handleSubmit = async () => {
    console.log('ooooo', selectedType);
    
    if (selectedType === 'vendor' && !isFormValid) return;

    if (!selectedType) return;

    if (selectedType === 'client') {
        updateUserInfo({
      variables: {
       data: {
        userType: selectedType.toUpperCase(),
    }
      }
    })
      .then(({ data }) => {
        const { message, user } = data?.updateUser || {};
        navigate(`/dashboard/${user?.userType || 'client'}`);
        toast.success(message);
      })
      .catch((err) => {
        toast.error(err?.message);
      })
    } else {
       const financialData = formData?.range.map(item => ({
      range: item.label,                
      chargeRate: Number(item.charge)
    }));
  const financialAssets = [...financialData]


    updateUserInfo({
        variables: {
        data: {
            businessData: {
              businessName: formData.businessName,
              description: formData.description,
              address: formData.address,
              country: formData.country,

            },
            userType: selectedType.toUpperCase(),
            phoneNumber: formData.phoneNumber,
        }
        }
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
                    },
                    financialAssets: financialAssets
                }
            }).then(({ data: bizData }) => {
               navigate(`/dashboard/${user?.userType || 'vendor'}`);
              toast.success(message);
            })
           
        })
        .catch((err) => {
          console.log(err);
          
            toast.error(err?.message);
        })
    }
    
   
  };


  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 pt-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Account Type
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select the account type that best describes how you'll be using our platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div 
            className={`relative bg-white/5 backdrop-blur-lg rounded-3xl p-8 border transition-all duration-500 cursor-pointer group hover:scale-105 ${
              selectedType === 'client' 
                ? 'border-white bg-white/10 shadow-xl shadow-white/10' 
                : 'border-gray-800 hover:border-gray-600'
            }`}
            onClick={() => handleTypeSelect('client')}
          >
            <div className="absolute top-6 right-6">
              <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                selectedType === 'client' 
                  ? 'border-white bg-white' 
                  : 'border-gray-600 group-hover:border-gray-400'
              }`}>
                {selectedType === 'client' && (
                  <div className="w-2 h-2 bg-black rounded-full m-1.5 animate-pulse"></div>
                )}
              </div>
            </div>

            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                selectedType === 'client' 
                  ? 'bg-white shadow-lg shadow-white/20' 
                  : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                <User className={`w-10 h-10 ${selectedType === 'client' ? 'text-black' : 'text-white'}`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Client Account</h3>
              <p className="text-gray-400 leading-relaxed">
               Perfect for individuals or businesses looking for reliable POS agents nearby.
                Discover vetted vendors based on your location and get your transactions done quickly and easily.
              </p>
            </div>
          </div>

          <div 
            className={`relative bg-white/5 backdrop-blur-lg rounded-3xl p-8 border transition-all duration-500 cursor-pointer group hover:scale-105 ${
              selectedType === 'vendor' 
                ? 'border-white bg-white/10 shadow-xl shadow-white/10' 
                : 'border-gray-800 hover:border-gray-600'
            }`}
            onClick={() => handleTypeSelect('vendor')}
          >
            <div className="absolute top-6 right-6">
              <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                selectedType === 'vendor' 
                  ? 'border-white bg-white' 
                  : 'border-gray-600 group-hover:border-gray-400'
              }`}>
                {selectedType === 'vendor' && (
                  <div className="w-2 h-2 bg-black rounded-full m-1.5 animate-pulse"></div>
                )}
              </div>
            </div>

            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                selectedType === 'vendor' 
                  ? 'bg-white shadow-lg shadow-white/20' 
                  : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                <Store className={`w-10 h-10 ${selectedType === 'vendor' ? 'text-black' : 'text-white'}`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Vendor Account</h3>
              <p className="text-slate-300 leading-relaxed">
               Ideal for POS agents and store owners who want to grow their visibility.
                List your shop, share your services, and connect with nearby customers searching for agents like you.
              </p>
            </div>
          </div>
        </div>

        {selectedType === 'vendor' && (
          <div className="transform transition-all duration-700 ease-out animate-in slide-in-from-bottom-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-800 shadow-2xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">Complete Your Vendor Profile</h2>
                <p className="text-gray-400 text-lg">Tell us about your business to get started</p>
              </div>

              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Business Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all duration-300"
                        placeholder="Enter your business name"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Country
                    </label>
                    
                     <div className="relative">
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all duration-300"
                        placeholder="Enter your country name"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                   <div className="group">
                    <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Contact className="w-4 h-4" />
                      Phone Number
                    </label>
                    
                     <div className="relative">
                      <input
                        type="text"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all duration-300"
                        placeholder="Enter your phone number"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-white/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Business Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleAddressChange(e)}
                        className="w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all duration-300"
                      placeholder="Enter your full business address"
                      required
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
                </div>

                 <div className="space-y-2 relative" ref={rangeDropdownRef}>
            <label className=" text-sm font-semibold text-white mb-3 flex items-center gap-2">
             Price Range *
            </label>
            <div
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className={`w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all duration-300 cursor-pointer ${
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
                            charge: {option.charge}
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
                        placeholder="charge"
                        value={customRange.charge}
                        onChange={(e) => setCustomRange(prev => ({ ...prev, charge: e.target.value }))}
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

                <div className="group">
                  <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Business Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={5}
                        className="w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all duration-300"
                      placeholder="Describe your business, services, and what makes you unique..."
                      required
                    ></textarea>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                
            </div>
          </div>
          </div>
        )}

        <div className="pt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || updatingBuz}
                    className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                      selectedType && !loading
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105'
                        : 'bg-white/10 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {(loading || updatingBuz) ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating Your Account...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>



        {selectedType && (
          <div className="fixed bottom-8 right-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-4 border border-white/20">
              <Check className="w-6 h-6 text-green-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}