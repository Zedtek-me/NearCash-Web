import React from "react";
import { X, Loader2 } from "lucide-react";

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
  policiesData,
  policiesLoading,
  onSubmit,
  onClose,
  submitting,
}) {
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
            placeholder="Enter amount"
          />
        </div>

        {/* Collection mode */}
        <div className="mb-4">
          <p className="text-sm mb-2 text-gray-400">Select mode of collection</p>
          {policiesLoading ? (
            <p className="text-gray-500 text-sm">Loading policies…</p>
          ) : (
            <div
              onClick={() =>
                onSelectPolicy(policiesData?.businessTransactionPolicyForUser?.cashCollectionMode)
              }
              className={`p-3 border rounded-lg cursor-pointer ${
                selectedPolicy ? "border-white bg-gray-800" : "border-gray-600"
              }`}
            >
              <p className="text-sm text-gray-400">
                Mode: {policiesData?.businessTransactionPolicyForUser?.cashCollectionMode ?? "—"}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-2 bg-white text-black rounded-lg font-semibold flex items-center justify-center"
        >
          {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
          Create Transaction
        </button>
      </div>
    </div>
  );
}
