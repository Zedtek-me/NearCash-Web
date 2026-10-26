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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Banknote size={20} className="text-indigo-400" />
          <h2 className="pr-8 text-xl font-semibold tracking-tight text-slate-900">Request Foreign Exchange</h2>
        </div>
        <p className="mb-4 text-sm leading-6 text-slate-500">
          Tell us how much, and which currencies — nearby FX vendors will be notified
          and can offer you a rate.
        </p>

        {/* Currency pair */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Currency pair</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={sourceCurrency}
                onChange={(e) => onSourceCurrencyChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
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
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              title="Swap currencies"
            >
              <ArrowLeftRight size={16} />
            </button>

            <div className="relative flex-1">
              <select
                value={destinationCurrency}
                onChange={(e) => onDestinationCurrencyChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
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
          <p className="mt-1 text-xs text-slate-500">
            You're paying in <span className="text-slate-700">{getCurrencySymbol(sourceCurrency)} {sourceCurrency}</span>, requesting{" "}
            <span className="text-slate-700">{getCurrencySymbol(destinationCurrency)} {destinationCurrency}</span>.
          </p>
          {sameCurrency && (
            <p className="mt-1 text-xs text-red-600">
              Source and destination currencies must be different.
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {`${sourceCurrency} Amount you want`} {destinationCurrency ? ` (to be converted to ${destinationCurrency})` : ""}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
              {getCurrencySymbol(sourceCurrency)}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => onAmountChange(formatAmountInput(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-7 pr-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              placeholder={`Enter amount in ${sourceCurrency || "your preferred currency"}`}
            />
          </div>
        </div>

        {/* Payment method */}
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

        <button
          onClick={onSubmit}
          disabled={submitting || !canSubmit}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
          Send FX Request
        </button>
      </div>
    </div>
  );
}
