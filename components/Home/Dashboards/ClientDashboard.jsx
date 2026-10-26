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
import WebPushSettings from "../../Notification/WebPushSettings";

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
  ACCEPT_PROPOSED_FX_RATE,
  GENERATE_VIRTUAL_ACCOUNT,
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
import FxProposalBanner from "../components/FxProposalBanner";
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

  // ── FX vendors proposing rates — inline banner, not the blocking modal ────
  // Mirrors the vendor-to-vendor LiquidityBanner's "initiated" pattern: stays
  // visible and keeps updating live while the client carries on using the
  // dashboard, rather than a full-screen popup that stops listening once closed.
  const [fxProposal, setFxProposal] = useState(null);
  const [fxBannerDismissed, setFxBannerDismissed] = useState(false);

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
    // TEMP DEBUG — remove once FX banner visibility issue is diagnosed.
    console.log("[FX-DEBUG] onTxnStatusMessage received:", message_type, { activeTxId, txn_info });
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

    // FX's "waiting for vendors" phase lives entirely in the inline banner —
    // matches the vendor-to-vendor liquidity banner, which also has no
    // response to this message. Only LOCAL gets the blocking "delayed" prompt.
    if (message_type === "Vendor Response Delayed" && txn_info?.txn_type !== "FX") {
      setTxStatusModal((prev) => ({ ...prev, status: "delayed" }));
    }

    if (message_type === "No Available Vendors") {
      setTxStatusModal((prev) => ({ ...prev, status: "noVendors" }));
    }

    // FX vendors proposing/finding-no-vendors surfaces in the inline banner,
    // not the blocking modal — reopen it (un-dismiss) so new activity is
    // never silently missed, the same way vendor opportunities keep surfacing.
    if (message_type === "No Nearby FX Vendors") {
      setFxProposal((prev) => (prev ? { ...prev, noVendorsFound: true } : prev));
      setFxBannerDismissed(false);
    }

    if (message_type === "Proposed Rate") {
      setFxProposal((prev) => ({
        ...(prev || {}),
        noVendorsFound: false,
        proposedRates: txn_info?.proposed_rates || [],
        marketRate:    txn_info?.currency_market_rate,
        sourceCurrency: txn_info?.source_currency || prev?.sourceCurrency,
        destinationCurrency: txn_info?.destination_curr || prev?.destinationCurrency,
      }));
      setFxBannerDismissed(false);
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
        txnType: "LOCAL"
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

      const txn = result?.data?.initiateTransaction?.transaction;
      const txId = txn?.id;

      // TEMP DEBUG — remove once FX banner visibility issue is diagnosed.
      console.log("[FX-DEBUG] initiateTransaction result:", result?.data, "txId:", txId);

      resetFxForm();
      setActiveTxId(txId);

      // Show the inline proposal banner immediately (searching → live offers),
      // not a blocking modal — matches the vendor-to-vendor liquidity banner.
      setFxBannerDismissed(false);
      setFxProposal({
        transactionId: txId,
        tenderedAmount: payload.amountToWithdraw,
        sourceCurrency: fxSourceCurrency,
        destinationCurrency: txn?.currency || fxDestinationCurrency,
        marketRate: null,
        proposedRates: [],
        noVendorsFound: false,
      });

      // Keep transactionInfo seeded (but the modal closed) so that once a rate
      // is accepted, handleAcceptFxRate's merge has currency/id to build on.
      setTxStatusModal({
        isOpen: false,
        status: "loading",
        transactionInfo: {
          // `amount` is the destination-currency equivalent the backend computed
          // from the tendered amount — everything downstream (vendor opportunity
          // broadcasts, rate proposals, approval) is denominated in this.
          amount: txn?.amount,
          currency: txn?.currency || fxDestinationCurrency,
          tenderedAmount: payload.amountToWithdraw,
          sourceCurrency: fxSourceCurrency,
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

  // ── Accept a proposed FX rate ──────────────────────────────────────────────
  const [acceptProposedFxRate] = useMutation(ACCEPT_PROPOSED_FX_RATE);
  const [generateVirtualAccount] = useMutation(GENERATE_VIRTUAL_ACCOUNT);
  const [acceptingRateFor, setAcceptingRateFor] = useState(null);

  const handleAcceptFxRate = async (vendorBusinessId, rate) => {
    if (!vendorBusinessId || !activeTxId) return;
    setAcceptingRateFor(vendorBusinessId);

    try {
      const result = await acceptProposedFxRate({
        variables: {
          txnId: String(activeTxId),
          rate: Number(rate),
          vendorBusinessId: String(vendorBusinessId),
        },
      });

      const txn = result?.data?.acceptProposedFxRate?.transaction;
      if (!txn) throw new Error("No transaction returned");

      // Bank-transfer FX acceptances don't get a virtual account generated
      // automatically the way LOCAL approvals do — fetch one now.
      let accountInfo = null;
      if (txn.transferMode === "BANK_TRANSFER") {
        try {
          const vaResult = await generateVirtualAccount({ variables: { txnId: String(txn.id) } });
          const info = vaResult?.data?.generateVirtualAccount?.accountInfo;
          if (info) {
            accountInfo = {
              account_number:              info.accountNumber,
              account_bank_name:           info.accountBankName,
              account_name:                info.accountName,
              amount:                      info.amount,
              reference:                   info.reference,
              account_expiration_datetime: info.accountExpirationDatetime,
              note:                        info.note,
              provider:                    info.provider,
              currency:                    info.currency,
            };
          }
        } catch (vaErr) {
          console.error(vaErr);
          toast.error("Rate accepted, but we couldn't generate a payment account. Try regenerating it below.");
        }
      }

      // The proposal-comparison phase is over — hand off from the inline
      // banner to the modal for the accept/payment flow.
      setFxProposal(null);
      setTxStatusModal((prev) => ({
        ...prev,
        isOpen: true,
        status: "approved",
        transactionInfo: {
          ...prev.transactionInfo,
          vendorName:   txn.business?.name || prev.transactionInfo.vendorName,
          amount:       txn.amount ?? prev.transactionInfo.amount,
          transferMode: txn.transferMode,
          accountInfo,
        },
      }));
      toast.success("Rate accepted! The vendor has been notified.");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(err?.graphQLErrors?.[0]?.message || "Failed to accept this rate. Please try again.");
    } finally {
      setAcceptingRateFor(null);
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

  // TEMP DEBUG — remove once FX banner visibility issue is diagnosed.
  console.log("[FX-DEBUG] render:", { fxProposal, fxBannerDismissed, activeTxId });

  return (
    <>
      {fxProposal && !fxBannerDismissed && (
        <FxProposalBanner
          tenderedAmount={fxProposal.tenderedAmount}
          sourceCurrency={fxProposal.sourceCurrency}
          destinationCurrency={fxProposal.destinationCurrency}
          marketRate={fxProposal.marketRate}
          proposedRates={fxProposal.proposedRates}
          noVendorsFound={fxProposal.noVendorsFound}
          onAcceptRate={handleAcceptFxRate}
          acceptingRateFor={acceptingRateFor}
          onDismiss={() => setFxBannerDismissed(true)}
          onRetry={() => {
            setFxBannerDismissed(true);
            setFxProposal(null);
            setActiveTxId(null);
            setShowFxModal(true);
          }}
        />
      )}

      <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-5 md:p-6">
        <div className="max-w-7xl mx-auto mt-14">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Client workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Welcome, {userData?.firstName || userData?.username || "there"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Find cash vendors and manage your transactions.</p>
          </div>
        </div>

        <WebPushSettings />

        {/* ── Analytics cards ─────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-600">Total transactions</h2>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><ArrowUpRight size={17} /></span>
              </div>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">
                {analyticsData?.analytics?.totalTransactions || 0}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-600">Fulfilled transaction value</h2>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ArrowUpRight size={17} /></span>
              </div>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">
                ₦{Number(analyticsData?.analytics?.totalTransactionValue || 0).toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-600">This month’s transaction value</h2>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><ArrowUpRight size={17} /></span>
              </div>
              <div className="text-3xl font-semibold tracking-tight text-slate-950">
                ₦{Number(analyticsData?.analytics?.currentMonthTransactionValue || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="w-full grid sm:grid-cols-1 md:grid-cols-2 gap-6 mt-10">

          {/* Nearby vendors */}
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-5 shadow-sm sm:p-5">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-slate-900">Nearby vendors</h2>
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
                <div key={store.id} className="rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
                  <div className="flex items-center justify-between gap-3 px-3 py-4 transition-colors hover:bg-slate-50 sm:px-4">
                    <div className="flex items-center">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getAvatarColor(index)}`}>
                        <span className="text-sm font-semibold">
                          {store.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 flex items-center gap-2">
                          {store?.name}
                          <div className="relative flex items-center justify-center ml-1">
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
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-800">Available cash ranges</h4>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Fee</p>
                        </div>
                        <div className="space-y-2.5">
                          {assetData?.businessAssets?.map((asset) => (
                            <div
                              key={asset.id}
                              className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                            >
                              <div className="min-w-0">
                                <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">Cash amount</span>
                                <span className="mt-0.5 block text-sm font-semibold text-slate-800">{formatRange(asset.range)}</span>
                              </div>
                              <div className="sm:text-right">
                                <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">Fee</span>
                                <span className="mt-0.5 block text-sm font-semibold text-indigo-700">₦{formatAmount(asset.chargeRate)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                <button
                                  onClick={() => handleInitiateTransaction(store, asset.id, asset.range, 'request')}
                                  className="min-h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:px-4"
                                >
                                  Request Cash
                                </button>

                                <button
                                  onClick={() => handleInitiateTransaction(store, asset.id, asset.range, 'deposit')}
                                  className="min-h-10 rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:px-4"
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
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-5 shadow-sm sm:p-5">
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
    </>
  );
}
