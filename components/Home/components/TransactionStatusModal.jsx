import React, { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const PROVIDER_CONFIG = {
  flutterwave: {
    label: "Flutterwave",
    bg: "#1a1000",
    border: "#f5a623",
    dot: "#f5a623",
    text: "#f5a623",
    logo: (
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#f5a623"/>
        <path d="M10 12 Q16 8 22 12 Q16 16 10 20 Q16 16 22 20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  paystack: {
    label: "Paystack",
    bg: "#001a0d",
    border: "#00c3a0",
    dot: "#00c3a0",
    text: "#00c3a0",
    logo: (
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#00c3a0"/>
        <rect x="9" y="13" width="14" height="3" rx="1.5" fill="#fff"/>
        <rect x="9" y="18" width="9" height="3" rx="1.5" fill="#fff"/>
      </svg>
    ),
  },
  anchor: {
    label: "Anchor",
    bg: "#0d0a1a",
    border: "#7c3aed",
    dot: "#7c3aed",
    text: "#a78bfa",
    logo: (
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#7c3aed"/>
        <path d="M16 9 L23 22 H9 Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" fill="none"/>
        <line x1="11" y1="18" x2="21" y2="18" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
};

function ProviderFooter({ provider }) {
  const key = provider?.toLowerCase();
  const config = PROVIDER_CONFIG[key];

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2.5 border-t"
      style={{
        background: config?.bg ?? "#0d1829",
        borderColor: config?.border ?? "#1e2d4a",
      }}
    >
      <span className="text-xs" style={{ color: "#475569" }}>Powered by</span>
      {config ? (
        <div className="flex items-center gap-1.5">
          {config.logo}
          <span className="text-xs font-semibold" style={{ color: config.text }}>
            {config.label}
          </span>
        </div>
      ) : (
        <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{provider}</span>
      )}
    </div>
  );
}

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
  onViewDetails,
  delayActionLoading = null,
}) {
  const [dots, setDots] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const expiredToastFired = useRef(false);

  useEffect(() => {
    if (status !== "loading") return;
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, [status]);

  // ── Virtual account countdown ─────────────────────────────────────────────
  useEffect(() => {
    const expiry = transactionInfo.accountInfo?.account_expiration_datetime;
    if (status !== "approved" || !expiry) {
      setSecondsLeft(null);
      expiredToastFired.current = false;
      return;
    }

    const getSecsLeft = () =>
      Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000));

    setSecondsLeft(getSecsLeft());
    expiredToastFired.current = false;

    const id = setInterval(() => {
      const s = getSecsLeft();
      setSecondsLeft(s);
      if (s === 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [status, transactionInfo.accountInfo?.account_expiration_datetime]);

  // Fire a one-time toast when the account expires
  useEffect(() => {
    if (secondsLeft === 0 && !expiredToastFired.current) {
      expiredToastFired.current = true;
      toast.error("Your virtual account has expired. A new account will be issued shortly.", {
        duration: 8000,
      });
    }
  }, [secondsLeft]);

  if (!isOpen) return null;

  const canClose = status !== "loading" && status !== "transferConfirmed";
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
                <p className="text-green-400 text-base font-medium mb-1">Transaction Accepted</p>
                <p className="text-slate-500 text-sm">
                  {transactionInfo.transferMode === "BANK_TRANSFER"
                    ? `Transfer exactly ₦${Number(transactionInfo.amount || 0).toLocaleString()} to the virtual account below to lock your request with the vendor`
                    : "Head to the vendor to collect your cash"}
                </p>
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

              {/* Virtual account — bank transfer only */}
              {transactionInfo.transferMode === "BANK_TRANSFER" && transactionInfo.accountInfo && (
                <div
                  className="w-full rounded-xl overflow-hidden"
                  style={{ background: "#0a1628", border: "0.5px solid #1d4ed8" }}
                >
                  <div className="p-4 space-y-2">
                    <p className="text-blue-400 text-xs font-semibold mb-3">Transfer to this account</p>
                    {[
                      ["Account Number", transactionInfo.accountInfo.account_number],
                      ["Bank", transactionInfo.accountInfo.account_bank_name],
                      ["Amount", `₦${Number(transactionInfo.accountInfo.amount || 0).toLocaleString()}`],
                      ["Reference", transactionInfo.accountInfo.reference],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: "#93c5fd" }}>{label}</span>
                        <span className="text-xs font-medium" style={{ color: "#bfdbfe" }}>{value}</span>
                      </div>
                    ))}

                    {/* Countdown row */}
                    {secondsLeft !== null && (() => {
                      const expired = secondsLeft === 0;
                      const urgent  = secondsLeft > 0 && secondsLeft <= 300; // ≤ 5 min
                      const m = Math.floor(secondsLeft / 60);
                      const s = secondsLeft % 60;
                      const label = expired
                        ? "Expired"
                        : m > 0
                        ? `${m}m ${String(s).padStart(2, "0")}s`
                        : `${s}s`;
                      const color = expired ? "#f87171" : urgent ? "#fbbf24" : "#4ade80";
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: "#93c5fd" }}>Expires in</span>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color }}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Expired banner */}
                    {secondsLeft === 0 && (
                      <div
                        className="flex items-start gap-2 mt-1 p-2.5 rounded-lg"
                        style={{ background: "#1c0a0a", border: "0.5px solid #7f1d1d" }}
                      >
                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#f87171" }} />
                        <p className="text-xs leading-relaxed" style={{ color: "#fca5a5" }}>
                          This virtual account has expired. A new account will be issued — please wait.
                        </p>
                      </div>
                    )}
                    {transactionInfo.accountInfo.note && (
                      <p className="text-xs text-center mt-2 leading-relaxed" style={{ color: "#60a5fa" }}>
                        {transactionInfo.accountInfo.note}
                      </p>
                    )}

                    <div
                      className="mt-3 p-3 rounded-lg space-y-2.5"
                      style={{ background: "#0f1f38", border: "0.5px solid #1e3a5f" }}
                    >
                      {[
                        "A release code is sent to you after transfer confirmation — share it with the vendor only once you have your cash in hand.",
                        `Funds are held in escrow by ${transactionInfo.accountInfo.provider ?? "our payment partner"} and released to the vendor only on completion.`,
                        "Full refund is issued automatically if the vendor declines or you cancel.",
                      ].map((note, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#60a5fa" }} />
                          <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {transactionInfo.accountInfo.provider && (
                    <ProviderFooter provider={transactionInfo.accountInfo.provider} />
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: "#16a34a" }}
                onMouseOver={e => e.currentTarget.style.background = "#15803d"}
                onMouseOut={e => e.currentTarget.style.background = "#16a34a"}
              >
                Got it, close
              </button>

              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="w-full py-2 rounded-xl text-xs transition-colors"
                  style={{ color: "#4ade80" }}
                  onMouseOver={e => e.currentTarget.style.color = "#86efac"}
                  onMouseOut={e => e.currentTarget.style.color = "#4ade80"}
                >
                  View transaction details
                </button>
              )}
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
                {/* Auto-assign — primary action */}
                <button
                  onClick={onAutoAssign}
                  disabled={!!delayActionLoading}
                  className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  style={{ background: "#78350f", color: "#fde68a" }}
                  onMouseOver={e => !delayActionLoading && (e.currentTarget.style.background = "#92400e")}
                  onMouseOut={e => e.currentTarget.style.background = "#78350f"}
                >
                  {delayActionLoading === "autoAssign" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Auto-assign nearest vendor
                </button>

                {/* Keep waiting */}
                <button
                  onClick={onKeepWaiting}
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
              </div>

              <p className="text-slate-600 text-xs text-center">
                Auto-assign will find and request the closest available vendor for you.
              </p>
            </>
          )}

          {/* ── TRANSFER CONFIRMED ──────────────────────── */}
          {status === "transferConfirmed" && (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#052e16", border: "2px solid #16a34a" }}
              >
                <CheckCircle2 size={30} className="text-green-400" />
              </div>

              <div className="text-center">
                <p className="text-green-400 text-base font-medium mb-1">Transfer confirmed!</p>
                <p className="text-slate-500 text-sm">Redirecting to your transaction details…</p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "#052e16" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-green-700 text-xs">Funds received by escrow</p>
              </div>
            </>
          )}

          {status === "noVendors" && (
  <>
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ background: "#1a1a2e", border: "2px solid #4f46e5" }}
    >
      {/* Shop/store-off icon */}
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1-5h16l1 5"/>
        <path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      </svg>
    </div>
 
    <div className="text-center">
      <p className="text-indigo-400 text-base font-medium mb-1">No vendors available</p>
      <p className="text-slate-500 text-sm leading-relaxed">
        All vendors in your area are currently busy or offline. Please check back shortly.
      </p>
    </div>
 
    <div
      className="w-full rounded-xl p-4 space-y-2"
      style={{ background: "#13102b", border: "0.5px solid #3730a3" }}
    >
      {[
        "Vendors may become available in a few minutes.",
        "Try again during peak service hours.",
        "New vendors are regularly added in your area.",
      ].map((tip, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
          <p className="text-indigo-300 text-xs leading-relaxed">{tip}</p>
        </div>
      ))}
    </div>
 
    <button
      onClick={onClose}
      className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
      style={{ background: "#3730a3", color: "#e0e7ff" }}
      onMouseOver={e => e.currentTarget.style.background = "#4338ca"}
      onMouseOut={e => e.currentTarget.style.background = "#3730a3"}
    >
      Close
    </button>
  </>
          )}
        </div>
      </div>
    </div>
  );
}