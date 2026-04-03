import React, { useState } from "react";
import { X, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { UPDATE_LIQUIDITY } from "../../Auths/mutations/userMutations";

/**
 * Shown once per login session when a vendor has an active business context.
 * Prompts the vendor to confirm their available liquidity or update it.
 *
 * Session tracking key: `liquidity_ack_<businessId>`
 */
const LiquidityBanner = ({ business, onDismiss }) => {
  const [mode, setMode] = useState("prompt"); // "prompt" | "update"
  const [inputValue, setInputValue] = useState(
    business.availableLiquidity != null ? String(business.availableLiquidity) : ""
  );

  const [updateLiquidity, { loading: saving }] = useMutation(UPDATE_LIQUIDITY);

  const handleConfirm = () => {
    sessionStorage.setItem(`liquidity_ack_${business.id}`, "1");
    onDismiss();
  };

  const handleSave = async () => {
    const val = parseFloat(inputValue);
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
              {mode === "prompt" ? (
                <p className="text-xs text-slate-300 mt-0.5">
                  {hasLiquidity
                    ? <>Your available liquidity is currently <span className="font-bold text-emerald-400">₦{Number(business.availableLiquidity).toLocaleString()}</span>. Does this match your physical cash?</>
                    : "You haven't set your available liquidity yet. Set it so the system can rank you accurately for nearby clients."}
                </p>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter amount"
                      className="pl-7 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
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
            </div>
          </div>

          {/* Actions */}
          {mode === "prompt" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
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
