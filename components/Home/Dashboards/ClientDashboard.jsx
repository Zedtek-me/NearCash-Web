import React, { useState, useCallback } from "react";
import {
  ArrowUpRight, ChevronDown, ChevronUp, ArrowLeft, ArrowRight,
} from "lucide-react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import useAuth from "../../../hooks/useAuth";
import useGeolocation from "../../../hooks/useGeolocation";
import { useTxnStatusMessages } from "../../../hooks/useWebSocketMessages";
import { useWebSocket } from "../../Notification/WebSocketProvider";
import NotificationSocket from "../../Notification/web-socket";

import {
  VENDOR_LIST,
  GET_VENDOR_POLICY_FOR_USER,
  GET_ASSETS,
  GET_TRANSACTIONS,
} from "../../Auths/queries/userQueries";
import { GET_ANALYTICS } from "./queries/analytics";
import {
  CREATE_TRANSACTION,
  RESPOND_TO_TRANSACTION,
} from "../../Auths/mutations/userMutations";

import TransactionCard from "../TransactionCard";
import TransactionFilter from "../TransactionFilter";
import VendorFilter from "../VendorFilter";
import EmptyTableState from "../components/EmptyTable";
import TransactionStatusModal from "../components/TransactionStatusModal";
import LocationModal from "../components/LocationModal";
import MapModal from "../components/MapModal";
import TransactionRequestModal from "../components/TransactionRequestModal";
import FxRequestModal from "../components/FxRequestModal";
import { getAvatarColor, STATUS_MAP, formatAmount, formatRange, formatAmountInput, parseAmountInput } from "../../../utils/transactionHelpers";


