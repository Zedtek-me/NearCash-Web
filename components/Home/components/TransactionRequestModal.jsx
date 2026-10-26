import React, { useEffect } from "react";
import { X, Loader2, Store, MapPin, Check, CreditCard, Landmark } from "lucide-react";
import { formatRange, formatAmountInput } from "../../../utils/transactionHelpers";

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
  transactionType = 'request',
  hidePaymentMethod = false,
}) {
  const rawMode = policiesData?.businessTransactionPolicyForUser?.cashCollectionMode;
  const isCombined = rawMode === COMBINED_MODE;

  // Auto-select when there is only one mode — no choice needed from the client.
  useEffect(() => {
    if (!isCombined && rawMode) onSelectPolicy(rawMode);
  }, [rawMode, isCombined]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={20} />
        </button>

        <h2 className="mb-4 pr-8 text-xl font-semibold tracking-tight text-slate-900">
          {transactionType === 'deposit' ? `Deposit to ${vendor?.name}` : `Withdraw from ${vendor?.name}`}
        </h2>

        {/* Amount */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Amount to Withdraw</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => onAmountChange(formatAmountInput(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
            placeholder={assetRange ? `Range: ${formatRange(assetRange)}` : "Enter amount"}
          />
        </div>

        {/* Collection mode */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-slate-700">
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
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon
                        size={18}
                        className={active ? "text-indigo-600" : "text-slate-500"}
                      />
                      {active && (
                        <Check size={14} className="text-indigo-600" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        active ? "text-indigo-800" : "text-slate-700"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-xs leading-snug text-slate-500">
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              {rawMode === "STORE_WALK_IN" ? (
                <Store size={16} className="flex-shrink-0 text-indigo-600" />
              ) : (
                <MapPin size={16} className="flex-shrink-0 text-indigo-600" />
              )}
              <span className="flex-1 text-sm text-slate-700">
                {formatMode(rawMode) ?? "—"}
              </span>
              <Check size={14} className="flex-shrink-0 text-indigo-600" />
            </div>
          )}
        </div>

        {/* Payment method */}
        {!hidePaymentMethod && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-slate-700">Payment method</p>
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
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                    <Icon size={18} className={active ? "text-indigo-600" : "text-slate-500"} />
                    {active && <Check size={14} className="text-indigo-600" />}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-indigo-800" : "text-slate-700"}`}>
                      {label}
                    </span>
                  <span className="text-xs leading-snug text-slate-500">{description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={submitting || !selectedPolicy || (!hidePaymentMethod && !transferMode)}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
          {transactionType === 'deposit' ? 'Create Deposit' : 'Create Transaction'}
        </button>
      </div>
    </div>
  );
}
