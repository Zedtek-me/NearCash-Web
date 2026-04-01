import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Hash, Building2, ArrowRight, Lock, Info, BadgeCheck, Phone, Globe } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { useNavigate, useLocation } from 'react-router';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { UpdateUserMutation } from './mutations/userMutations';

export default function KYCPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  const userType = (location.state?.userType || userData?.userType || 'CLIENT').toUpperCase();
  const isVendor = userType === 'VENDOR';

  const [formData, setFormData] = useState({
    phoneNumber: '',
    bvn: '',
    nin: '',
    country: '',
    remittanceBankName: '',
    remittanceBankCode: '',
    remittanceAccountNumber: '',
  });

  const [updateUserInfo, { loading }] = useMutation(UpdateUserMutation);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const bvnValid = formData.bvn.length === 0 || formData.bvn.length === 11;
  const ninValid = formData.nin.length === 0 || formData.nin.length === 11;
  const atLeastOneId = formData.bvn.length === 11 || formData.nin.length === 11;
  const identityValid = formData.phoneNumber.trim().length >= 10 && bvnValid && ninValid && atLeastOneId
    && (!isVendor ? formData.country.trim().length > 0 : true);
  const bankValid = !isVendor || (
    formData.remittanceBankName.trim() &&
    formData.remittanceBankCode.trim() &&
    formData.remittanceAccountNumber.length === 10
  );
  const isFormValid = identityValid && bankValid;

  const handleSubmit = () => {
    if (!isFormValid) return;

    const data = {
      phoneNumber: formData.phoneNumber,
      bvn: formData.bvn,
      nin: formData.nin,
      ...(!isVendor && formData.country && { country: formData.country }),
      ...(isVendor && {
        remittanceBankName: formData.remittanceBankName,
        remittanceBankCode: formData.remittanceBankCode,
        remittanceAccountNumber: formData.remittanceAccountNumber,
      }),
    };

    updateUserInfo({ variables: { data } })
      .then(({ data: res }) => {
        const { message } = res?.updateUser || {};
        toast.success(message || 'Verification complete');
        navigate(`/dashboard/${userType.toLowerCase()}`);
      })
      .catch((err) => {
        toast.error(err?.message);
      });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-white/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center mb-7">
            <div className="absolute w-28 h-28 bg-white/5 rounded-full blur-2xl" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-white/15 to-white/5 border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Identity Verification
          </h1>
          <p className="text-gray-500 text-sm">
            Step {isVendor ? '3' : '2'} of {isVendor ? '3' : '2'} &mdash; Almost there
          </p>
        </div>

        {/* Context note */}
        <div className="mb-6 bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex gap-4 items-start">
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-gray-300" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-1">Why we need this</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isVendor
                ? 'We need either your BVN or NIN to verify your identity — you don\'t have to provide both. Your bank details will be used exclusively to settle earnings from completed transactions through our escrow provider.'
                : 'We need either your BVN or NIN to verify your identity — you don\'t have to provide both. This keeps your account secure and ensures smooth transaction processing on the platform.'}
            </p>
          </div>
        </div>

        {/* Identity card */}
        <div className="bg-white/[0.04] backdrop-blur-lg border border-gray-800 rounded-3xl p-7 mb-4">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Identity Details</p>
                <p className="text-gray-600 text-xs">Provide at least one &mdash; encrypted and stored securely</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <Lock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Secured</span>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2.5">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                Phone Number
              </label>
              <input
                type="text"
                inputMode="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full px-5 py-4 bg-black/60 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors duration-200 text-sm"
                placeholder="e.g. 08012345678"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2.5">
                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                Bank Verification Number (BVN)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={formData.bvn}
                onChange={(e) => handleInputChange('bvn', e.target.value.replace(/\D/g, ''))}
                className="w-full px-5 py-4 bg-black/60 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors duration-200 text-sm tracking-[0.2em]"
                placeholder="Enter your 11-digit BVN"
              />
              {formData.bvn.length > 0 && formData.bvn.length !== 11 && (
                <p className="text-xs text-red-400 mt-1.5 ml-1">BVN must be exactly 11 digits</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2.5">
                <Hash className="w-3.5 h-3.5 text-gray-500" />
                National Identification Number (NIN)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={formData.nin}
                onChange={(e) => handleInputChange('nin', e.target.value.replace(/\D/g, ''))}
                className="w-full px-5 py-4 bg-black/60 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors duration-200 text-sm tracking-[0.2em]"
                placeholder="Enter your 11-digit NIN"
              />
              {formData.nin.length > 0 && formData.nin.length !== 11 && (
                <p className="text-xs text-red-400 mt-1.5 ml-1">NIN must be exactly 11 digits</p>
              )}
            </div>

            {!isVendor && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2.5">
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-5 py-4 bg-black/60 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors duration-200 text-sm"
                  placeholder="e.g. Nigeria"
                />
              </div>
            )}
          </div>
        </div>

        {/* Settlement card — vendors only */}
        {isVendor && (
          <div className="bg-white/[0.04] backdrop-blur-lg border border-gray-800 rounded-3xl p-7 mb-4">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Settlement Account</p>
                <p className="text-gray-600 text-xs">Where your transaction earnings will be sent</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2.5">Bank Name</label>
                <input
                  type="text"
                  value={formData.remittanceBankName}
                  onChange={(e) => handleInputChange('remittanceBankName', e.target.value)}
                  className="w-full px-5 py-4 bg-black/60 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors duration-200 text-sm"
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2.5">Bank Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.remittanceBankCode}
                    onChange={(e) => handleInputChange('remittanceBankCode', e.target.value)}
                    className="w-full px-5 py-4 bg-black/60 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors duration-200 text-sm"
                    placeholder="e.g. 011"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2.5">Account Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.remittanceAccountNumber}
                    onChange={(e) => handleInputChange('remittanceAccountNumber', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-5 py-4 bg-black/60 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors duration-200 text-sm tracking-[0.2em]"
                    placeholder="10-digit number"
                  />
                  {formData.remittanceAccountNumber.length > 0 && formData.remittanceAccountNumber.length !== 10 && (
                    <p className="text-xs text-red-400 mt-1.5 ml-1">Must be 10 digits</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className={`w-full py-4 px-8 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 ${
              isFormValid && !loading
                ? 'bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10 hover:scale-[1.02]'
                : 'bg-white/8 text-gray-600 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Complete Verification
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-center text-gray-700 text-xs mt-4">
            Your data is encrypted end-to-end and never shared with third parties.
          </p>
        </div>

      </div>
    </div>
  );
}
