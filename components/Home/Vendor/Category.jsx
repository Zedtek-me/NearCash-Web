import React, { useState } from 'react';
import { Plus, Users, Tag, UserPlus, X, ChevronDown, Search, Edit, Trash2, CheckCircle } from 'lucide-react';
import Navbar from '../Navs/Headers';
import { ADD_CLIENTS_TO_CATEGORY, CREATE_CLIENT_CATEGORY } from '../../Auths/mutations/userMutations';
import { FETCH_BUSINESS_CLIENTS, FETCH_TRANSACTION_POLICIES, GET_CATEGORIES } from '../../Auths/queries/userQueries';
import { useMutation, useQuery } from '@apollo/client';
import useAuth from '../../../Hooks/Auths';
import { getItemFromLocalStorage } from '../../../utils/helpers';
import { useStateValue } from '../../../providers/stateProvider';

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { userData } = useAuth();
  const [
    {
      businessStates: { selectedBusiness }
    },
    dispatch
  ] = Object.values(useStateValue())

  const vendorBusinessId = selectedBusiness ?? getItemFromLocalStorage('selected_business');
  

  const { data: policiesData } = useQuery(FETCH_TRANSACTION_POLICIES, {
    variables: { businessId: vendorBusinessId, pageCount: 20, pageNumber: 1 },
  });

  const { data: clientsData } = useQuery(FETCH_BUSINESS_CLIENTS, {
    variables: { businessId: vendorBusinessId },
  });

  const {
    data: categoriesData,
    refetch: refetchCategories
  } = useQuery(GET_CATEGORIES, {
    variables: {
      businessId: vendorBusinessId
    },
    onCompleted: (data) => {
      console.log("Fetched categories data: ", data);
      setCategories(data?.categories || []);
    },
    onError: (err) => {
      console.error("Error fetching categories:", err);
    }
  })

  console.log("categoriesData:::: ", categoriesData)

  const [createCategory, { loading: creatingCategory }] = useMutation(CREATE_CLIENT_CATEGORY);
  const [addClients, { loading: addingClients }] = useMutation(ADD_CLIENTS_TO_CATEGORY);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    transactionPolicyId: ''
  });

  const [clientFormData, setClientFormData] = useState({
    clientIds: [],
    categoryId: ''
  });

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  

 const handleCreateCategory = async () => {
    try {
      const { data } = await createCategory({
        variables: {
          businessId: vendorBusinessId,
          categoryInfo: {
            ...categoryFormData,
            transactionPolicyId: categoryFormData.transactionPolicyId,
          },
        },
      });
      console.log("category created::::: ", data?.createCategory?.category)
      if (data?.createClientCategory?.category) {
        setCategories(prev => [data.createClientCategory.category, ...prev]);
        setCategoryFormData({ name: "", description: "", transactionPolicyId: "" });
        setShowCategoryForm(false);
      }
    } catch (err) {
      console.error("Error creating category:", err);
    }
  };

 const handleAddClients = async () => {
    try {
      const { data } = await addClients({
        variables: {
          data: {
            clientIds: clientFormData.clientIds,
            categoryId: clientFormData.categoryId,
            businessId: vendorBusinessId,
          },
        },
      });

      if (data?.addClientsToACategory?.categoryClients.length > 0) {
        const updatedClients = data.addClientsToACategory.categoryClients.map(c => ({
          id: c.client.id,
          fullName: `${c.client.firstName} ${c.client.lastName}`,
          email: c.client.email,
        }));

        setCategories(prev =>
          prev.map(cat =>
            cat.id === clientFormData.categoryId
              ? { ...cat, businessclientSet: [...(cat.businessclientSet || []), ...updatedClients] }
              : cat
          )
        );

        setShowClientForm(false);
        setClientFormData({ clientIds: [], categoryId: "" })
        refetchCategories();
      }
    } catch (err) {
      console.error("Error adding clients:", err);
    }
  };


  const toggleClientSelection = (clientId) => {
    setClientFormData(prev => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter(id => id !== clientId)
        : [...prev.clientIds, clientId]
    }));
  };

  const removeClientFromCategory = (categoryId, clientId) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          busineessclientSet: category?.businessclientSet?.filter(c => c.id !== clientId)
        };
      }
      return category;
    }));
  };

  const deleteCategory = (categoryId) => {
    setCategories(prev => prev.filter(category => category.id !== categoryId));
  };

  const openAddClientsForm = (category) => {
    setSelectedCategory(category);
    setClientFormData({
      clientIds: [],
      categoryId: category.id
    });
    setShowClientForm(true);
  };

  const getPolicyName = (policyId) => {
    const policy = transactionPolicies.find(p => p.id === policyId);
    return policy ? policy.name : 'Unknown Policy';
  };

  const transactionPolicies = policiesData?.businessTransactionPolicies || [];
  const availableClients = clientsData?.businessClients?.map(c => ({
    id: c.client.id,
    name: `${c.client.firstName} ${c.client.lastName}`,
    email: c.client.email,
  })) || [];

  const filteredClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  return (
    <>
     <div className="min-h-screen bg-white">
      <Navbar />

         <div className=" bg-white text-black">

      <div className=" border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 ">Categories</h1>
                <p className="text-gray-400 text-sm sm:text-base">Organize your clients into categories</p>
              </div>
            </div>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900  text-white rounded-xl font-medium hover:bg-gray-500 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Category
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`transition-all duration-500 ease-in-out ${showCategoryForm ? 'opacity-100 max-h-screen mb-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="bg-white px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900 ">Create New Category</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 placeholder-gray-500"
                    placeholder="Enter category name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="transactionPolicyId" className="block text-sm font-medium text-gray-300">
                    Transaction Policy
                  </label>
                  <select
                    id="transactionPolicyId"
                    name="transactionPolicyId"
                    value={categoryFormData.transactionPolicyId}
                    onChange={handleCategoryInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select a policy</option>
                    {transactionPolicies.map(policy => (
                      <option key={policy.id} value={policy.id}>{policy.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-black border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 resize-none placeholder-gray-500"
                  placeholder="Describe the category..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateCategory}
                  //disabled={isSubmitting || !categoryFormData.name || !categoryFormData.transactionPolicyId}
                  className="flex-1 sm:flex-none px-8 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Create Category
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`transition-all duration-500 ease-in-out ${showClientForm ? 'opacity-100 max-h-screen mb-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="bg-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">
                Add Clients to "{selectedCategory?.name}"
              </h2>
              <button
                onClick={() => setShowClientForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-black border border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 placeholder-gray-500"
                  placeholder="Search clients..."
                />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredClients.map(client => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-black border border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={clientFormData.clientIds.includes(client.id)}
                      onChange={() => toggleClientSelection(client.id)}
                      className="w-5 h-5 rounded border-gray-600 text-white focus:ring-white focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{client.name}</div>
                      <div className="text-sm text-gray-400">{client.email}</div>
                    </div>
                  </label>
                ))}
              </div>

              {clientFormData.clientIds.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-300 mb-2">
                    Selected: {clientFormData.clientIds.length} client{clientFormData.clientIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddClients}
                  disabled={isSubmitting || clientFormData.clientIds.length === 0}
                  className="flex-1 sm:flex-none px-8 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Add Clients ({clientFormData.clientIds.length})
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Categories</h2>
            <div className="text-sm text-gray-400">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No categories created yet</h3>
              <p className="text-gray-400 mb-6">Create your first category to organize your clients</p>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Create First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transform hover:scale-105 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <Tag className="w-5 h-5 text-black" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{category?.name}</h3>
                          <p className="text-sm text-gray-400">Category #{category?.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-gray-300 mb-4">{category?.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">
                          Policy: {getPolicyName(category?.txnPolicy?.id)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">
                            {category?.businessclientSet?.length} client{category?.businessclientSet?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => openAddClientsForm(category)}
                          className="text-sm text-white hover:text-gray-300 font-medium transition-colors"
                        >
                          Add Clients
                        </button>
                      </div>
                    </div>

                    {category?.businessclientSet.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Clients:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {category.businessclientSet.map(client => (
                             <div key={client.id} className="flex items-center justify-between p-2 bg-black rounded-lg">
                              <div>
                                <div className="text-sm font-medium text-white">{client?.client?.fullName}</div>
                                <div className="text-xs text-gray-400">{client?.client?.email}</div>
                              </div>
                              <button
                                onClick={() => removeClientFromCategory(category.id, client.id)}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500">
                        Created {new Date(category?.dateCreated).toLocaleDateString()}
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
    </>
    
  );
};

export default CategoryManagementPage;