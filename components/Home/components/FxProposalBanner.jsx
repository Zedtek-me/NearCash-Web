import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, X, Loader2, Check, RefreshCw } from "lucide-react";
import { getCurrencySymbol } from "../../../utils/transactionHelpers";

/**
 * Inline, non-blocking banner showing FX vendors proposing rates for a
 * client's pending request — mirrors the vendor-to-vendor LiquidityBanner's
 * "initiated" pattern (live countdown progress bars, inline Accept button)
 * instead of a blocking modal, so the client can keep using the dashboard
 * while offers come in.
 */
export default function FxProposalBanner({
  tenderedAmount,
  sourceCurrency,
  destinationCurrency,
  marketRate,
  proposedRates = [],
  noVendorsFound = false,
  onAcceptRate,
  acceptingRateFor,
  onDismiss,
  onRetry,
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const rateSymbol = getCurrencySymbol(sourceCurrency || "NGN");
  const tenderedLabel = `${rateSymbol}${Number(tenderedAmount || 0).toLocaleString()}`;

  // Only show offers that haven't expired yet — pruned, not just dimmed,
  // matching the vendor-to-vendor liquidity banner's behavior.
  const liveProposals = proposedRates.filter(
    (p) => !p?.expiry || new Date(p.expiry).getTime() > now
  );

  const dismissBtn = (
    <button
      onClick={onDismiss}
      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
      title="Dismiss"
    >
      <X size={16} />
    </button>
  );

  return (
    <div className="mt-16 w-full bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-4 py-4 shadow-md">
      <div className="max-w-7xl mx-auto">
        {noVendorsFound ? (
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">No FX vendors available</p>
              <p className="text-xs text-red-400 mt-0.5">
                No nearby FX vendors could fulfil your {tenderedLabel} request for {destinationCurrency}.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-500 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <RefreshCw size={12} />
                  Try Again
                </button>
              )}
              {dismissBtn}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              {liveProposals.length === 0 ? (
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingUp size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-semibold text-white flex-1 min-w-0">
                {liveProposals.length > 0
                  ? `Vendors are proposing rates for your ${tenderedLabel} request — pick the best one.`
                  : `Nearby FX vendors have been notified about your ${tenderedLabel} request — searching…`}
              </p>
              {dismissBtn}
            </div>

            {marketRate ? (
              <p className="text-xs text-slate-400 pl-7">
                Market rate for reference:{" "}
                <span className="text-indigo-300 font-semibold">
                  {rateSymbol}{Number(marketRate).toLocaleString()}
                </span>
              </p>
            ) : null}

            {liveProposals.length > 0 && (
              <div className="flex flex-col gap-2 pl-7">
                {liveProposals.map((p, i) => {
                  const vendorId  = p?.vendor?.id;
                  const expiryMs  = p?.expiry ? new Date(p.expiry).getTime() : null;
                  const totalMs   = 60 * 1000;
                  const timeLeft  = expiryMs ? Math.max(0, expiryMs - now) : null;
                  const pct       = expiryMs ? Math.min(100, (timeLeft / totalMs) * 100) : 100;
                  const secs      = expiryMs ? Math.ceil(timeLeft / 1000) : null;
                  const barColor  = pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444";

                  return (
                    <div
                      key={vendorId ?? i}
                      className="rounded-lg overflow-hidden"
                      style={{ background: "rgba(51,65,85,0.5)", border: "1px solid rgba(71,85,105,0.4)" }}
                    >
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white truncate">
                            {p?.vendor?.name ?? "Unknown Vendor"}
                          </span>
                          <span className="text-xs font-bold text-green-400">
                            {rateSymbol}{Number(p?.proposed_rate ?? 0).toLocaleString()} rate
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {secs != null && (
                            <span className="text-[10px] font-mono tabular-nums" style={{ color: barColor }}>
                              {secs}s
                            </span>
                          )}
                          <button
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }}
                            disabled={!!acceptingRateFor}
                            onClick={() => onAcceptRate(vendorId, p?.proposed_rate)}
                          >
                            {acceptingRateFor === vendorId ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            Accept
                          </button>
                        </div>
                      </div>
                      {expiryMs && (
                        <div className="h-0.5 w-full" style={{ background: "rgba(71,85,105,0.4)" }}>
                          <div
                            className="h-full transition-all duration-1000 ease-linear"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
