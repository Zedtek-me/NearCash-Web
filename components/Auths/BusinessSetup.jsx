import React, { useState } from 'react';
import { User, Store, Building2, MapPin, Globe, FileText, ArrowRight, Check } from 'lucide-react';
import AnimatedLoader from '../../utils/components/spinner';
import { UpdateUserMutation } from './mutations/userMutations';
import { toast } from 'react-toastify';
import { useMutation } from '@apollo/client';
import useAuth from '../../Hooks/Auths';
import { useNavigate } from 'react-router';

export default function AccountTypePage() {
  const [selectedType, setSelectedType] = useState(null);
    const { updateUser, clearUser, userData } = useAuth()
    const navigate = useNavigate()

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    country: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateUserInfo, { loading }] = useMutation(UpdateUserMutation);
  

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = formData.businessName && formData.description && formData.address && formData.country;


  console.log(userData);
  

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
        navigate(`/dashboard/${user?.firstName || 'client'}`);
        toast.success(message);
      })
      .catch((err) => {
        toast.error(err?.message);
      })
    } else {
    updateUserInfo({
        variables: {
        data: {
            businessData: formData,
            userType: selectedType.toUpperCase(),
        }
        }
        })
        .then(({ data }) => {
            const { message, user } = data?.updateUser || {};
            navigate(`/dashboard/${user?.firstName || 'client'}`);
            toast.success(message);
        })
        .catch((err) => {
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
                      onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all duration-300"
                      placeholder="Enter your full business address"
                      required
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
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
                    disabled={loading}
                    className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                      selectedType && !loading
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105'
                        : 'bg-white/10 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
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