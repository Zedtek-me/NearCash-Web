import React, { useState, useEffect } from "react";
import { X, Loader2, Banknote, User, Hash, Zap } from "lucide-react";
import { useWebSocket } from "../../Notification/WebSocketProvider";
import useAuth from "../../../Hooks/Auths";


export default function TransactionOpportunityModal({
  isOpen,
  opportunityData,
  onClose,
}) {
  const socket = useWebSocket();
  const { userData } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Auto-close after accept with a short celebration countdown
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

  // Reset internal state whenever a fresh opportunity opens
  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
      setAccepting(false);
      setCountdown(null);
    }
  }, [isOpen]);

  if (!isOpen || !opportunityData) return null;

  const { txn_id, txn_ref, amount, client_name } = opportunityData;

  const handleAccept = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not open — cannot accept transaction");
      return;
    }

    setAccepting(true);

    const message = {
      message_type: "opportunity_accepted",
      txn_id: String(txn_id),
      txn_ref: txn_ref,
      business_id: String(userData?.selectedBusiness?.id ?? userData?.businessId ?? ""),
    };

    try {
      socket.send(JSON.stringify(message));
      setAccepted(true);
    } catch (err) {
      console.error("Failed to send acceptance:", err);
    } finally {
      setAccepting(false);
    }
  };

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
              : "linear-gradient(90deg, #1d4ed8, #3b82f6, #6366f1)",
          }}
        />

        {!accepted && (
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
          {!accepted && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0d2044", border: "0.5px solid #1e40af" }}
                >
                  <Zap size={18} style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-0.5"
                    style={{ color: "#3b82f6" }}
                  >
                    New opportunity
                  </p>
                  <h2
                    className="text-base font-semibold"
                    style={{ color: "#e2e8f0" }}
                  >
                    Cash withdrawal request
                  </h2>
                </div>
              </div>

              <div
                className="rounded-xl p-4 mb-5 space-y-3"
                style={{ background: "#0d1829", border: "0.5px solid #1e2d4a" }}
              >
                {/* Amount — prominent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote size={14} style={{ color: "#64748b" }} />
                    <span className="text-xs" style={{ color: "#64748b" }}>Amount requested</span>
                  </div>
                  <span
                    className="text-xl font-semibold"
                    style={{ color: "#f1f5f9" }}
                  >
                    ₦{Number(amount || 0).toLocaleString()}
                  </span>
                </div>

                <div
                  className="border-t"
                  style={{ borderColor: "#1e2d4a" }}
                />

                {/* Client name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} style={{ color: "#64748b" }} />
                    <span className="text-xs" style={{ color: "#64748b" }}>Client</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#cbd5e1" }}>
                    {client_name || "—"}
                  </span>
                </div>

                {/* Ref */}
                {txn_ref && (
                  <>
                    <div
                      className="border-t"
                      style={{ borderColor: "#1e2d4a" }}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash size={14} style={{ color: "#64748b" }} />
                        <span className="text-xs" style={{ color: "#64748b" }}>Reference</span>
                      </div>
                      <span
                        className="text-xs font-mono"
                        style={{ color: "#94a3b8" }}
                      >
                        {txn_ref}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div
                className="rounded-lg px-3 py-2.5 mb-5 flex items-start gap-2"
                style={{ background: "#0d1829", border: "0.5px solid #1e3a5f" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "#3b82f6" }}
                />
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                  Accepting this request means you agree to provide
                  <span style={{ color: "#93c5fd" }}> ₦{Number(amount || 0).toLocaleString()} </span>
                  cash to the client at your location. Ensure you have sufficient cash available.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleIgnore}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: "#0f172a",
                    color: "#64748b",
                    border: "0.5px solid #1e293b",
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = "#1e293b";
                    e.currentTarget.style.color = "#94a3b8";
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
                  disabled={accepting}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: "#1d4ed8", color: "#eff6ff" }}
                  onMouseOver={e => !accepting && (e.currentTarget.style.background = "#1e40af")}
                  onMouseOut={e => e.currentTarget.style.background = "#1d4ed8"}
                >
                  {accepting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Accepting…
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Accept transaction
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── ACCEPTED STATE ─────────────────────────────────────── */}
          {accepted && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              {/* Animated checkmark ring */}
              <div className="relative">
                <svg
                  width="72" height="72" viewBox="0 0 72 72"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="36" cy="36" r="30"
                    fill="none"
                    stroke="#166534"
                    strokeWidth="2"
                  />
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
                <div
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-base font-semibold mb-1" style={{ color: "#4ade80" }}>
                  Transaction accepted!
                </p>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  The client has been notified. They will be heading to your location.
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
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "#86efac" }}>Client</span>
                  <span className="text-xs font-medium" style={{ color: "#bbf7d0" }}>
                    {client_name || "—"}
                  </span>
                </div>
              </div>

              <p className="text-xs" style={{ color: "#334155" }}>
                Closing in {countdown}s…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}