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
import WebPushSettings from "../../Notification/WebPushSettings";
import TransactionCard from "../TransactionCard";
import TransactionFilter from "../TransactionFilter";
import EmptyTableState from "../components/EmptyTable";
import TransactionOpportunityModal from "../components/TransactionOpportunityModal";
import LiquidityBanner from "../components/LiquidityBanner";
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

  // ── Liquidity banner ──────────────────────────────────────────────────────
  const [showLiquidityBanner, setShowLiquidityBanner] = useState(false);

  useEffect(() => {
    if (!vendorBusinessId || !subBizData) return;
    const alreadyAcked = sessionStorage.getItem(`liquidity_ack_${vendorBusinessId}`);
    if (!alreadyAcked) setShowLiquidityBanner(true);
  }, [vendorBusinessId, subBizData]);

  const currentBusiness = subBusinessList.find((b) => b.id === vendorBusinessId) ?? null;

  // ── Analytics ─────────────────────────────────────────────────────────────
  const { data: analyticsData } = useQuery(GET_ANALYTICS, {
    variables: { businessId: vendorBusinessId, userType: userData?.userType?.toLowerCase() },
    skip: !vendorBusinessId,
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {showLiquidityBanner && currentBusiness && (
        <LiquidityBanner
          business={currentBusiness}
          onDismiss={() => setShowLiquidityBanner(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 p-4 sm:p-3">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 h-8 sm:mb-4" />

          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Vendor workspace</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Welcome, {userData?.firstName || userData?.username || "there"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {currentBusiness?.name || "Manage your business and transaction activity."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/create-store")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create sub-business
            </button>
          </div>

          <WebPushSettings />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-12 space-y-8">

              {/* ── Analytics cards ───────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Total transactions</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><ArrowRight size={17} /></span>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-950">
                    {analyticsData?.analytics?.totalTransactions || 0}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Vendor earnings</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><span className="text-base font-semibold">₦</span></span>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-950">
                    ₦{Number(analyticsData?.analytics?.totalChargesPlusExtra || 0).toLocaleString()}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {analyticsData?.analytics?.percentageReductionFromPastMonth || 0}% from last month
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Fulfilled transactions</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><ArrowRight size={17} /></span>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-slate-950">
                    {analyticsData?.analytics?.fulfilledTransactions || 0}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {analyticsData?.analytics?.percentageReductionFromPastMonth || 0}% from last month
                  </div>
                </div>
              </div>

              {/* ── Transaction history + Sub-businesses ──────────────── */}
              <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Transaction history */}
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-5 shadow-sm sm:p-5">
                  <div className="mb-6 lg:flex lg:items-center lg:justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Transaction history</h2>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 lg:pt-0">
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
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
                        >
                          <ArrowLeft />
                        </button>
                        <span className="text-sm text-gray-500 px-1">
                          {pageNumber} of {data?.transactions?.pagination?.totalPages ?? 1}
                        </span>
                        <button
                          onClick={() => setPageNumber((p) => p + 1)}
                          disabled={pageNumber >= (data?.transactions?.pagination?.totalPages ?? 1)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
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
                        isOutgoing={tx.client?.id === userData?.id}
                        isAwaitingTransfer={tx.awaitingTransfer}
                      />
                    ))}
                  </div>
                </div>

                {/* Sub-businesses */}
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-5 shadow-sm sm:p-5">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Sub Business List</h2>
                    <div className="flex shrink-0 items-center">
                      <button
                        onClick={() => setSubBizPage((p) => Math.max(1, p - 1))}
                        disabled={subBizPage === 1}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
                      >
                        <ArrowLeft />
                      </button>
                      <span className="text-sm text-gray-500 px-2">
                        {subBizPage} of {subBizData?.businesses?.pagination?.totalPages ?? 1}
                      </span>
                      <button
                        onClick={() => setSubBizPage((p) => p + 1)}
                        disabled={subBizPage >= (subBizData?.businesses?.pagination?.totalPages ?? 1)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
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
                          className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                        >
                          <div className="flex min-w-0 w-full flex-1 items-center sm:max-w-[65%]">
                            <div className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getAvatarColor(index)}`}>
                              <span className="text-sm font-semibold">
                                {store.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 truncate">{store.name}</span>
                                {store.id === vendorBusinessId && (
                                  <span className="flex-shrink-0 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
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

                          <div className="grid w-full min-w-0 grid-cols-2 items-center gap-2 sm:mt-0 sm:w-auto sm:max-w-[35%]">
                            <button
                              className="relative flex min-w-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 px-2 py-2 text-sm font-medium text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-md hover:shadow-indigo-100 active:translate-y-0 active:scale-[0.98] active:bg-indigo-700 active:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:px-4"
                              onClick={() => navigate(`/edit-business/${store?.id}`)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Manage</span>
                            </button>

                            {store.id !== vendorBusinessId && (
                              <button
                                className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 hover:shadow-sm active:translate-y-0 active:scale-[0.98] active:border-sky-300 active:bg-sky-100 active:text-sky-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:gap-2 sm:px-4 sm:text-sm"
                                onClick={() => handleSwitchBusiness(store?.id)}
                              >
                                <span className="truncate">Switch Business</span>
                                <SwitchCamera className="my-1 h-4 w-4 shrink-0" />
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
