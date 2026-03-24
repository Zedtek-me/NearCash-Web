import React, { useEffect } from "react";
import { X, Loader2, Store, MapPin, Check, CreditCard, Landmark } from "lucide-react";
import { formatRange } from "../../../utils/transactionHelpers";

const COMBINED_MODE = "MEET_UP_AND_STORE_WALK_IN";

const TRANSFER_MODE_OPTIONS = [
  {
    value: "CARD",
    label: "Card Payment",
    description: "Pay by card when collecting cash from the vendor.",
    Icon: CreditCard,
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    description: "Transfer funds to a secure virtual account before collection.",
    Icon: Landmark,
  },
];

const MODE_OPTIONS = [
  {
    value: "STORE_WALK_IN",
    label: "Walk-in to Store",
    description: "Head to the vendor's physical store to collect your cash.",
    Icon: Store,
  },
  {
    value: "MEET_UP",
    label: "Meet-up",
    description: "The vendor will meet you at your location.",
    Icon: MapPin,
  },
];

const formatMode = (mode) =>
  MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;

/**
 * Modal through which a client initiates a cash withdrawal request.
 * Rendered by ClientDashboard when a vendor's asset row is clicked.
 */
export default function TransactionRequestModal({
  vendor,
  amount,
  onAmountChange,
  selectedPolicy,
  onSelectPolicy,
  transferMode,
  onTransferModeChange,
  policiesData,
  policiesLoading,
  onSubmit,
  onClose,
  submitting,
  assetRange,
}) {
  const rawMode = policiesData?.businessTransactionPolicyForUser?.cashCollectionMode;
  const isCombined = rawMode === COMBINED_MODE;

  // Auto-select when there is only one mode — no choice needed from the client.
  useEffect(() => {
    if (!isCombined && rawMode) onSelectPolicy(rawMode);
  }, [rawMode, isCombined]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-black border border-gray-700 rounded-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-400">
          Withdraw from {vendor?.name}
        </h2>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-400">Amount to Withdraw</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg"
            placeholder={assetRange ? `Range: ${formatRange(assetRange)}` : "Enter amount"}
          />
        </div>

        {/* Collection mode */}
        <div className="mb-5">
          <p className="text-sm mb-2 text-gray-400">
            {isCombined ? "Select mode of collection" : "Mode of collection"}
          </p>

          {policiesLoading ? (
            <p className="text-gray-500 text-sm">Loading policies…</p>
          ) : isCombined ? (
            /* ── Client picks one of the two options ── */
            <div className="grid grid-cols-2 gap-3">
              {MODE_OPTIONS.map(({ value, label, description, Icon }) => {
                const active = selectedPolicy === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSelectPolicy(value)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200 ${
                      active
                        ? "border-white bg-gray-800"
                        : "border-gray-600 bg-gray-900 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon
                        size={18}
                        className={active ? "text-white" : "text-gray-500"}
                      />
                      {active && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        active ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-xs text-gray-500 leading-snug">
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border border-white bg-gray-800 rounded-lg">
              {rawMode === "STORE_WALK_IN" ? (
                <Store size={16} className="text-gray-300 flex-shrink-0" />
              ) : (
                <MapPin size={16} className="text-gray-300 flex-shrink-0" />
              )}
              <span className="text-sm text-gray-300 flex-1">
                {formatMode(rawMode) ?? "—"}
              </span>
              <Check size={14} className="text-white flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="mb-5">
          <p className="text-sm mb-2 text-gray-400">Payment method</p>
          <div className="grid grid-cols-2 gap-3">
            {TRANSFER_MODE_OPTIONS.map(({ value, label, description, Icon }) => {
              const active = transferMode === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onTransferModeChange(value)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200 ${
                    active
                      ? "border-white bg-gray-800"
                      : "border-gray-600 bg-gray-900 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon size={18} className={active ? "text-white" : "text-gray-500"} />
                    {active && <Check size={14} className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${active ? "text-white" : "text-gray-400"}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-500 leading-snug">{description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={submitting || !selectedPolicy || !transferMode}
          className="w-full py-2 bg-white text-black rounded-lg font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
          Create Transaction
        </button>
      </div>
    </div>
  );
}
