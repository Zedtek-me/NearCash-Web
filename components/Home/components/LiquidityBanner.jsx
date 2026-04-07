import React, { useState, useEffect } from "react";
import { X, CheckCircle, RefreshCw, AlertTriangle, ArrowLeftRight, Copy } from "lucide-react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { UPDATE_LIQUIDITY, INITIATE_VENDOR_TO_VENDOR_TRANSACTION } from "../../Auths/mutations/userMutations";
import { formatAmountInput, parseAmountInput } from "../../../utils/transactionHelpers";
import { useWebSocket } from "../../Notification/WebSocketProvider";

/**
 * Shown once per login session when a vendor has an active business context.
 * Prompts the vendor to confirm their available liquidity or update it.
 *
 * Session tracking key: `liquidity_ack_<businessId>`
 */
const LiquidityBanner = ({ business, onDismiss }) => {
  const [mode, setMode] = useState("prompt"); // "prompt" | "update" | "source" | "initiated" | "unavailable" | "transfer_pending"
  const [inputValue, setInputValue] = useState(
    business.availableLiquidity != null ? String(business.availableLiquidity) : ""
  );
  const [sourceAmount, setSourceAmount] = useState("");
  const [transferMode, setTransferMode] = useState("BANK_TRANSFER");
  const [pendingTxnId, setPendingTxnId] = useState(null);
  const [virtualAccount, setVirtualAccount] = useState(null);

  const socket   = useWebSocket();
  const navigate = useNavigate();

  const [updateLiquidity, { loading: saving }] = useMutation(UPDATE_LIQUIDITY);
  const [initiateVendorToVendor, { loading: sourcing }] = useMutation(INITIATE_VENDOR_TO_VENDOR_TRANSACTION);

  // While waiting for a supplier vendor to respond, listen for resolution events.
  useEffect(() => {
    if (mode !== "initiated" || !socket) return;

    const onMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      const { message_type } = (data && typeof data === "object" ? data : {});

      if (message_type === "No Available Vendors") {
        setMode("unavailable");
      } else if (message_type === "Transaction Approved!") {
        const txnId       = data?.txn_info?.txn_id;
        const txnTransfer = data?.txn_info?.transfer_mode;
        if (txnTransfer === "BANK_TRANSFER" && txnId) {
          setPendingTxnId(txnId);
          setVirtualAccount(data?.txn_info?.account_info ?? null);
          setMode("transfer_pending");
        } else {
          sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
          onDismiss();
          if (txnId) navigate(`/transaction-details/${txnId}`);
        }
      }
    };

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
  }, [mode, socket, business.id, onDismiss, navigate]);

  // Once in transfer_pending, navigate automatically when transfer is confirmed.
  useEffect(() => {
    if (mode !== "transfer_pending" || !socket) return;

    const onMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      const { message_type } = (data && typeof data === "object" ? data : {});

      if (message_type === "Transfer Confirmed") {
        sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
        onDismiss();
        if (pendingTxnId) navigate(`/transaction-details/${pendingTxnId}`);
      }
    };

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
  }, [mode, socket, business.id, pendingTxnId, onDismiss, navigate]);

  const handleConfirm = () => {
    sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
    onDismiss();
  };

  const handleSave = async () => {
    const val = parseAmountInput(inputValue);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid liquidity amount.");
      return;
    }
    try {
      await updateLiquidity({
        variables: { businessId: business.id, availableLiquidity: val },
      });
      toast.success("Liquidity updated successfully!");
      sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
      onDismiss();
    } catch (err) {
      toast.error(err?.message || "Failed to update liquidity.");
    }
  };

  const handleSource = async () => {
    const val = parseAmountInput(sourceAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter a valid amount to source.");
      return;
    }
    try {
      await initiateVendorToVendor({
        variables: {
          data: {
            amount: val,
            txnType: business.businessType,
            currencyCode: business.currency,
            businessId: business.id,
            transferMode,
          },
        },
      });
      setMode("initiated");
    } catch (err) {
      toast.error(err?.message || "Failed to initiate sourcing request.");
    }
  };

  const hasLiquidity = business.availableLiquidity != null;

  return (
    <div className="mt-16 w-full bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-4 py-4 shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Icon + text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 flex-shrink-0">
              <AlertTriangle size={18} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Liquidity Check — {business.name}
              </p>
              {mode === "prompt" && (
                <p className="text-xs text-slate-300 mt-0.5">
                  {hasLiquidity
                    ? <>Your available liquidity is currently <span className="font-bold text-indigo-400">₦{Number(business.availableLiquidity).toLocaleString()}</span>. Does this match your physical cash?</>
                    : "You haven't set your available liquidity yet. Set it so the system can rank you accurately for nearby clients."}
                </p>
              )}

              {mode === "update" && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputValue}
                      onChange={(e) => setInputValue(formatAmountInput(e.target.value))}
                      placeholder="Enter amount"
                      className="pl-7 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                      : <><CheckCircle size={13} /> Save</>}
                  </button>
                  <button
                    onClick={() => setMode("prompt")}
                    className="px-3 py-2 text-xs text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {mode === "source" && (
                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-xs text-slate-400">
                    Enter the amount you need — we'll find a nearby vendor who can supply it.
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Transfer via:</span>
                    <button
                      onClick={() => setTransferMode("BANK_TRANSFER")}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${transferMode === "BANK_TRANSFER" ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-600 text-slate-300 hover:border-slate-400"}`}
                    >
                      Bank Transfer
                    </button>
                    <button
                      onClick={() => setTransferMode("CARD")}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${transferMode === "CARD" ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-600 text-slate-300 hover:border-slate-400"}`}
                    >
                      Card
                    </button>
                  </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={sourceAmount}
                      onChange={(e) => setSourceAmount(formatAmountInput(e.target.value))}
                      placeholder="Amount to source"
                      className="pl-7 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSource}
                    disabled={sourcing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sourcing
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Initiating…</>
                      : <><ArrowLeftRight size={13} /> Initiate</>}
                  </button>
                  <button
                    onClick={() => setMode("prompt")}
                    className="px-3 py-2 text-xs text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                </div>
              )}

              {mode === "initiated" && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-xs text-slate-300">
                    Searching for nearby vendors who can supply your liquidity…
                  </p>
                </div>
              )}

              {mode === "unavailable" && (
                <p className="text-xs text-red-400 mt-1">
                  No nearby vendors were available to fulfil your liquidity request. You can try again later.
                </p>
              )}

              {mode === "transfer_pending" && (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-xs text-green-400 font-semibold">
                    Request approved! Transfer the amount below to complete the transaction.
                  </p>
                  {virtualAccount ? (
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-0.5">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Bank</p>
                        <p className="text-xs font-semibold text-white">{virtualAccount.account_bank_name ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Account Number</p>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(virtualAccount.account_number); toast.success("Copied!"); }}
                          className="flex items-center gap-1 text-xs font-mono font-semibold text-indigo-300 hover:text-white transition-colors"
                        >
                          {virtualAccount.account_number ?? "—"}
                          <Copy size={11} className="flex-shrink-0" />
                        </button>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Account Name</p>
                        <p className="text-xs font-semibold text-white">{virtualAccount.account_name ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Amount</p>
                        <p className="text-xs font-semibold text-green-400">₦{Number(virtualAccount.amount ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Loading account details…</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions — initiated mode */}
          {mode === "initiated" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { sessionStorage.setItem(`liquidity_ack_${business.id}`, "1"); onDismiss(); }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Actions — transfer_pending mode */}
          {mode === "transfer_pending" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
                  onDismiss();
                  if (pendingTxnId) navigate(`/transaction-details/${pendingTxnId}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                View Transaction
              </button>
            </div>
          )}

          {/* Actions — unavailable mode */}
          {mode === "unavailable" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { setSourceAmount(""); setMode("source"); }}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-500 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
              <button
                onClick={() => { sessionStorage.setItem(`liquidity_ack_${business.id}`, "1"); onDismiss(); }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Actions */}
          {mode === "prompt" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <CheckCircle size={13} />
                {hasLiquidity ? "Confirmed" : "Set Later"}
              </button>
              <button
                onClick={() => setMode("update")}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-500 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <RefreshCw size={13} />
                {hasLiquidity ? "Update Liquidity" : "Set Now"}
              </button>
              <button
                onClick={() => setMode("source")}
                title="Request cash from a nearby vendor to top up your liquidity"
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-500 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <ArrowLeftRight size={13} />
                Source Liquidity
              </button>
              <button
                onClick={handleConfirm}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiquidityBanner;
