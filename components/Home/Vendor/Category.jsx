import React, { useState } from 'react';
import { Plus, Users, Tag, UserPlus, X, Search, Trash2, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import Navbar from '../Navs/Headers';
import { ADD_CLIENTS_TO_CATEGORY, CREATE_CLIENT_CATEGORY } from '../../Auths/mutations/userMutations';
import { FETCH_BUSINESS_CLIENTS, FETCH_TRANSACTION_POLICIES, GET_CATEGORIES } from '../../Auths/queries/userQueries';
import { useMutation, useQuery } from '@apollo/client';
import useAuth from '../../../hooks/useAuth';
import { getItemFromLocalStorage } from '../../../utils/helpers';
import { useStateValue } from '../../../providers/stateProvider';

// ── Avatar initials helper ────────────────────────────────────────────────────

function Avatar({ name, size = 'sm' }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${dim} rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showClientForm, setShowClientForm]     = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCards, setExpandedCards]       = useState({});

  const { userData } = useAuth();
  const [{ businessStates: { selectedBusiness } }] = Object.values(useStateValue());
  const vendorBusinessId = selectedBusiness ?? getItemFromLocalStorage('selected_business');

  const { data: policiesData } = useQuery(FETCH_TRANSACTION_POLICIES, {
    variables: { businessId: vendorBusinessId, pageCount: 20, pageNumber: 1 },
  });

  const { data: clientsData } = useQuery(FETCH_BUSINESS_CLIENTS, {
    variables: { businessId: vendorBusinessId },
  });

  const { refetch: refetchCategories } = useQuery(GET_CATEGORIES, {
    variables: { businessId: vendorBusinessId },
    onCompleted: (data) => setCategories(data?.categories || []),
  });

  const [createCategory, { loading: creatingCategory }] = useMutation(CREATE_CLIENT_CATEGORY);
  const [addClients,     { loading: addingClients }]    = useMutation(ADD_CLIENTS_TO_CATEGORY);

  const [categoryFormData, setCategoryFormData] = useState({
    name:               '',
    description:        '',
    transactionPolicyId:'',
  });

  const [clientFormData, setClientFormData] = useState({ clientIds: [], categoryId: '' });
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCategory = async () => {
    try {
      const { data } = await createCategory({
        variables: {
          businessId: vendorBusinessId,
          categoryInfo: { ...categoryFormData },
        },
      });
      if (data?.createClientCategory?.category) {
        setCategories(prev => [data.createClientCategory.category, ...prev]);
        setCategoryFormData({ name: '', description: '', transactionPolicyId: '' });
        setShowCategoryForm(false);
      }
    } catch (err) {
      toast?.error(err?.message || 'Failed to create category');
    }
  };

  const handleAddClients = async () => {
    try {
      const { data } = await addClients({
        variables: {
          data: {
            clientIds:  clientFormData.clientIds,
            categoryId: clientFormData.categoryId,
            businessId: vendorBusinessId,
          },
        },
      });
      if (data?.addClientsToACategory?.categoryClients.length > 0) {
        const updatedClients = data.addClientsToACategory.categoryClients.map(c => ({
          id:       c.client.id,
          fullName: `${c.client.firstName} ${c.client.lastName}`,
          email:    c.client.email,
        }));
        setCategories(prev =>
          prev.map(cat =>
            cat.id === clientFormData.categoryId
              ? { ...cat, businessclientSet: [...(cat.businessclientSet || []), ...updatedClients] }
              : cat
          )
        );
        setShowClientForm(false);
        setClientFormData({ clientIds: [], categoryId: '' });
        refetchCategories();
      }
    } catch (err) {
      toast?.error(err?.message || 'Failed to add clients');
    }
  };

  const toggleClientSelection = (clientId) => {
    setClientFormData(prev => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter(id => id !== clientId)
        : [...prev.clientIds, clientId],
    }));
  };

  const removeClientFromCategory = (categoryId, clientId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, businessclientSet: cat.businessclientSet?.filter(c => c.id !== clientId) };
    }));
  };

  const deleteCategory = (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const openAddClientsForm = (category) => {
    setSelectedCategory(category);
    setClientFormData({ clientIds: [], categoryId: category.id });
    setShowClientForm(true);
    setShowCategoryForm(false);
  };

  const toggleCardExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const transactionPolicies = policiesData?.businessTransactionPolicies || [];
  const getPolicyName = (policyId) => transactionPolicies.find(p => p.id === policyId)?.name || 'Unknown Policy';

  const availableClients = clientsData?.businessClients?.map(c => ({
    id:    c.client.id,
    name:  `${c.client.firstName} ${c.client.lastName}`,
    email: c.client.email,
  })) || [];

  const filteredClients = availableClients.filter(c =>
    c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userData} />

      {/* ── Page header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 mt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <Tag size={20} className="text-slate-200" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Categories</h1>
                <p className="text-slate-400 text-sm mt-0.5">Organise your clients into groups</p>
              </div>
            </div>
            <button
              onClick={() => { setShowCategoryForm(v => !v); setShowClientForm(false); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              {showCategoryForm ? <ChevronUp size={16} /> : <Plus size={16} />}
              {showCategoryForm ? 'Hide Form' : 'Create Category'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Create category form ── */}
        <div className={`transition-all duration-400 ease-in-out ${showCategoryForm ? 'opacity-100 max-h-[600px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">New Category</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Category Name</label>
                  <input
                    type="text" name="name" value={categoryFormData.name}
                    onChange={handleCategoryInputChange} placeholder="e.g. Premium Clients"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Transaction Policy</label>
                  <select
                    name="transactionPolicyId" value={categoryFormData.transactionPolicyId}
                    onChange={handleCategoryInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all bg-white"
                  >
                    <option value="">Select a policy</option>
                    {transactionPolicies.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                <textarea
                  name="description" value={categoryFormData.description}
                  onChange={handleCategoryInputChange} rows={3}
                  placeholder="Describe this category…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCreateCategory} disabled={creatingCategory}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {creatingCategory ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                  ) : (
                    <><CheckCircle size={15} /> Create Category</>
                  )}
                </button>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Add clients form ── */}
        <div className={`transition-all duration-400 ease-in-out ${showClientForm ? 'opacity-100 max-h-[700px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Add Clients to <span className="text-emerald-600">"{selectedCategory?.name}"</span>
                </h2>
              </div>
              <button
                onClick={() => setShowClientForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm outline-none transition-all"
                />
              </div>

              {/* Client list */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {filteredClients.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No clients found</p>
                ) : filteredClients.map(client => {
                  const checked = clientFormData.clientIds.includes(client.id);
                  return (
                    <label
                      key={client.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        checked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox" checked={checked}
                        onChange={() => toggleClientSelection(client.id)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <Avatar name={client.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                        <p className="text-xs text-gray-400 truncate">{client.email}</p>
                      </div>
                      {checked && <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />}
                    </label>
                  );
                })}
              </div>

              {clientFormData.clientIds.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <Users size={14} className="text-emerald-500" />
                  <span className="text-xs text-emerald-700 font-medium">
                    {clientFormData.clientIds.length} client{clientFormData.clientIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              )}

              <button
                onClick={handleAddClients}
                disabled={addingClients || clientFormData.clientIds.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingClients ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</>
                ) : (
                  <><UserPlus size={15} /> Add Clients ({clientFormData.clientIds.length})</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Categories list ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Your Categories</h2>
            <span className="text-xs text-gray-400">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No categories yet</h3>
              <p className="text-xs text-gray-400 mb-5">Create your first category to organise your clients</p>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus size={15} /> Create First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {categories.map((category) => {
                const clientCount = category.businessclientSet?.length || 0;
                const expanded    = expandedCards[category.id];
                return (
                  <div
                    key={category.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Top accent */}
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 flex-shrink-0 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <Tag size={16} className="text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{category.name}</h3>
                            <p className="text-xs text-gray-400 font-mono truncate">#{category.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Description */}
                      {category.description && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{category.description}</p>
                      )}

                      {/* Meta pills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-medium">
                          <CheckCircle size={11} />
                          {getPolicyName(category.txnPolicy?.id)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 text-gray-600 border border-gray-100 rounded-lg text-xs font-medium">
                          <Users size={11} />
                          {clientCount} {clientCount === 1 ? 'client' : 'clients'}
                        </span>
                      </div>

                      {/* Clients list */}
                      {clientCount > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => toggleCardExpand(category.id)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium mb-2 transition-colors"
                          >
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {expanded ? 'Hide' : 'Show'} clients
                          </button>
                          {expanded && (
                            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                              {category.businessclientSet.map(item => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100"
                                >
                                  <Avatar name={item?.client?.fullName} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{item?.client?.fullName}</p>
                                    <p className="text-xs text-gray-400 truncate">{item?.client?.email}</p>
                                  </div>
                                  <button
                                    onClick={() => removeClientFromCategory(category.id, item.id)}
                                    className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400">
                          {new Date(category.dateCreated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <button
                          onClick={() => openAddClientsForm(category)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <UserPlus size={12} /> Add Clients
                        </button>
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

export default CategoryManagementPage;
