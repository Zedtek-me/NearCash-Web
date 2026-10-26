import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { UPDATE_TRANSACTION_STATUS } from "../Auths/mutations/userMutations";
import { useNavigate } from "react-router";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { formatTxnAmount, formatTxnCharge, getFxSourceCurrency } from "../../utils/transactionHelpers";

export default function TransactionCard({ transaction, index, refetch, onReject, onViewDetails, isVendor, isOutgoing, isAwaitingTransfer }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!open) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      setOpen(false);
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);
   const [updateStatus] = useMutation(UPDATE_TRANSACTION_STATUS);
    const navigate = useNavigate()


  const getAvatarColor = (index) => {
    const colors = ['bg-indigo-50 text-indigo-700', 'bg-slate-100 text-slate-700', 'bg-violet-50 text-violet-700', 'bg-sky-50 text-sky-700', 'bg-emerald-50 text-emerald-700'];
    return colors[index % colors.length];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'FULFILLED': return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'INITIATED': return 'border border-amber-200 bg-amber-50 text-amber-700';
      case 'CANCELLED':
      case 'DECLINED': return 'border border-rose-200 bg-rose-50 text-rose-700';
      case 'IN_PROGRESS': return 'border border-indigo-200 bg-indigo-50 text-indigo-700';
      default: return 'border border-slate-200 bg-slate-50 text-slate-600';
    }
  };
  const handleUpdateStatus = async (id, status) => {
    try {
      const { data } = await updateStatus({ variables: { id, status } });
      toast.success(`Transaction ${status}: ${data.updateTransactionStatus.message}`);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to approve transaction");
    }
  };

  const handleViewTransactionDetails = (id) => {
    navigate(`/transaction-details/${id}`)
  }

  const isFx = transaction?.txnType === "FX";
  const fxSourceCurrency = getFxSourceCurrency(transaction);
  const avatarName = isVendor ? transaction?.client?.fullName : transaction?.business?.name;


  return (
    <div
      key={transaction.id}
      className="relative rounded-xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-slate-300 md:flex md:items-center md:justify-between"
    >
      {/* Left side */}
      <div className="flex min-w-0 items-center">
        <div
          className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${getAvatarColor(index)}`}
        >
          {(avatarName || "N").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-slate-900">
            {formatTxnAmount(transaction)}
          </span>
          {isFx && (
            <span className="ml-1.5 align-middle rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
              FX
            </span>
          )}
          {isFx && fxSourceCurrency && (
            <span className="ml-1 text-xs text-gray-400">(from {fxSourceCurrency})</span>
          )}
          {isVendor && transaction?.client?.fullName && transaction?.business?.name && (
            <div className="text-xs text-gray-400 mt-0.5 space-y-0.5">
              <div>From {transaction.client.fullName}</div>
              <div>To {transaction.business.name}</div>
              {transaction?.transferMode && (
                <div>
                  {transaction.transferMode === "BANK_TRANSFER" ? "Bank Transfer" : "Card"}
                </div>
              )}
            </div>
          )}
          {!isVendor && transaction?.business?.name && (
            <div className="text-xs text-gray-500 mt-0.5">{transaction.business.name}</div>
          )}
          {!isVendor && transaction?.transferMode && (
            <div className="text-xs text-gray-400">
              {transaction.transferMode === "BANK_TRANSFER" ? "Bank Transfer" : "Card"}
            </div>
          )}
          <div className="mt-1 text-xs text-slate-500">{new Date(transaction.dateCreated).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', ':')}</div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex max-w-full flex-col items-end gap-1 pt-5 md:pt-0">
        {isAwaitingTransfer && (
          <span className="max-w-full whitespace-normal break-words rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-right text-xs font-medium text-amber-700">
            {isVendor && !isOutgoing ? "Awaiting Transfer From Client" : "Awaiting Transfer"}
          </span>
        )}
        {!isAwaitingTransfer && transaction.status === "IN_PROGRESS" && transaction.transferMode === "BANK_TRANSFER" && (
          <span className="max-w-full whitespace-normal break-words rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-right text-xs font-medium text-indigo-700">
            Transfer Confirmed
          </span>
        )}
        <div className="flex items-center space-x-2">
          <span
            className={`text-sm font-semibold ${
              transaction?.amount?.toString()?.startsWith("+") ? "text-indigo-600" : "text-red-600"
            }`}
          >
            {formatTxnCharge(transaction)}
          </span>
          <span
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${getStatusColor(
              transaction.status
            )}`}
          >
            {transaction.status.replace(/_/g, ' ')}
          </span>

          {/* Dropdown Trigger */}
          <button
            ref={triggerRef}
            onClick={() => setOpen((prev) => !prev)}
            className="ml-2 p-2 rounded-full hover:bg-gray-100 transition"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Dropdown Menu */}
        {open && (
          <div ref={menuRef} className="absolute right-3 top-14 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xl shadow-slate-900/10">
            {/* Incoming vendor transactions: Approve + Reject */}
            {isVendor && !isOutgoing && (
              <>
                <button
                  onClick={() => { handleUpdateStatus(transaction.id, 'IN_PROGRESS'); setOpen(false); }}
                  disabled={transaction.status !== 'INITIATED'}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-40"
                >
                  Approve
                </button>
                <button
                  onClick={() => { handleUpdateStatus(transaction.id, 'DECLINED'); setOpen(false); }}
                  disabled={transaction.status !== 'INITIATED' && transaction.status !== 'IN_PROGRESS'}
                  className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 disabled:opacity-40"
                >
                  Reject
                </button>
              </>
            )}

            {/* Outgoing (vendor-as-client) or regular client: Cancel */}
            {(!isVendor || isOutgoing) && (transaction.status === 'INITIATED' || transaction.status === 'IN_PROGRESS') && (
              <button
                onClick={() => { handleUpdateStatus(transaction.id, 'CANCELLED'); setOpen(false); }}
                className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
            )}

            <button
              onClick={() => { handleViewTransactionDetails(transaction.id); setOpen(false); }}
              className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
