import React, { useState } from 'react';
import {
  Plus, FileText, MapPin, Store, CheckCircle, ChevronUp,
  Banknote, Pencil, X, Ruler, ArrowDownToLine,
} from 'lucide-react';
import Navbar from '../Navs/Headers';
import { CREATE_TRANSACTION_POLICY, UPDATE_TRANSACTION_POLICY } from '../../Auths/mutations/userMutations';
import useAuth from '../../../hooks/useAuth';
import { useMutation, useQuery } from '@apollo/client';
import { FETCH_TRANSACTION_POLICIES } from '../../Auths/queries/userQueries';
import toast from 'react-hot-toast';
import { useStateValue } from '../../../providers/stateProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MODE_LABELS = {
  STORE_WALK_IN:            'Store Walk-in',
  MEET_UP_AND_STORE_WALK_IN:'Meet-up & Walk-in',
  MEET_UP:                  'Meet-up Only',
};

const MODE_COLORS = {
  STORE_WALK_IN:            'bg-teal-50 text-teal-700 border-teal-100',
  MEET_UP_AND_STORE_WALK_IN:'bg-emerald-50 text-emerald-700 border-emerald-100',
  MEET_UP:                  'bg-sky-50 text-sky-700 border-sky-100',
};

const MODE_ICONS = {
  STORE_WALK_IN:            Store,
  MEET_UP_AND_STORE_WALK_IN:MapPin,
  MEET_UP:                  MapPin,
};

const EMPTY_FORM = {
  name:                '',
  description:         '',
  cashCollectionMode:  'STORE_WALK_IN',
  meetUpCharge:        '',
  maxDeliveryAmount:   '',
  maxDeliveryDistance: '',
};

const isMeetUpMode = (mode) =>
  mode === 'MEET_UP' || mode === 'MEET_UP_AND_STORE_WALK_IN';

// ── Main component ────────────────────────────────────────────────────────────