export default function ClientDashboard() {
  const { userData }   = useAuth();
  const navigate       = useNavigate();
  const socket         = useWebSocket();
  const { userLocation, isLoadingLocation, requestLocationPermission } = useGeolocation();

  // ── Vendor list & assets ──────────────────────────────────────────────────
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [vendorTypeFilter, setVendorTypeFilter] = useState(null);
  const [collectionModeFilter, setCollectionModeFilter] = useState(null);
  const [vendorPage, setVendorPage] = useState(1);

  const handleVendorTypeFilter = (value) => { setVendorTypeFilter(value); setVendorPage(1); };
  const handleCollectionModeFilter = (value) => { setCollectionModeFilter(value); setVendorPage(1); };

  const { data: vendorsData } = useQuery(VENDOR_LIST, {
    variables: {
      currentLat: userLocation?.lat || 0,
      currentLong: userLocation?.lng || 0,
      pageCount: 5,
      pageNumber: vendorPage,
      ...(vendorTypeFilter && { vendorType: vendorTypeFilter }),
      ...(collectionModeFilter && { collectionMode: collectionModeFilter }),
    },
    skip: !userLocation,
  });

  const [fetchAsset, { data: assetData }] = useLazyQuery(GET_ASSETS);

  const toggleExpanded = (storeId) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(storeId) ? next.delete(storeId) : next.add(storeId);
      return next;
    });
    fetchAsset({ variables: { businessId: String(storeId) } });
  };

  // ── Map modal (currently UI-disabled; kept for future activation) ─────────
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMap, setShowMap]     = useState(false);
  const [mapData, setMapData]     = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  const closeMap = () => {
    setShowMap(false);
    setMapData(null);
    setSelectedStore(null);
  };

  // ── Transaction request modal ─────────────────────────────────────────────
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedVendor, setSelectedVendor]  = useState(null);
  const [assetId, setAssetId]                = useState(null);
  const [amount, setAmount]                  = useState("");
  const [selectedPolicy, setSelectedPolicy]  = useState(null);
  const [transferMode, setTransferMode]      = useState(null);
  const [selectedAssetRange, setSelectedAssetRange] = useState(null);
  const [transactionType, setTransactionType] = useState('request');

  const [fetchPolicies, { data: policiesData, loading: policiesLoading }] =
    useLazyQuery(GET_VENDOR_POLICY_FOR_USER);

  const [createTransaction, { loading: creating }] = useMutation(CREATE_TRANSACTION);

  // ── FX request modal ──────────────────────────────────────────────────────
  const [showFxModal, setShowFxModal] = useState(false);
  const [fxAmount, setFxAmount] = useState("");
  const [fxSourceCurrency, setFxSourceCurrency] = useState("NGN");
  const [fxDestinationCurrency, setFxDestinationCurrency] = useState("USD");
  const [fxTransferMode, setFxTransferMode] = useState(null);

  const resetFxForm = () => {
    setShowFxModal(false);
    setFxAmount("");
    setFxSourceCurrency("NGN");
    setFxDestinationCurrency("USD");
    setFxTransferMode(null);
  };

  const handleInitiateTransaction = (vendor, rangeAssetId, assetRange, type = 'request') => {
    setSelectedVendor(vendor);
    setAssetId(rangeAssetId);
    setSelectedAssetRange(assetRange ?? null);
    setTransactionType(type);
    setShowTransactionModal(true);
    fetchPolicies({ variables: { businessId: String(vendor.id) } });
  };

  // ── Active transaction & status modal ─────────────────────────────────────
  const [activeTxId, setActiveTxId] = useState(null);
  const [txStatusModal, setTxStatusModal] = useState({
    isOpen: false,
    status: "loading",
    transactionInfo: {},
    delayActionLoading: null,
  });

  const handleCloseStatusModal = () => {
    setTxStatusModal({ isOpen: false, status: "loading", transactionInfo: {}, delayActionLoading: null });
    setActiveTxId(null);
  };

  const handleConfirmPaid = () => {
    setTxStatusModal((prev) => ({ ...prev, status: "awaitingConfirmation" }));
  };

  const handleCancelAwaitingConfirmation = () => {
    setTxStatusModal((prev) => ({ ...prev, status: "approved" }));
  };

  // useTxnStatusMessages drives the modal state; NotificationSocket handles toasting
  const onTxnStatusMessage = useCallback((message_type, data) => {
    const { txn_info } = data;
    if (message_type === "Transaction Approved!") {
      const txnId = txn_info?.txn_id;
      setTxStatusModal((prev) => ({
        ...prev,
        status: "approved",
        transactionInfo: {
          ...prev.transactionInfo,
          transactionId: txnId,
          vendorName:    txn_info?.vendor_name    || prev.transactionInfo.vendorName,
          amount:        txn_info?.amount         || prev.transactionInfo.amount,
          currency:      txn_info?.destination_curr || prev.transactionInfo.currency,
          transferMode:  txn_info?.transfer_mode  || null,
          accountInfo:   txn_info?.account_info   || null,
        },
      }));
      refetch();
      if (txn_info?.transfer_mode !== "BANK_TRANSFER") {
        setTimeout(() => navigate(`/transaction-details/${txnId}`), 5000);
      }
    }

    if (message_type === "Transfer Confirmed") {
      const txnId = txn_info?.txn_id || activeTxId;
      setTxStatusModal((prev) => ({ ...prev, status: "transferConfirmed" }));
      refetch();
      setTimeout(() => {
        navigate(`/transaction-details/${txnId}`);
        handleCloseStatusModal();
      }, 2500);
    }

    if (message_type === "Transfer Failed") {
      setTxStatusModal((prev) => ({
        ...prev,
        status: "transferFailed",
        transactionInfo: {
          ...prev.transactionInfo,
          failReason: data.message || null,
        },
      }));
    }

    if (message_type === "Transaction Declined!") {
      setTxStatusModal((prev) => ({ ...prev, status: "declined" }));
    }

    if (message_type === "Vendor Response Delayed") {
      setTxStatusModal((prev) => ({ ...prev, status: "delayed" }));
    }

    if (message_type === "No Available Vendors" || message_type === "No Nearby FX Vendors") {
      setTxStatusModal((prev) => ({ ...prev, status: "noVendors" }));
    }

    if (message_type === "Proposed Rate") {
      setTxStatusModal((prev) => ({
        ...prev,
        status: "fxRatesProposed",
        transactionInfo: {
          ...prev.transactionInfo,
          proposedRates: txn_info?.proposed_rates || [],
          marketRate:    txn_info?.currency_market_rate,
          sourceCurrency: txn_info?.source_currency || prev.transactionInfo.sourceCurrency,
          currency:      txn_info?.destination_curr || prev.transactionInfo.currency,
        },
      }));
    }
  }, [navigate]);

  useTxnStatusMessages(socket, activeTxId, onTxnStatusMessage);

  // ── Submit transaction ────────────────────────────────────────────────────
  const handleSubmitTransaction = async () => {
    const isDeposit = transactionType === 'deposit';
    if (!amount || !selectedPolicy || (!transferMode && !isDeposit)) {
      if (isDeposit) {
        toast.error("Please enter an amount and select a collection mode");
      } else {
        toast.error("Please enter an amount, select a collection mode, and choose a payment method");
      }
      return;
    }

    try {
      const payload = {
        assetId,
        vendorId: selectedVendor.id.toString(),
        amountToWithdraw: parseAmountInput(amount),
        clientCurrentCoordinates: {
          latitude:  userLocation.lat,
          longitude: userLocation.lng,
        },
        collectionMode: policiesData?.businessTransactionPolicyForUser?.cashCollectionMode,
        collectionLocation: "",
      };

      if (!isDeposit) payload.transferMode = transferMode;
      if (isDeposit) payload.type = 'deposit';

      const result = await createTransaction({
        variables: {
          transactionData: payload,
        },
      });

      const txId = result?.data?.initiateTransaction?.transaction?.id;

      setShowTransactionModal(false);
      setAmount("");
      setSelectedPolicy(null);
      setTransferMode(null);
      setActiveTxId(txId);
      setTxStatusModal({
        isOpen: true,
        status: "loading",
        transactionInfo: {
          amount:        parseAmountInput(amount),
          vendorName:    selectedVendor?.name,
          transactionId: txId,
          txnType:       "LOCAL",
        },
        delayActionLoading: null,
      });

      setExpandedCards((prev) => {
        const next = new Set(prev);
        next.delete(selectedVendor.id);
        return next;
      });
      toast.success(isDeposit ? "Deposit request sent! Awaiting vendor response." : "Transaction request sent! Awaiting vendor response.");

      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create transaction");
    }
  };

  // ── Submit FX request ─────────────────────────────────────────────────────
  const handleSubmitFxTransaction = async () => {
    if (!fxAmount || !fxSourceCurrency || !fxDestinationCurrency || !fxTransferMode) {
      toast.error("Please enter an amount, currency pair, and payment method");
      return;
    }
    if (fxSourceCurrency === fxDestinationCurrency) {
      toast.error("Source and destination currencies must be different");
      return;
    }
    if (!userLocation) {
      toast.error("We need your location to find nearby FX vendors");
      return;
    }

    try {
      const payload = {
        amountToWithdraw: parseAmountInput(fxAmount),
        clientCurrentCoordinates: {
          latitude:  userLocation.lat,
          longitude: userLocation.lng,
        },
        collectionMode: "MEET_UP",
        transferMode: fxTransferMode,
        collectionLocation: "",
        txnType: "FX",
        sourceCurrencyCode: fxSourceCurrency,
        destinationCurrencyCode: fxDestinationCurrency,
      };

      const result = await createTransaction({
        variables: { transactionData: payload },
      });

      const txId = result?.data?.initiateTransaction?.transaction?.id;

      resetFxForm();
      setActiveTxId(txId);
      setTxStatusModal({
        isOpen: true,
        status: "loading",
        transactionInfo: {
          amount: payload.amountToWithdraw,
          currency: fxDestinationCurrency,
          transactionId: txId,
          txnType: "FX",
        },
        delayActionLoading: null,
      });
      toast.success("FX request sent! Nearby FX vendors have been notified.");

      refetch();
    } catch (err) {
      console.error(err);
      toast.error(err?.graphQLErrors?.[0]?.message || "Failed to create FX request");
    }
  };

  const [respondToTransaction] = useMutation(RESPOND_TO_TRANSACTION);

  const handleDelayResponse = async (decision) => {
    const loadingKey =
      decision === "WAIT"          ? "keepWaiting"
      : decision === "CANCEL"      ? "cancel"
      : "autoAssign";

    setTxStatusModal((prev) => ({ ...prev, delayActionLoading: loadingKey }));

    try {
      await respondToTransaction({ variables: { txnId: activeTxId, decision } });

      if (decision === "CANCEL") {
        const isFx = txStatusModal.transactionInfo?.txnType === "FX";
        handleCloseStatusModal();
        toast(isFx ? "FX request cancelled." : "Select a vendor and initiate a new request.");
      } else {
        setTxStatusModal((prev) => ({ ...prev, status: "loading", delayActionLoading: null }));
        if (decision === "SYSTEM_SEARCH") toast("Looking for the nearest available vendor…");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setTxStatusModal((prev) => ({ ...prev, delayActionLoading: null }));
    }
  };

  // ── Transaction history ───────────────────────────────────────────────────
  const [pageNumber, setPageNumber] = useState(1);

  const { data: transactionData, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: { pageCount: 10, pageNumber },
    fetchPolicy: "network-only",
  });

  const { data: analyticsData } = useQuery(GET_ANALYTICS, {
    variables: { userType: userData?.userType?.toLowerCase() },
  });

  const transactionHistory = transactionData?.transactions?.transactions || [];

  const getCollectionModeLabel = (mode) => {
    switch (mode) {
      case "STORE_WALK_IN":            return "Supports store walk-in only";
      case "MEET_UP":                  return "Supports cash delivery only";
      case "MEET_UP_AND_STORE_WALK_IN": return "Supports store walk-in & cash delivery";
      default:                         return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 md:p-6">
      <div className="max-w-7xl mx-auto mt-14">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-semibold mb-1">
            <span className="text-gray-900">Welcome,</span>{' '}
            <span className="text-indigo-500">{userData?.fullName ?? userData?.email}</span>
          </h1>
        </div>

        {/* ── Analytics cards ─────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="lg:flex gap-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-sm md:w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Total Transactions Count</h2>
                <ArrowUpRight className="w-5 h-5 text-white/60" />
              </div>
              <div className="text-2xl font-bold text-white">
                {analyticsData?.analytics?.totalTransactions || 0}
              </div>
            </div>

            <div className="mt-5 lg:mt-0 bg-white rounded-2xl p-6 shadow-sm md:w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Fulfilled Transactions Value</h2>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ₦{analyticsData?.analytics?.totalTransactionValue || 0}
              </div>
            </div>

            <div className="mt-5 lg:mt-0 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-sm md:w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Current Month Transactions Value</h2>
                <ArrowUpRight className="w-5 h-5 text-white/80" />
              </div>
              <div className="text-2xl font-bold text-white/80">
                ₦{analyticsData?.analytics?.currentMonthTransactionValue || 0}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="w-full grid sm:grid-cols-1 md:grid-cols-2 gap-6 mt-10">

          {/* Nearby vendors */}
          <div className="bg-white rounded-2xl py-6 px-3 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Nearby Vendors</h2>
              <VendorFilter
                onFilter={handleVendorTypeFilter}
                onCollectionModeFilter={handleCollectionModeFilter}
                onSelectFx={() => setShowFxModal(true)}
              />
            </div>

            <div className="space-y-4">
              {!vendorsData?.businessesAroundMe?.businesses?.length && (
                <EmptyTableState
                  title="No nearby vendor within your current location."
                  description="Vendors within 15 km from you will appear here."
                />
              )}

              {vendorsData?.businessesAroundMe?.businesses?.map((store, index) => (
                <div key={store.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center hover:scale-105 justify-between px-3 py-5 hover:bg-gray-50 transition-all duration-300">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center mr-3 shadow-sm`}>
                        <span className="text-white text-sm font-medium">
                          {store.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 flex items-center gap-2">
                          {store?.name}
                          <div className="relative flex items-center justify-center ml-1">
                            {store?.isOnline && (
                              <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping" />
                            )}
                            <div
                              className={`online-status w-3 h-3 rounded-full ${store?.isOnline ? "bg-green-500" : "bg-slate-300"}`}
                              title={store?.isOnline ? "Online" : "Offline"}
                            />
                          </div>
                          </div>
                        <div className="text-sm text-gray-500">
                          {store?.distance} km away
                          {store?.nearest && " (Nearest)"}
                        </div>
                        {getCollectionModeLabel(store.businessPolicyForCurrentUser?.cashCollectionMode) && (
                          <div className="text-xs text-indigo-600 mt-0.5">
                            {getCollectionModeLabel(store.businessPolicyForCurrentUser?.cashCollectionMode)}
                          </div>
                        )}
                      </div>
                    </div>

                    

                    <button
                      onClick={() => toggleExpanded(store.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                      title={expandedCards.has(store.id) ? "Collapse" : "Expand"}
                    >
                      {expandedCards.has(store.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {expandedCards.has(store.id) && (
                    <div className="px-3 pb-5 border-t border-gray-100">
                      <div className="pt-4">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-gray-800 mb-3">Cash Range</h4>
                          <p>Charges</p>
                        </div>
                        <div className="space-y-2">
                          {assetData?.businessAssets?.map((asset) => (
                            <div
                              key={asset.id}
                              className="flex flex-wrap justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm text-gray-600">Range: {formatRange(asset.range)}</span>
                              <span className="font-medium text-indigo-600">₦{formatAmount(asset.chargeRate)}</span>
                              <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-2 mt-2 sm:mt-0">
                                <button
                                  onClick={() => handleInitiateTransaction(store, asset.id, asset.range, 'request')}
                                  className="w-full sm:w-auto px-4 py-2 bg-indigo-500 text-sm text-white rounded-lg hover:bg-indigo-600 transition"
                                >
                                  Request Cash
                                </button>

                                <button
                                  onClick={() => handleInitiateTransaction(store, asset.id, asset.range, 'deposit')}
                                  className="w-full sm:w-auto px-4 py-2 bg-green-500 text-sm text-white rounded-lg hover:bg-green-600 transition"
                                  title="Deposit"
                                >
                                  Deposit
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {vendorsData?.businessesAroundMe && (
              <div className="flex items-center justify-end mt-4 gap-2">
                <button
                  onClick={() => setVendorPage((p) => Math.max(1, p - 1))}
                  disabled={vendorPage === 1}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm text-gray-500 px-1">
                  {vendorPage} of {vendorsData.businessesAroundMe.pagination?.totalPages ?? 1}
                </span>
                <button
                  onClick={() => setVendorPage((p) => p + 1)}
                  disabled={vendorPage >= (vendorsData.businessesAroundMe.pagination?.totalPages ?? 1)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-2xl py-6 px-3 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="md:flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
              <div className="flex items-center gap-10 pt-5 md:pt-0">
                <TransactionFilter statusMap={STATUS_MAP} refetch={refetch} user={userData} />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber === 1}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-500 px-1">
                    {pageNumber} of {transactionData?.transactions?.pagination?.totalPages ?? 1}
                  </span>
                  <button
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={pageNumber >= (transactionData?.transactions?.pagination?.totalPages ?? 1)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-40"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!transactionHistory.length && (
                <EmptyTableState description="All your transactions will appear here." />
              )}
              {transactionHistory.map((tx, index) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  index={index}
                  refetch={refetch}
                  isAwaitingTransfer={tx.awaitingTransfer}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showTransactionModal && (
        <TransactionRequestModal
          vendor={selectedVendor}
          amount={amount}
          onAmountChange={setAmount}
          selectedPolicy={selectedPolicy}
          onSelectPolicy={setSelectedPolicy}
          transferMode={transferMode}
          onTransferModeChange={setTransferMode}
          policiesData={policiesData}
          policiesLoading={policiesLoading}
          onSubmit={handleSubmitTransaction}
          transactionType={transactionType}
          hidePaymentMethod={transactionType === 'deposit'}
          assetRange={selectedAssetRange}
          onClose={() => { setShowTransactionModal(false); setAmount(""); setSelectedPolicy(null); setTransferMode(null); setSelectedAssetRange(null); }}
          submitting={creating}
        />
      )}

      {showFxModal && (
        <FxRequestModal
          amount={fxAmount}
          onAmountChange={setFxAmount}
          sourceCurrency={fxSourceCurrency}
          onSourceCurrencyChange={setFxSourceCurrency}
          destinationCurrency={fxDestinationCurrency}
          onDestinationCurrencyChange={setFxDestinationCurrency}
          transferMode={fxTransferMode}
          onTransferModeChange={setFxTransferMode}
          onSubmit={handleSubmitFxTransaction}
          onClose={resetFxForm}
          submitting={creating}
        />
      )}

      {showLocationModal && (
        <LocationModal
          onClose={() => { setShowLocationModal(false); setSelectedStore(null); }}
          onAllow={() =>
            requestLocationPermission(() => {
              setShowLocationModal(false);
              if (selectedStore) {
                setShowMap(true);
              }
            })
          }
          isLoading={isLoadingLocation}
        />
      )}

      {showMap && (
        <MapModal
          selectedStore={selectedStore}
          mapData={mapData}
          userLocation={userLocation}
          isLoadingRoute={false}
          onClose={closeMap}
        />
      )}

      <TransactionStatusModal
        isOpen={txStatusModal.isOpen}
        status={txStatusModal.status}
        transactionInfo={txStatusModal.transactionInfo}
        delayActionLoading={txStatusModal.delayActionLoading}
        onClose={handleCloseStatusModal}
        onKeepWaiting={() => handleDelayResponse("WAIT")}
        onCancel={() => handleDelayResponse("CANCEL")}
        onAutoAssign={() => handleDelayResponse("SYSTEM_SEARCH")}
        onViewDetails={() => navigate(`/transaction-details/${activeTxId}`)}
        onConfirmPaid={handleConfirmPaid}
        onCancelAwaitingConfirmation={handleCancelAwaitingConfirmation}
      />

      {/* Single NotificationSocket instance per dashboard */}
      <NotificationSocket />
    </div>
  );
}
