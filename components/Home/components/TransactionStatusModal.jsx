import React, { useEffect, useState } from "react";
import { X, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, MapPin } from "lucide-react";

/**
 * TransactionStatusModal
 *
 * Props:
 *  - isOpen          : boolean
 *  - status          : "loading" | "approved" | "declined" | "delayed"
 *  - transactionInfo : { amount, vendorName, transactionId }
 *  - onClose         : () => void   — only callable when status !== "loading"
 *  - onKeepWaiting   : () => void
 *  - onSelectVendor  : () => void   — opens vendor picker / closes modal so user can pick
 *  - onAutoAssign    : () => void   — calls BE mutation to auto-assign nearest vendor
 *  - delayActionLoading : "keepWaiting" | "selectVendor" | "autoAssign" | null
 */
export default function TransactionStatusModal({
  isOpen,
  status = "loading",
  transactionInfo = {},
  onClose,
  onKeepWaiting,
  onSelectVendor,
  onAutoAssign,
  delayActionLoading = null,
}) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (status !== "loading") return;
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, [status]);

  if (!isOpen) return null;

  const canClose = status !== "loading";
  const dotStr = ".".repeat(dots).padEnd(3, "\u00a0");

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{ background: "#0F172A", border: "0.5px solid #1E293B" }}
      >
        {/* Close — only visible once resolved */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-8 flex flex-col items-center gap-5">
          {/* ── LOADING ─────────────────────────────────── */}
          {status === "loading" && (
            <>
              <div className="relative w-16 h-16">
                <svg
                  viewBox="0 0 64 64"
                  className="w-16 h-16 animate-spin"
                  style={{ animationDuration: "1.4s" }}
                >
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="3"
                    strokeDasharray="90 130"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center">
                    <Loader2 size={16} className="text-blue-400 animate-spin" style={{ animationDuration: "0.9s" }} />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-100 text-base font-medium mb-1">
                  Processing transaction{dotStr}
                </p>
                <p className="text-slate-500 text-sm">
                  Waiting for vendor to respond
                </p>
              </div>

              {/* Progress steps */}
              <div className="w-full bg-slate-800/60 rounded-xl p-4 space-y-3">
                {[
                  { label: "Transaction created", done: true },
                  { label: "Notifying vendor", done: true, active: false },
                  { label: "Awaiting vendor approval", done: false, active: true },
                  { label: "Ready for collection", done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.done
                          ? "bg-blue-600"
                          : step.active
                          ? "bg-blue-900 border border-blue-500"
                          : "bg-slate-700"
                      }`}
                    >
                      {step.done ? (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : step.active ? (
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      ) : null}
                    </div>
                    <span
                      className={`text-sm ${
                        step.done
                          ? "text-slate-300"
                          : step.active
                          ? "text-blue-300 font-medium"
                          : "text-slate-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-slate-400 text-xs">Please keep this screen open</p>
              </div>
            </>
          )}

          {/* ── APPROVED ────────────────────────────────── */}
          {status === "approved" && (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#052e16", border: "2px solid #16a34a" }}
              >
                <CheckCircle2 size={30} className="text-green-400" />
              </div>

              <div className="text-center">
                <p className="text-green-400 text-base font-medium mb-1">Transaction approved</p>
                <p className="text-slate-500 text-sm">Head to the vendor to collect your cash</p>
              </div>

              {/* Details card */}
              <div
                className="w-full rounded-xl p-4 space-y-2"
                style={{ background: "#0D1F12", border: "0.5px solid #166534" }}
              >
                {[
                  ["Amount", `₦${Number(transactionInfo.amount || 0).toLocaleString()}`],
                  ["Vendor", transactionInfo.vendorName || "—"],
                  ["Transaction ID", transactionInfo.transactionId ? `#${transactionInfo.transactionId}` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-green-800 text-xs" style={{ color: "#86efac" }}>{label}</span>
                    <span className="text-xs font-medium" style={{ color: "#bbf7d0" }}>{value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: "#16a34a" }}
                onMouseOver={e => e.currentTarget.style.background = "#15803d"}
                onMouseOut={e => e.currentTarget.style.background = "#16a34a"}
              >
                Got it, close
              </button>
            </>
          )}

          {/* ── DECLINED ────────────────────────────────── */}
          {status === "declined" && (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#1c0505", border: "2px solid #dc2626" }}
              >
                <XCircle size={30} className="text-red-400" />
              </div>

              <div className="text-center">
                <p className="text-red-400 text-base font-medium mb-1">Transaction declined</p>
                <p className="text-slate-500 text-sm">
                  The vendor was unable to fulfil this request
                </p>
              </div>

              <div
                className="w-full rounded-xl p-4"
                style={{ background: "#1c0505", border: "0.5px solid #7f1d1d" }}
              >
                <p className="text-red-300 text-xs text-center leading-relaxed">
                  Your transaction has been declined. No funds have been moved.
                  You can try requesting cash from another vendor.
                </p>
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: "#991b1b", color: "#fecaca" }}
                  onMouseOver={e => e.currentTarget.style.background = "#7f1d1d"}
                  onMouseOut={e => e.currentTarget.style.background = "#991b1b"}
                >
                  Close &amp; try another vendor
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </>
          )}

          {/* ── DELAYED ─────────────────────────────────── */}
          {status === "delayed" && (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#1c1205", border: "2px solid #d97706" }}
              >
                <Clock size={30} className="text-amber-400" />
              </div>

              <div className="text-center">
                <p className="text-amber-400 text-base font-medium mb-1">Vendor is taking a while</p>
                <p className="text-slate-500 text-sm">How would you like to proceed?</p>
              </div>

              <div className="w-full space-y-2">
                {/* Keep waiting */}
                <button
                  onClick={onKeepWaiting}
                  disabled={!!delayActionLoading}
                  className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  style={{ background: "#78350f", color: "#fde68a" }}
                  onMouseOver={e => !delayActionLoading && (e.currentTarget.style.background = "#92400e")}
                  onMouseOut={e => e.currentTarget.style.background = "#78350f"}
                >
                  {delayActionLoading === "keepWaiting" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Clock size={14} />
                  )}
                  Keep waiting for this vendor
                </button>

                {/* Select another vendor */}
                <button
                  onClick={onSelectVendor}
                  disabled={!!delayActionLoading}
                  className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  style={{
                    background: "#1e293b",
                    color: "#94a3b8",
                    border: "0.5px solid #334155",
                  }}
                  onMouseOver={e => !delayActionLoading && (e.currentTarget.style.background = "#263244")}
                  onMouseOut={e => e.currentTarget.style.background = "#1e293b"}
                >
                  {delayActionLoading === "selectVendor" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <MapPin size={14} />
                  )}
                  Select a different vendor
                </button>

                {/* Auto-assign */}
                <button
                  onClick={onAutoAssign}
                  disabled={!!delayActionLoading}
                  className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  style={{
                    background: "#1e293b",
                    color: "#94a3b8",
                    border: "0.5px solid #334155",
                  }}
                  onMouseOver={e => !delayActionLoading && (e.currentTarget.style.background = "#263244")}
                  onMouseOut={e => e.currentTarget.style.background = "#1e293b"}
                >
                  {delayActionLoading === "autoAssign" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Auto-assign nearest vendor
                </button>
              </div>

              <p className="text-slate-600 text-xs text-center">
                Auto-assign will find and request the closest available vendor for you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}