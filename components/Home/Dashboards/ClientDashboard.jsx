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
  GET_VENDOR_POLICIES,
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
import { getAvatarColor, STATUS_MAP, formatAmount, formatRange } from "../../../utils/transactionHelpers";


export default function ClientDashboard() {
  const { userData }   = useAuth();
  const navigate       = useNavigate();
  const socket         = useWebSocket();
  const { userLocation, isLoadingLocation, requestLocationPermission } = useGeolocation();

  // ── Vendor list & assets ──────────────────────────────────────────────────
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [vendorTypeFilter, setVendorTypeFilter] = useState(null);

  const { data: vendorsData } = useQuery(VENDOR_LIST, {
    variables: {
      currentLat: userLocation?.lat || 0,
      currentLong: userLocation?.lng || 0,
      ...(vendorTypeFilter && { vendorType: vendorTypeFilter }),
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

  const [fetchPolicies, { data: policiesData, loading: policiesLoading }] =
    useLazyQuery(GET_VENDOR_POLICIES);

  const [createTransaction, { loading: creating }] = useMutation(CREATE_TRANSACTION);

  const handleInitiateTransaction = (vendor, rangeAssetId, assetRange) => {
    setSelectedVendor(vendor);
    setAssetId(rangeAssetId);
    setSelectedAssetRange(assetRange ?? null);
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
          vendorName:    txn_info?.vendor_name   || prev.transactionInfo.vendorName,
          amount:        txn_info?.amount        || prev.transactionInfo.amount,
          transferMode:  txn_info?.transfer_mode || null,
          accountInfo:   txn_info?.account_info  || null,
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

    if (message_type === "No Available Vendors") {
      setTxStatusModal((prev) => ({ ...prev, status: "noVendors" }));
    }
  }, [navigate]);

  useTxnStatusMessages(socket, activeTxId, onTxnStatusMessage);

  // ── Submit transaction ────────────────────────────────────────────────────
  const handleSubmitTransaction = async () => {
    if (!amount || !selectedPolicy || !transferMode) {
      toast.error("Please enter an amount, select a collection mode, and choose a payment method");
      return;
    }

    try {
      const result = await createTransaction({
        variables: {
          transactionData: {
            assetId,
            vendorId:                  selectedVendor.id.toString(),
            amountToWithdraw:          parseFloat(amount),
            clientCurrentCoordinates: {
              latitude:  userLocation.lat,
              longitude: userLocation.lng,
            },
            collectionMode:     policiesData?.businessTransactionPolicyForUser?.cashCollectionMode,
            collectionLocation: "",
            transferMode,
          },
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
          amount:        parseFloat(amount),
          vendorName:    selectedVendor?.name,
          transactionId: txId,
        },
        delayActionLoading: null,
      });

      setExpandedCards((prev) => {
        const next = new Set(prev);
        next.delete(selectedVendor.id);
        return next;
      });
      toast.success("Transaction request sent! Awaiting vendor response.");

      refetch();
    } catch {
      toast.error("Failed to create transaction");
    }
  };

  const [respondToTransaction] = useMutation(RESPOND_TO_TRANSACTION);

  const handleDelayResponse = async (decision) => {
    const loadingKey =
      decision === "WAIT"          ? "keepWaiting"
      : decision === "CANCEL"      ? "selectVendor"
      : "autoAssign";

    setTxStatusModal((prev) => ({ ...prev, delayActionLoading: loadingKey }));

    try {
      await respondToTransaction({ variables: { txnId: activeTxId, decision } });

      if (decision === "CANCEL") {
        handleCloseStatusModal();
        toast("Select a vendor and initiate a new request.");
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

  const transactionHistory = transactionData?.transactions || [];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 md:p-6">
      <div className="max-w-7xl mx-auto mt-14">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-semibold mb-1">
            <span className="text-gray-900">Welcome,</span>{' '}
            <span className="text-emerald-500">{userData?.fullName ?? userData?.email}</span>
          </h1>
        </div>

        {/* ── Analytics cards ─────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="lg:flex gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm md:w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Total Transactions Count</h2>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
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

            <div className="mt-5 lg:mt-0 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm md:w-[300px]">
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
              <VendorFilter onFilter={setVendorTypeFilter} />
            </div>

            <div className="space-y-4">
              {!vendorsData?.businessesAroundMe?.length && (
                <EmptyTableState
                  title="No nearby vendor within your current location."
                  description="Vendors within 15 km from you will appear here."
                />
              )}

              {vendorsData?.businessesAroundMe?.map((store, index) => (
                <div key={store.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center hover:scale-105 justify-between px-3 py-5 hover:bg-gray-50 transition-all duration-300">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center mr-3 shadow-sm`}>
                        <span className="text-white text-sm font-medium">
                          {store.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{store?.name}</div>
                        <div className="text-sm text-gray-500">
                          {store?.distance} km away
                          {store?.nearest && " (Nearest)"}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`online-status w-3 h-3 rounded-full ${store?.isOnline ? "bg-green-500" : "bg-slate-300"}`}
                      title={store?.isOnline ? "Online" : "Offline"}
                    />

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
                              className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm text-gray-600">Range: {formatRange(asset.range)}</span>
                              <span className="font-medium text-green-600">₦{formatAmount(asset.chargeRate)}</span>
                              <button
                                onClick={() => handleInitiateTransaction(store, asset.id, asset.range)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                              >
                                Request Cash
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-2xl py-6 px-3 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="md:flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
              <div className="flex items-center gap-10 pt-5 md:pt-0">
                <TransactionFilter statusMap={STATUS_MAP} refetch={refetch} user={userData} />
                <div className="flex items-center">
                  <button
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber === 1}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 disabled:opacity-40"
                  >
                    <ArrowLeft />
                  </button>
                  <button
                    onClick={() => setPageNumber((p) => p + 1)}
                    className="ml-3 p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100"
                  >
                    <ArrowRight />
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
          assetRange={selectedAssetRange}
          onClose={() => { setShowTransactionModal(false); setAmount(""); setSelectedPolicy(null); setTransferMode(null); setSelectedAssetRange(null); }}
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
        onSelectVendor={() => handleDelayResponse("CANCEL")}
        onAutoAssign={() => handleDelayResponse("SYSTEM_SEARCH")}
        onViewDetails={() => navigate(`/transaction-details/${activeTxId}`)}
      />

      {/* Single NotificationSocket instance per dashboard */}
      <NotificationSocket />
    </div>
  );
}
