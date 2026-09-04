import React from "react";
import { X, Loader2, Check, Landmark, Banknote, ChevronDown, ArrowLeftRight } from "lucide-react";
import { formatAmountInput, getCurrencySymbol } from "../../../utils/transactionHelpers";

const CURRENCY_OPTIONS = ["NGN", "GHS", "KES", "ZAR", "USD", "GBP", "CAD", "AUD", "EUR"];

const TRANSFER_MODE_OPTIONS = [
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    description: "Transfer funds to a secure virtual account before collection.",
    Icon: Landmark,
  },
  {
    value: "CASH",
    label: "Cash",
    description: "Pay the vendor in cash on collection.",
    Icon: Banknote,
  },
];

/**
 * Modal through which a client requests a foreign-exchange transaction.
 * Unlike TransactionRequestModal, there is no vendor picked up-front —
 * nearby FX vendors are notified once the request is submitted, and can
 * bid on it. Rendered by ClientDashboard when the "FX" vendor filter is clicked.
 *
 * Only amount, the currency pair, and payment method are collected explicitly —
 * everything else (collection mode, location) is filled in implicitly.
 */
export default function FxRequestModal({
  amount,
  onAmountChange,
  sourceCurrency,
  onSourceCurrencyChange,
  destinationCurrency,
  onDestinationCurrencyChange,
  transferMode,
  onTransferModeChange,
  onSubmit,
  onClose,
  submitting,
}) {
  const sameCurrency = sourceCurrency && sourceCurrency === destinationCurrency;
  const canSubmit = amount && sourceCurrency && destinationCurrency && !sameCurrency && transferMode;

  const handleSwap = () => {
    onSourceCurrencyChange(destinationCurrency);
    onDestinationCurrencyChange(sourceCurrency);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-black border border-gray-700 rounded-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Banknote size={20} className="text-indigo-400" />
          <h2 className="text-xl font-bold text-gray-400">Request Foreign Exchange</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Tell us how much, and which currencies — nearby FX vendors will be notified
          and can offer you a rate.
        </p>

        {/* Currency pair */}
        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-400">Currency pair</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={sourceCurrency}
                onChange={(e) => onSourceCurrencyChange(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg pr-9"
              >
                {CURRENCY_OPTIONS.map((code) => (
                  <option key={code} value={code}>
                    {getCurrencySymbol(code)} {code}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSwap}
              className="p-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-400 transition-colors"
              title="Swap currencies"
            >
              <ArrowLeftRight size={16} />
            </button>

            <div className="relative flex-1">
              <select
                value={destinationCurrency}
                onChange={(e) => onDestinationCurrencyChange(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg pr-9"
              >
                {CURRENCY_OPTIONS.map((code) => (
                  <option key={code} value={code}>
                    {getCurrencySymbol(code)} {code}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            You're paying in <span className="text-gray-300">{getCurrencySymbol(sourceCurrency)} {sourceCurrency}</span>, requesting{" "}
            <span className="text-gray-300">{getCurrencySymbol(destinationCurrency)} {destinationCurrency}</span>.
          </p>
          {sameCurrency && (
            <p className="text-xs text-red-400 mt-1">
              Source and destination currencies must be different.
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="mb-5">
          <label className="block text-sm mb-1 text-gray-400">
            Amount you want{destinationCurrency ? ` (in ${destinationCurrency})` : ""}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              {getCurrencySymbol(destinationCurrency)}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => onAmountChange(formatAmountInput(e.target.value))}
              className="w-full pl-7 pr-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg"
              placeholder={`Enter amount in ${destinationCurrency || "your preferred currency"}`}
            />
          </div>
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
          disabled={submitting || !canSubmit}
          className="w-full py-2 bg-white text-black rounded-lg font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
          Send FX Request
        </button>
      </div>
    </div>
  );
}
