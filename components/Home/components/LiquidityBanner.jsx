import React, { useState, useEffect } from "react";
import { X, CheckCircle, RefreshCw, AlertTriangle, ArrowLeftRight, Copy } from "lucide-react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { UPDATE_LIQUIDITY, INITIATE_VENDOR_TO_VENDOR_TRANSACTION, ACCEPT_PROPOSAL } from "../../Auths/mutations/userMutations";
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
  const [proposals, setProposals] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const socket   = useWebSocket();
  const navigate = useNavigate();

  const [updateLiquidity, { loading: saving }] = useMutation(UPDATE_LIQUIDITY);
  const [initiateVendorToVendor, { loading: sourcing }] = useMutation(INITIATE_VENDOR_TO_VENDOR_TRANSACTION);
  const [acceptProposal, {loading: accepting, error: acceptError }] = useMutation(ACCEPT_PROPOSAL);

  // While waiting for a supplier vendor to respond, listen for resolution events.
  useEffect(() => {
    if (mode !== "initiated" || !socket) return;

    const onMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      const { message_type } = (data && typeof data === "object" ? data : {});

      if (message_type === "Proposed Amount") {
        const incoming = data?.txn_info?.proposed_amounts;
        const txnTransfer = data?.txn_info?.transfer_mode;
        if (Array.isArray(incoming) && incoming.length > 0) {
          setProposals(incoming);
          setPendingTxnId(data?.txn_info?.txn_id ?? null);
          if(txnTransfer && txnTransfer == "BANK_TRANSFER") {
            const accountInfo = data?.txn_info?.account_info ?? null;
            setVirtualAccount(accountInfo);
          }
        }
      } else if (message_type === "No Available Vendors") {
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

  // Tick every second while proposals are live; prune expired ones.
  useEffect(() => {
    if (proposals.length === 0) return;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      setProposals((prev) => prev.filter((p) => new Date(p.expiry).getTime() > ts));
    }, 1000);
    return () => clearInterval(id);
  }, [proposals.length]);

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

  const handleAcceptProposal = async (proposedAmount, txnId, vendorBusinessId) => {
    try {
      await acceptProposal({
        variables: {
          proposedAmount: parseFloat(proposedAmount),
          txnId: String(txnId),
          vendorBusinessId: String(vendorBusinessId),
        }
      });
    }
    catch (err){
      toast.error(err?.message || "Failed to accept proposal. ", err);
    }
    if(acceptError){
      toast.error(acceptError?.message || "Failed to accept proposal.");
    };
    toast.success("Proposal accepted!");
    sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
    // only navigate immediately if it's not a bank transfer, otherwise wait for the "Transfer Confirmed" event to navigate
    setMode(transferMode === "BANK_TRANSFER" ? "transfer_pending" : "initiated");
    if((!virtualAccount || !virtualAccount?.account_number) && transferMode !== "BANK_TRANSFER"){
      setTimeout(() => navigate(`/transaction-details/${txnId}`), 2000);
    }
  }

  const hasLiquidity = business.availableLiquidity != null;

  const dismissBtn = (
    <button
      onClick={() => { sessionStorage.setItem(`liquidity_ack_${business.id}`, "1"); onDismiss(); }}
      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
      title="Dismiss"
    >
      <X size={16} />
    </button>
  );

  return (
    <div className="mt-16 w-full bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-4 py-4 shadow-md">
      <div className="max-w-7xl mx-auto">

        {/* ── PROMPT ─────────────────────────────────────────────────── */}
        {mode === "prompt" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-white flex-1 min-w-0">
                Liquidity Check — {business.name}
              </p>
              {dismissBtn}
            </div>
            <p className="text-xs text-slate-300 pl-7">
              {hasLiquidity
                ? <>Your available liquidity is currently <span className="font-bold text-indigo-400">₦{Number(business.availableLiquidity).toLocaleString()}</span>. Does this match your physical cash?</>
                : "You haven't set your available liquidity yet. Set it so the system can rank you accurately for nearby clients."}
            </p>
            <div className="flex flex-wrap items-center gap-2 pl-7">
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
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-500 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <ArrowLeftRight size={13} />
                Source Liquidity
              </button>
            </div>
          </div>
        )}

        {/* ── UPDATE ─────────────────────────────────────────────────── */}
        {mode === "update" && (
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Liquidity Check — {business.name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₦</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputValue}
                    onChange={(e) => setInputValue(formatAmountInput(e.target.value))}
                    placeholder="Enter amount"
                    className="pl-7 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            </div>
          </div>
        )}

        {/* ── SOURCE ─────────────────────────────────────────────────── */}
        {mode === "source" && (
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Source Liquidity — {business.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter the amount you need — we'll find a nearby vendor who can supply it.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
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
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₦</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sourceAmount}
                    onChange={(e) => setSourceAmount(formatAmountInput(e.target.value))}
                    placeholder="Amount to source"
                    className="pl-7 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>
        )}

        {/* ── INITIATED ──────────────────────────────────────────────── */}
        {mode === "initiated" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-white flex-1 min-w-0">
                {proposals.length > 0
                  ? "Vendors are proposing — select one to proceed."
                  : "Searching for nearby vendors…"}
              </p>
              {dismissBtn}
            </div>
            {proposals.length > 0 && (
              <div className="flex flex-col gap-2 pl-7">
                {proposals.map((p, i) => {
                  const expiryMs = new Date(p.expiry).getTime();
                  const totalMs  = 60 * 1000;
                  const timeLeft = Math.max(0, expiryMs - now);
                  const pct      = Math.min(100, (timeLeft / totalMs) * 100);
                  const secs     = Math.ceil(timeLeft / 1000);
                  const barColor = pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444";

                  return (
                    <div
                      key={p.vendor?.id ?? i}
                      className="rounded-lg overflow-hidden"
                      style={{ background: "rgba(51,65,85,0.5)", border: "1px solid rgba(71,85,105,0.4)" }}
                    >
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white truncate">
                            {p.vendor?.name ?? "Unknown Vendor"}
                          </span>
                          <span className="text-xs font-bold text-green-400">
                            ₦{Number(p.amount ?? 0).toLocaleString()} fee
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="text-[10px] font-mono tabular-nums"
                            style={{ color: barColor }}
                          >
                            {secs}s
                          </span>
                          {/* Accept button — mutation wired up later */}
                          <button
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                            style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }}
                            title="Accept coming soon"
                            onClick={ (e) => handleAcceptProposal(
                              p.amount,
                              pendingTxnId,
                              p.vendor?.id
                            ) }
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                      <div className="h-0.5 w-full" style={{ background: "rgba(71,85,105,0.4)" }}>
                        <div
                          className="h-full transition-all duration-1000 ease-linear"
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── UNAVAILABLE ────────────────────────────────────────────── */}
        {mode === "unavailable" && (
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">No vendors available</p>
              <p className="text-xs text-red-400 mt-0.5">
                No nearby vendors were available to fulfil your liquidity request.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { setSourceAmount(""); setMode("source"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-500 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <RefreshCw size={12} />
                Try Again
              </button>
              {dismissBtn}
            </div>
          </div>
        )}

        {/* ── TRANSFER PENDING ───────────────────────────────────────── */}
        {mode === "transfer_pending" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-white flex-1 min-w-0">
                Request approved — transfer to complete
              </p>
              <button
                onClick={() => {
                  sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
                  onDismiss();
                  if (pendingTxnId) navigate(`/transaction-details/${pendingTxnId}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              >
                View Txn
              </button>
            </div>
            {virtualAccount ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 pl-7">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Bank</p>
                  <p className="text-xs font-semibold text-white">{virtualAccount.account_bank_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Account No.</p>
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
              <p className="text-xs text-slate-400 pl-7">Loading account details…</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default LiquidityBanner;
