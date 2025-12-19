import React, { useState } from 'react';
import { Plus, FileText, DollarSign, MapPin, Store, Users, Edit, Trash2, CheckCircle } from 'lucide-react';
import Navbar from '../Navs/Headers';
import { CREATE_TRANSACTION_POLICY } from '../../Auths/mutations/userMutations';
import useAuth from '../../../Hooks/Auths';
import { useMutation, useQuery } from '@apollo/client';
import { FETCH_TRANSACTION_POLICIES } from '../../Auths/queries/userQueries';
import toast from 'react-hot-toast';

const TransactionPolicyPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cashCollectionMode: 'STORE_WALK_IN',
    meetUpCharge: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
    const { userData } = useAuth();

  
  let vendorBusinessId = userData?.businesses?.find(item => Object.is(item.isPrimary, true))?.id;
  const [
    {
      businessStates: { selectedBusiness }
    },
    dispatch
  ] = Object.values(useStateValue())

  vendorBusinessId = (selectedBusiness || vendorBusinessId)

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const { data, loading, error, refetch } = useQuery(FETCH_TRANSACTION_POLICIES, {
    variables: { businessId:  vendorBusinessId, pageCount: 10, pageNumber: 1 },
    fetchPolicy: "network-only",
  });

  const policies = data?.businessTransactionPolicies || [];


  const [createPolicy, { loading: creating }] = useMutation(CREATE_TRANSACTION_POLICY);

  // const handleSubmit = async () => {
  //   if (!formData.name) return;
  //   setIsSubmitting(true);
    
  //   await new Promise(resolve => setTimeout(resolve, 1000));
    
  //   const newPolicy = {
  //     id: Date.now(),
  //     businessId: "12",
  //     data: {
  //       ...formData,
  //       meetUpCharge: formData.meetUpCharge ? parseFloat(formData.meetUpCharge) : 0
  //     },
  //     createdAt: new Date().toISOString()
  //   };
    
  //   setPolicies(prev => [newPolicy, ...prev]);
  //   setFormData({
  //     name: '',
  //     description: '',
  //     cashCollectionMode: 'STORE_WALK_IN',
  //     meetUpCharge: ''
  //   });
  //   setShowForm(false);
  //   setIsSubmitting(false);
  // };

  // const deletePolicy = (id) => {
  //   setPolicies(prev => prev.filter(policy => policy.id !== id));
  // };

  const handleSubmit = async () => {
    console.log(formData);
    
  if (!formData.name) {
    toast.error("Policy name is required.");
    return;
  }

  try {

    const { data } = await createPolicy({
      variables: {
        businessId: vendorBusinessId,
        data: {
          ...formData,
          meetUpCharge: formData.meetUpCharge
            ? parseFloat(formData.meetUpCharge)
            : 0,
        },
      },
    });

    if (data?.createTransactionPolicy?.policy) {
      setFormData({
        name: "",
        description: "",
        cashCollectionMode: "STORE_WALK_IN",
        meetUpCharge: "",
      });
      refetch()
      toast.success("Policy created successfully!");
      setShowForm(false);
    }
  } catch (err) {
    console.error("Error creating policy:", err);
  }
};
  const getCashCollectionModeDisplay = (mode) => {
    switch(mode) {
      case 'STORE_WALK_IN':
        return 'Store Walk-in';
      case 'MEET_UP_AND_STORE_WALK_IN':
        return 'Meet-up & Store Walk-in';
      case 'MEET_UP':
        return 'Meet-up Only';
      default:
        return mode;
    }
  };

  const getCashCollectionModeIcon = (mode) => {
    switch(mode) {
      case 'STORE_WALK_IN':
        return <Store className="w-4 h-4" />;
      case 'MEET_UP_AND_STORE_WALK_IN':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Store className="w-4 h-4" />;
    }
  };

  return (
   <div className="min-h-screen bg-white">
      <Navbar />

     <div className=" bg-white">
      <div className="bg-white backdrop-blur-sm border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-900 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction Policies</h1>
                <p className="text-slate-600 text-sm sm:text-base">Manage your business transaction policies</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-900 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Policy
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`transition-all duration-500 ease-in-out ${showForm ? 'opacity-100 max-h-screen mb-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Create New Policy</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter policy name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cashCollectionMode" className="block text-sm font-medium text-slate-700">
                    Cash Collection Mode
                  </label>
                  <select
                    id="cashCollectionMode"
                    name="cashCollectionMode"
                    value={formData.cashCollectionMode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="STORE_WALK_IN">Store Walk-in</option>
                    <option value="MEET_UP_AND_STORE_WALK_IN">Meet-up & Store Walk-in</option>
                    <option value="MEET_UP">Meet-up Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe the policy details..."
                />
              </div>

              {formData.cashCollectionMode === 'MEET_UP_AND_STORE_WALK_IN' && (
                <div className="space-y-2 animate-fadeIn">
                  <label htmlFor="meetUpCharge" className="block text-sm font-medium text-slate-700">
                    Meet-up Charge ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      id="meetUpCharge"
                      name="meetUpCharge"
                      value={formData.meetUpCharge}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={creating}
                  className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {creating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Create Policy
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Active Policies</h2>
            <div className="text-sm text-slate-500">
              {policies?.length} {policies?.length === 1 ? 'policy' : 'policies'}
            </div>
          </div>

          { loading ? (
          <p className="text-gray-500">Loading policies...</p>
        ) : policies?.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800  shadow-lg  p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No policies created yet</h3>
              <p className="text-slate-300 mb-6">Create your first transaction policy to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Create First Policy
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-gray-900 rounded-2xl border border-gray-800  shadow-lg overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100 text-lg">{policy?.name}</h3>
                          <p className="text-sm text-slate-300">Policy #{policy?.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePolicy(policy?.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-slate-200 mb-4 line-clamp-3">{policy?.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        {getCashCollectionModeIcon(policy?.cashCollectionMode)}
                        <span className="text-sm font-medium text-slate-700">
                          {getCashCollectionModeDisplay(policy.cashCollectionMode)}
                        </span>
                      </div>

                      {policy?.meetUpCharge > 0 && (
                        <div className="flex items-center gap-2 p-3  rounded-lg">
                          <DollarSign className="w-4 h-4 text-gray-200" />
                          <span className="text-sm font-medium text-gray-300">
                            Meet-up Charge: ${policy?.meetUpCharge}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-200">
                        Created {new Date(policy.dateCreated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
   </div>
  );
};

export default TransactionPolicyPage;