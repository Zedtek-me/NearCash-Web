import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowRight, Plus, MapPin, ArrowLeft, SwitchCamera, Pencil,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@apollo/client";
import toast from "react-hot-toast";

import useAuth from "../../../hooks/useAuth";
import useGeolocation from "../../../hooks/useGeolocation";
import {
  useTransactionOpportunity,
  saveOpportunityToStore,
  getOpportunityForBusiness,
} from "../../../hooks/useTransactionModal";
import { useStateValue } from "../../../providers/stateProvider";

import { GET_SUB_BUSINESSES, GET_TRANSACTIONS } from "../../Auths/queries/userQueries";
import { GET_ANALYTICS } from "./queries/analytics";
import { UPDATE_TRANSACTION_STATUS } from "../../Auths/mutations/userMutations";

import NotificationSocket from "../../Notification/web-socket";
import TransactionCard from "../TransactionCard";
import TransactionFilter from "../TransactionFilter";
import EmptyTableState from "../components/EmptyTable";
import TransactionOpportunityModal from "../components/TransactionOpportunityModal";
import { getAvatarColor, STATUS_MAP } from "../../../utils/transactionHelpers";


const Dashboard = () => {
  const navigate     = useNavigate();
  const { userData } = useAuth();
  const opportunity  = useTransactionOpportunity();

  // ── Selected business ─────────────────────────────────────────────────────
  const [{ businessStates: { selectedBusiness } }, dispatch] = Object.values(useStateValue());

  const primaryBusinessId = userData?.businesses?.find((b) => b.isPrimary)?.id;

  const getVendorBusinessId = () =>
    localStorage.getItem("selected_business") || String(primaryBusinessId);

  const [vendorBusinessId, setVendorBusinessId] = useState(getVendorBusinessId);

  useEffect(() => {
    if (!selectedBusiness && vendorBusinessId) {
      localStorage.setItem("selected_business", vendorBusinessId);
      dispatch({ type: "UPDATE_SELECTED_BUSINESS", value: vendorBusinessId });
    } else if (selectedBusiness) {
      localStorage.setItem("selected_business", selectedBusiness);
      setVendorBusinessId(selectedBusiness);
    }
  }, [selectedBusiness]);

  const handleOpportunityAccepted = useCallback(() => { refetch(); }, []);

  const handleTransferConfirmed = useCallback(() => { refetch(); }, []);

  /**
   * Handles an incoming opportunity from the WebSocket.
   * Saves to localStorage (persists across navigation / context switches)
   * and opens the modal immediately — the vendor selects which of their
   * grouped businesses to accept for inside the modal.
   */
  const handleOpportunity = useCallback((data) => {
    saveOpportunityToStore(data);
    opportunity.open(data);
  }, [opportunity]);

  /**
   * Restores a pending opportunity modal whenever the vendor switches to a
   * business context that has an un-actioned opportunity in localStorage.
   */
  useEffect(() => {
    if (!vendorBusinessId || opportunity.isOpen) return;
    const pending = getOpportunityForBusiness(vendorBusinessId);
    if (pending) opportunity.open(pending);
  }, [vendorBusinessId]);

  const handleSwitchBusiness = (id) => {
    localStorage.setItem("selected_business", id);
    dispatch({ type: "UPDATE_SELECTED_BUSINESS", value: id });
    setVendorBusinessId(id);
    toast.success("Business updated successfully");
  };

  // ── Geolocation (starts live tracking via NotificationSocket) ─────────────
  useGeolocation();

  // ── Transaction history ───────────────────────────────────────────────────
  const [pageNumber, setPageNumber] = useState(1);

  const { data, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: { pageCount: 10, pageNumber, businessId: vendorBusinessId },
    fetchPolicy: "network-only",
  });

  const [updateStatus] = useMutation(UPDATE_TRANSACTION_STATUS);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateStatus({ variables: { id, status: newStatus } });
      refetch();
    } catch {
      toast.error("Failed to update transaction status");
    }
  };

  const transactionHistory = data?.transactions?.transactions || [];

  // ── Sub-businesses ────────────────────────────────────────────────────────
  const [subBizPage, setSubBizPage] = useState(1);

  const { data: subBizData, loading: subBizLoading } = useQuery(GET_SUB_BUSINESSES, {
    variables: { pageCount: 10, pageNumber: subBizPage, ownerId: userData?.id || "" },
    fetchPolicy: "network-only",
  });

  const subBusinessList = [...(subBizData?.businesses?.businesses || [])].sort((a, b) => {
    if (a.id === vendorBusinessId) return -1;
    if (b.id === vendorBusinessId) return 1;
    return 0;
  });

  // ── Analytics ─────────────────────────────────────────────────────────────
  const { data: analyticsData } = useQuery(GET_ANALYTICS, {
    variables: { businessId: vendorBusinessId, userType: userData?.userType?.toLowerCase() },
    skip: !vendorBusinessId,
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 sm:mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-12 space-y-12">

              {/* ── Analytics cards ───────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm opacity-90">Total Transactions</span>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg font-bold">₦</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {analyticsData?.analytics?.totalTransactions || 0}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Total Profit (plus extra charges)</span>
                    <ArrowRight className="w-4 h-4 text-white bg-black rounded-full p-0.5" />
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mr-3">
                      <span className="text-emerald-600 text-lg">₦</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-800">
                    ₦{Number(analyticsData?.analytics?.totalChargesPlusExtra || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {analyticsData?.analytics?.percentageReductionFromPastMonth || 0}% from last month
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Total Fulfilled Transactions</span>
                    <ArrowRight className="w-4 h-4 text-white bg-black rounded-full p-0.5" />
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-teal-600 text-lg">₦</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-800">
                    {analyticsData?.analytics?.fulfilledTransactions || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {analyticsData?.analytics?.percentageReductionFromPastMonth || 0}% from last month
                  </div>
                </div>

                <div className="flex justify-end px-6 py-2">
                  <button
                    className="flex items-center h-12 gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 transition-all duration-200 rounded-2xl text-sm font-medium"
                    onClick={() => navigate("/create-store")}
                  >
                    <Plus size={16} />
                    <span>Create Sub Business</span>
                  </button>
                </div>
              </div>

              {/* ── Transaction history + Sub-businesses ──────────────── */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-6 mt-20">

                {/* Transaction history */}
                <div className="bg-white rounded-2xl py-6 px-2 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="md:flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
                    <div className="flex items-center gap-10 pt-5 md:pt-0">
                      <TransactionFilter
                        statusMap={STATUS_MAP}
                        refetch={refetch}
                        user={userData}
                        businessId={vendorBusinessId}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                          disabled={pageNumber === 1}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 disabled:opacity-40"
                        >
                          <ArrowLeft />
                        </button>
                        <span className="text-sm text-gray-500 px-1">
                          {pageNumber} of {data?.transactions?.pagination?.totalPages ?? 1}
                        </span>
                        <button
                          onClick={() => setPageNumber((p) => p + 1)}
                          disabled={pageNumber >= (data?.transactions?.pagination?.totalPages ?? 1)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 disabled:opacity-40"
                        >
                          <ArrowRight />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {!transactionHistory.length && (
                      <EmptyTableState description="All transactions initiated to this business will appear here." />
                    )}
                    {transactionHistory.map((tx, index) => (
                      <TransactionCard
                        key={tx.id}
                        transaction={tx}
                        index={index}
                        refetch={refetch}
                        onViewDetails={() => navigate(`/transaction-details/${tx.id}`)}
                        isVendor
                        isAwaitingTransfer={tx.awaitingTransfer}
                      />
                    ))}
                  </div>
                </div>

                {/* Sub-businesses */}
                <div className="bg-white rounded-2xl py-6 px-2 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Sub Business List</h2>
                    <div className="flex items-center">
                      <button
                        onClick={() => setSubBizPage((p) => Math.max(1, p - 1))}
                        disabled={subBizPage === 1}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 disabled:opacity-40"
                      >
                        <ArrowLeft />
                      </button>
                      <span className="text-sm text-gray-500 px-2">
                        {subBizPage} of {subBizData?.businesses?.pagination?.totalPages ?? 1}
                      </span>
                      <button
                        onClick={() => setSubBizPage((p) => p + 1)}
                        disabled={subBizPage >= (subBizData?.businesses?.pagination?.totalPages ?? 1)}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 disabled:opacity-40"
                      >
                        <ArrowRight />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {!subBusinessList.length && <EmptyTableState />}

                    {subBizLoading ? (
                      <p className="text-gray-500 text-sm">Loading…</p>
                    ) : (
                      subBusinessList.map((store, index) => (
                        <div
                          key={store.id}
                          className="bg-white hover:scale-105 lg:flex items-center justify-between px-3 py-5 hover:bg-gray-50 shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl group"
                        >
                          <div className="flex items-center flex-1 max-w-full md:max-w-[65%]">
                            <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center mr-3 shadow-sm`}>
                              <span className="text-white text-sm font-medium">
                                {store.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 truncate">{store.name}</span>
                                {store.id === vendorBusinessId && (
                                  <span className="flex-shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{store.address}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 lg:mt-0 grid items-center gap-2 ml-2 max-w-full md:max-w-[35%]">
                            <button
                              className="relative border px-4 py-2 justify-center flex gap-2 items-center text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-full transition-all duration-300 group-hover:scale-110 font-medium text-sm"
                              onClick={() => navigate(`/edit-business/${store?.id}`)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {store.id !== vendorBusinessId && (
                              <button
                                className="border mt-2 px-4 py-2 flex gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 group-hover:scale-110"
                                onClick={() => handleSwitchBusiness(store?.id)}
                              >
                                Switch Business
                                <SwitchCamera className="w-4 h-4 my-1" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Single NotificationSocket instance; passes onOpportunity to vendor flow */}
      <NotificationSocket onOpportunity={handleOpportunity} onNewInterest={refetch} onTransferConfirmed={handleTransferConfirmed} />

      <TransactionOpportunityModal
        isOpen={opportunity.isOpen}
        opportunityData={opportunity.opportunityData}
        onClose={opportunity.close}
        onAccepted={handleOpportunityAccepted}
      />
    </>
  );
};

export default Dashboard;
