import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Banknote, User, Hash, Zap, Building2, Check, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { useMutation } from "@apollo/client";
import { useWebSocket } from "../../Notification/WebSocketProvider";
import { ACCEPT_TRANSACTION_OPPORTUNITY } from "../../Auths/mutations/userMutations";
import { formatAmountInput, parseAmountInput } from "../../../utils/transactionHelpers";


export default function TransactionOpportunityModal({
  isOpen,
  opportunityData,
  onClose,
  onAccepted,
}) {
  const socket = useWebSocket();
  const [acceptOpportunity] = useMutation(ACCEPT_TRANSACTION_OPPORTUNITY);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failedMessage, setFailedMessage] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [proposedFee, setProposedFee] = useState("");
  const timeoutRef = useRef(null);

  const isV2V = opportunityData?.message_type === "Liquidity Request!";

  // Countdown after confirmed acceptance
  useEffect(() => {
    if (!accepted) return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          onClose();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [accepted, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
      setAccepting(false);
      setFailed(false);
      setFailedMessage(null);
      setCountdown(null);
      setProposedFee("");

      const businesses = opportunityData?.txn_info?.businesses ?? [];
      if (businesses.length === 1) {
        setSelectedBusiness(businesses[0]);
      } else {
        setSelectedBusiness(null);
      }
    }
  }, [isOpen, opportunityData]);

  // Listen for server response while acceptance is in-flight
  useEffect(() => {
    if (!accepting || !socket) return;

    const handleMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      const { message_type } = (data && typeof data === "object" ? data : {});

      if (message_type === "acceptance_ack") {
        clearTimeout(timeoutRef.current);
        setAccepting(false);
        setAccepted(true);
      } else if (message_type === "opportunity_lost") {
        clearTimeout(timeoutRef.current);
        setAccepting(false);
        setFailed(true);
      } else if (
        message_type === "error" &&
        (data?.message?.includes("couldn't find vendor with id:") ||
          data?.message?.includes("couldn't find a transaction with id:"))
      ) {
        clearTimeout(timeoutRef.current);
        setAccepting(false);
        setFailedMessage(data.message);
        setFailed(true);
      }
    };

    socket.addEventListener("message", handleMessage);

    // 15-second safety timeout — server should always reply, but guard anyway
    timeoutRef.current = setTimeout(() => {
      setAccepting(false);
      setFailed(true);
    }, 15000);

    return () => {
      socket.removeEventListener("message", handleMessage);
      clearTimeout(timeoutRef.current);
    };
  }, [accepting, socket]);

  if (!isOpen || !opportunityData) return null;

  const { txn_id, txn_ref, amount, client_name, businesses: buss_info, transfer_mode } = opportunityData.txn_info;
  const businesses = buss_info ?? [];

  // ── GraphQL mutation path (primary) ──────────────────────────────────────
  const handleAccept = async () => {
    if (!selectedBusiness) return;
    if (isV2V) {
      const fee = parseAmountInput(proposedFee);
      if (isNaN(fee) || fee <= 0) {
        setFailedMessage("Enter a valid fee amount to propose.");
        setFailed(true);
        return;
      }
    }

    setFailed(false);
    setFailedMessage(null);
    setAccepting(true);

    try {
      const variables = {
        txnId: String(txn_id),
        txnRef: txn_ref,
        businessId: String(selectedBusiness.id),
      };
      if (isV2V) {
        variables.proposedAmount = parseAmountInput(proposedFee);
        variables.isVendorToVendor = true;
      }
      const { data } = await acceptOpportunity({ variables });
      const result = data?.acceptTransactionOpportunity?.message;
      if (result === "opportunity_ack") {
        setAccepted(true);
        onAccepted?.(String(txn_id), transfer_mode);
      } else {
        setFailed(true);
      }
    } catch (err) {
      setFailedMessage(err?.graphQLErrors?.[0]?.message || err?.message || null);
      setFailed(true);
    } finally {
      setAccepting(false);
    }
  };

  /* WebSocket acceptance path (preserved for fallback / revert)
  const handleAcceptViaWebSocket = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!selectedBusiness) return;
    setFailed(false);
    setAccepting(true);
    try {
      socket.send(JSON.stringify({
        message_type: "opportunity_accepted",
        txn_id: String(txn_id),
        txn_ref: txn_ref,
        business_id: String(selectedBusiness.id),
      }));
    } catch (err) {
      setAccepting(false);
      setFailed(true);
    }
  };
  */

  const handleIgnore = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#0A0F1E",
          border: "0.5px solid #1E2D4A",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.08), 0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="h-1 w-full"
          style={{
            background: accepted
              ? "linear-gradient(90deg, #16a34a, #4ade80)"
              : failed
              ? "linear-gradient(90deg, #991b1b, #ef4444)"
              : "linear-gradient(90deg, #1d4ed8, #3b82f6, #6366f1)",
          }}
        />

        {!accepted && !accepting && (
          <button
            onClick={handleIgnore}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg transition-colors"
            style={{ color: "#475569" }}
            onMouseOver={e => e.currentTarget.style.color = "#94a3b8"}
            onMouseOut={e => e.currentTarget.style.color = "#475569"}
            title="Ignore this opportunity"
          >
            <X size={16} />
          </button>
        )}

        <div className="p-7">
          {/* PENDING / FORM STATE*/}
          {!accepted && !failed && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isV2V ? "#0d2a1a" : "#0d2044",
                    border: `0.5px solid ${isV2V ? "#166534" : "#1e40af"}`,
                  }}
                >
                  {isV2V
                    ? <ArrowLeftRight size={18} style={{ color: "#4ade80" }} />
                    : <Zap size={18} style={{ color: "#60a5fa" }} />}
                </div>
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-0.5"
                    style={{ color: isV2V ? "#4ade80" : "#3b82f6" }}
                  >
                    {isV2V ? "Vendor liquidity request" : "New opportunity"}
                  </p>
                  <h2
                    className="text-base font-semibold"
                    style={{ color: "#e2e8f0" }}
                  >
                    {isV2V ? "A nearby vendor needs cash" : "Cash withdrawal request"}
                  </h2>
                </div>
              </div>

              {/* Transaction details */}
              <div
                className="rounded-xl p-4 mb-5 space-y-3"
                style={{ background: "#0d1829", border: "0.5px solid #1e2d4a" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote size={14} style={{ color: "#64748b" }} />
                    <span className="text-xs" style={{ color: "#64748b" }}>Amount requested</span>
                  </div>
                  <span className="text-xl font-semibold" style={{ color: "#f1f5f9" }}>
                    ₦{Number(amount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="border-t" style={{ borderColor: "#1e2d4a" }} />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} style={{ color: "#64748b" }} />
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {isV2V ? "Requesting vendor" : "Client"}
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#cbd5e1" }}>
                    {client_name || "—"}
                  </span>
                </div>

                {txn_ref && (
                  <>
                    <div className="border-t" style={{ borderColor: "#1e2d4a" }} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash size={14} style={{ color: "#64748b" }} />
                        <span className="text-xs" style={{ color: "#64748b" }}>Reference</span>
                      </div>
                      <span className="text-xs font-mono" style={{ color: "#94a3b8" }}>
                        {txn_ref}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* ── BUSINESS SELECTOR ─────────────────────────────── */}
              {businesses.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Building2 size={13} style={{ color: "#64748b" }} />
                    <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                      {businesses.length === 1 ? "Accepting for" : "Select business to accept for"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {businesses.map((biz) => {
                      const isSelected = selectedBusiness?.id === biz.id;
                      return (
                        <button
                          key={biz.id}
                          onClick={() => setSelectedBusiness(biz)}
                          disabled={businesses.length === 1 || accepting}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                          style={{
                            background: isSelected ? "#0d2044" : "#0d1829",
                            border: `0.5px solid ${isSelected ? "#3b82f6" : "#1e2d4a"}`,
                            cursor: businesses.length === 1 || accepting ? "default" : "pointer",
                          }}
                          onMouseOver={e => {
                            if (businesses.length > 1 && !isSelected && !accepting) {
                              e.currentTarget.style.borderColor = "#2d4a7a";
                              e.currentTarget.style.background = "#0d1f38";
                            }
                          }}
                          onMouseOut={e => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#1e2d4a";
                              e.currentTarget.style.background = "#0d1829";
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: isSelected ? "#1e40af" : "#0f172a",
                                border: `0.5px solid ${isSelected ? "#3b82f6" : "#1e293b"}`,
                              }}
                            >
                              <Building2 size={13} style={{ color: isSelected ? "#93c5fd" : "#475569" }} />
                            </div>
                            <span
                              className="text-sm font-medium"
                              style={{ color: isSelected ? "#e2e8f0" : "#94a3b8" }}
                            >
                              {biz.name}
                            </span>
                          </div>

                          {isSelected && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: "#1d4ed8" }}
                            >
                              <Check size={11} style={{ color: "#fff" }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Propose fee input — V2V only */}
              {isV2V && (
                <div className="mb-5">
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "#64748b" }}
                  >
                    Your fee for this request
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                      style={{ color: "#64748b" }}
                    >
                      ₦
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={proposedFee}
                      onChange={(e) => setProposedFee(formatAmountInput(e.target.value))}
                      placeholder="e.g. 500"
                      disabled={accepting}
                      className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
                      style={{
                        background: "#0d1829",
                        border: "0.5px solid #1e3a5f",
                        color: "#e2e8f0",
                        outline: "none",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"}
                      onBlur={e => e.currentTarget.style.borderColor = "#1e3a5f"}
                    />
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: "#475569" }}>
                    The requesting vendor will see this and decide whether to accept your proposal.
                  </p>
                </div>
              )}

              <div
                className="rounded-lg px-3 py-2.5 mb-5 flex items-start gap-2"
                style={{
                  background: isV2V ? "#0d2a1a" : "#0d1829",
                  border: `0.5px solid ${isV2V ? "#166534" : "#1e3a5f"}`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: isV2V ? "#4ade80" : "#3b82f6" }}
                />
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                  {isV2V
                    ? <>
                        Proposing a fee means you agree to supply
                        <span style={{ color: "#86efac" }}> ₦{Number(amount || 0).toLocaleString()} </span>
                        cash to the requesting vendor if they accept your proposal.
                      </>
                    : <>
                        Accepting this request means you agree to provide
                        <span style={{ color: "#93c5fd" }}> ₦{Number(amount || 0).toLocaleString()} </span>
                        cash to the client at your location. Ensure you have sufficient cash available.
                      </>}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleIgnore}
                  disabled={accepting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                  style={{
                    background: "#0f172a",
                    color: "#64748b",
                    border: "0.5px solid #1e293b",
                  }}
                  onMouseOver={e => {
                    if (!accepting) {
                      e.currentTarget.style.background = "#1e293b";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = "#0f172a";
                    e.currentTarget.style.color = "#64748b";
                  }}
                >
                  Ignore
                </button>

                <button
                  onClick={handleAccept}
                  disabled={accepting || !selectedBusiness || (isV2V && !proposedFee)}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{
                    background: (!selectedBusiness || (isV2V && !proposedFee)) ? "#0f172a" : isV2V ? "#166534" : "#1d4ed8",
                    color: (!selectedBusiness || (isV2V && !proposedFee)) ? "#475569" : "#eff6ff",
                    border: (!selectedBusiness || (isV2V && !proposedFee)) ? "0.5px solid #1e293b" : "none",
                    cursor: !selectedBusiness || accepting || (isV2V && !proposedFee) ? "not-allowed" : "pointer",
                  }}
                  onMouseOver={e => {
                    if (selectedBusiness && !accepting && !(isV2V && !proposedFee))
                      e.currentTarget.style.background = isV2V ? "#14532d" : "#1e40af";
                  }}
                  onMouseOut={e => {
                    if (selectedBusiness && !(isV2V && !proposedFee))
                      e.currentTarget.style.background = isV2V ? "#166534" : "#1d4ed8";
                  }}
                >
                  {accepting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {isV2V ? "Submitting proposal…" : "Confirming…"}
                    </>
                  ) : (
                    <>
                      {isV2V ? <ArrowLeftRight size={15} /> : <Zap size={15} />}
                      {!selectedBusiness
                        ? "Select a business"
                        : isV2V
                        ? "Propose fee"
                        : "Accept transaction"}
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── ACCEPTED STATE ─────────────────────────────────────── */}
          {accepted && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="relative">
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#166534" strokeWidth="2" />
                  <circle
                    cx="36" cy="36" r="30"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="2.5"
                    strokeDasharray="188.5"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-base font-semibold mb-1" style={{ color: "#4ade80" }}>
                  {isV2V ? "Proposal submitted!" : "Transaction accepted!"}
                </p>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {isV2V
                    ? "Your fee proposal has been sent to the requesting vendor. You'll be notified if they accept."
                    : transfer_mode === "BANK_TRANSFER"
                    ? "Awaiting the client's bank transfer. You'll be notified once funds are confirmed."
                    : "The client has been notified. They will be heading to your location."}
                </p>
              </div>

              <div
                className="w-full rounded-xl p-3"
                style={{ background: "#052e16", border: "0.5px solid #166534" }}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-xs" style={{ color: "#86efac" }}>Amount</span>
                  <span className="text-xs font-medium" style={{ color: "#bbf7d0" }}>
                    ₦{Number(amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs" style={{ color: "#86efac" }}>Client</span>
                  <span className="text-xs font-medium" style={{ color: "#bbf7d0" }}>
                    {client_name || "—"}
                  </span>
                </div>
                {selectedBusiness && (
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: "#86efac" }}>Business</span>
                    <span className="text-xs font-medium" style={{ color: "#bbf7d0" }}>
                      {selectedBusiness.buss_name}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs" style={{ color: "#334155" }}>
                Closing in {countdown}s…
              </p>
            </div>
          )}

          {/* ── FAILED STATE ─────────────────────────────────────────── */}
          {failed && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#1c0a0a", border: "0.5px solid #7f1d1d" }}
              >
                <AlertTriangle size={28} style={{ color: "#f87171" }} />
              </div>

              <div>
                <p className="text-base font-semibold mb-1" style={{ color: "#f87171" }}>
                  {failedMessage ? "Error processing acceptance" : "Opportunity no longer available"}
                </p>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {failedMessage || "This transaction was already taken by another vendor or has expired."}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: "#1c0a0a",
                  color: "#f87171",
                  border: "0.5px solid #7f1d1d",
                }}
                onMouseOver={e => e.currentTarget.style.background = "#2d1010"}
                onMouseOut={e => e.currentTarget.style.background = "#1c0a0a"}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