const TransactionPolicyPage = () => {
  const [showForm, setShowForm]         = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null); // null = create, object = edit
  const [formData, setFormData]         = useState(EMPTY_FORM);

  const { userData } = useAuth();
  let vendorBusinessId = userData?.businesses?.find(item => item.isPrimary)?.id;

  const [{ businessStates: { selectedBusiness } }] = Object.values(useStateValue());
  vendorBusinessId = selectedBusiness || vendorBusinessId;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setEditingPolicy(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      name:                policy.name || '',
      description:         policy.description || '',
      cashCollectionMode:  policy.cashCollectionMode || 'STORE_WALK_IN',
      meetUpCharge:        policy.meetUpCharge != null ? String(policy.meetUpCharge) : '',
      maxDeliveryAmount:   policy.maxDeliveryAmount != null ? String(policy.maxDeliveryAmount) : '',
      maxDeliveryDistance: policy.maxDeliveryDistance != null ? String(policy.maxDeliveryDistance) : '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPolicy(null);
    setFormData(EMPTY_FORM);
  };

  const { data, loading, refetch } = useQuery(FETCH_TRANSACTION_POLICIES, {
    variables: { businessId: vendorBusinessId, pageCount: 10, pageNumber: 1 },
    fetchPolicy: 'network-only',
  });

  const policies = data?.businessTransactionPolicies || [];

  const [createPolicy, { loading: creating }] = useMutation(CREATE_TRANSACTION_POLICY);
  const [updatePolicy, { loading: updating }] = useMutation(UPDATE_TRANSACTION_POLICY);

  const buildMutationData = () => ({
    name:               formData.name,
    description:        formData.description,
    cashCollectionMode: formData.cashCollectionMode,
    meetUpCharge:       formData.meetUpCharge ? parseFloat(formData.meetUpCharge) : 0,
    ...(isMeetUpMode(formData.cashCollectionMode) && {
      maxDeliveryAmount:   formData.maxDeliveryAmount   ? parseFloat(formData.maxDeliveryAmount)   : null,
      maxDeliveryDistance: formData.maxDeliveryDistance ? parseFloat(formData.maxDeliveryDistance) : null,
    }),
  });

  const handleSubmit = async () => {
    if (!formData.name) { toast.error('Policy name is required.'); return; }

    try {
      if (editingPolicy) {
        const { data: res } = await updatePolicy({
          variables: { policyId: editingPolicy.id, data: buildMutationData() },
        });
        if (res?.updateTransactionPolicy?.policy) {
          refetch();
          toast.success('Policy updated successfully!');
          closeForm();
        }
      } else {
        const { data: res } = await createPolicy({
          variables: { businessId: vendorBusinessId, data: buildMutationData() },
        });
        if (res?.createTransactionPolicy?.policy) {
          refetch();
          toast.success('Policy created successfully!');
          closeForm();
        }
      }
    } catch (err) {
      toast.error(err?.message || `Failed to ${editingPolicy ? 'update' : 'create'} policy`);
    }
  };

  const submitting = creating || updating;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userData} />

      {/* ── Page header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 mt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <FileText size={20} className="text-slate-200" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Transaction Policies</h1>
                <p className="text-slate-400 text-sm mt-0.5">Manage your business transaction policies</p>
              </div>
            </div>
            <button
              onClick={showForm ? closeForm : openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
              {showForm ? 'Hide Form' : 'Create Policy'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Create / Edit form ── */}
        <div className={`transition-all duration-300 ease-in-out ${showForm ? 'opacity-100 max-h-[900px] mb-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                {editingPolicy ? `Editing: ${editingPolicy.name}` : 'New Policy'}
              </h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Row 1: Name + Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Policy Name</label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleInputChange}
                    placeholder="e.g. Standard Walk-in Policy"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Cash Collection Mode</label>
                  <select
                    name="cashCollectionMode" value={formData.cashCollectionMode} onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all bg-white"
                  >
                    <option value="STORE_WALK_IN">Store Walk-in</option>
                    <option value="MEET_UP_AND_STORE_WALK_IN">Meet-up &amp; Store Walk-in</option>
                    <option value="MEET_UP">Meet-up Only</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleInputChange}
                  rows={3} placeholder="Describe the policy details…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all resize-none"
                />
              </div>

              {/* Meet-up fields — shown only when mode involves meet-up */}
              {isMeetUpMode(formData.cashCollectionMode) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Meet-up Charge (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₦</span>
                      <input
                        type="number" name="meetUpCharge" value={formData.meetUpCharge}
                        onChange={handleInputChange} min="0" step="0.01" placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Max Delivery Amount (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₦</span>
                      <input
                        type="number" name="maxDeliveryAmount" value={formData.maxDeliveryAmount}
                        onChange={handleInputChange} min="0" step="1" placeholder="e.g. 50000"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Max Delivery Distance (km)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">km</span>
                      <input
                        type="number" name="maxDeliveryDistance" value={formData.maxDeliveryDistance}
                        onChange={handleInputChange} min="0" step="0.1" placeholder="e.g. 5"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {editingPolicy ? 'Saving…' : 'Creating…'}</>
                  ) : (
                    <><CheckCircle size={15} /> {editingPolicy ? 'Save Changes' : 'Create Policy'}</>
                  )}
                </button>
                <button
                  type="button" onClick={closeForm}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Policies list ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Active Policies</h2>
            <span className="text-xs text-gray-400">{policies.length} {policies.length === 1 ? 'policy' : 'policies'}</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              Loading policies…
            </div>
          ) : policies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No policies yet</h3>
              <p className="text-xs text-gray-400 mb-5">Create your first transaction policy to get started</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus size={15} /> Create First Policy
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {policies.map((policy) => {
                const ModeIcon  = MODE_ICONS[policy.cashCollectionMode] || Store;
                const modeColor = MODE_COLORS[policy.cashCollectionMode] || 'bg-gray-50 text-gray-600 border-gray-100';
                const meetUp    = isMeetUpMode(policy.cashCollectionMode);
                return (
                  <div
                    key={policy.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 flex-shrink-0 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <FileText size={16} className="text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{policy.name}</h3>
                            <p className="text-xs text-gray-400 font-mono truncate">#{policy.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openEdit(policy)}
                          className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                          title="Edit policy"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>

                      {/* Description */}
                      {policy.description && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{policy.description}</p>
                      )}

                      {/* Tags / detail rows */}
                      <div className="space-y-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${modeColor}`}>
                          <ModeIcon size={12} />
                          {MODE_LABELS[policy.cashCollectionMode] || policy.cashCollectionMode}
                        </span>

                        {meetUp && policy.meetUpCharge > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Banknote size={13} className="text-gray-400" />
                            Meet-up charge: <span className="font-medium text-gray-700">₦{Number(policy.meetUpCharge).toLocaleString()}</span>
                          </div>
                        )}

                        {meetUp && policy.maxDeliveryAmount != null && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <ArrowDownToLine size={13} className="text-gray-400" />
                            Max delivery: <span className="font-medium text-gray-700">₦{Number(policy.maxDeliveryAmount).toLocaleString()}</span>
                          </div>
                        )}

                        {meetUp && policy.maxDeliveryDistance != null && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Ruler size={13} className="text-gray-400" />
                            Max distance: <span className="font-medium text-gray-700">{policy.maxDeliveryDistance} km</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400">
                          Created {new Date(policy.dateCreated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionPolicyPage;
