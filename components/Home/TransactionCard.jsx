import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { UPDATE_TRANSACTION_STATUS } from "../Auths/mutations/userMutations";
import { useNavigate } from "react-router";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";

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
    const colors = ['bg-blue-400', 'bg-gray-400', 'bg-indigo-400', 'bg-amber-400', 'bg-orange-400'];
    return colors[index % colors.length];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'FULFILLED': return 'bg-indigo-100 text-indigo-600';
      case 'INITIATED': return 'bg-yellow-100 text-yellow-600';
      case 'CANCELLED' || 'DECLINED': return 'bg-red-100 text-red-600';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
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


  return (
    <div
      key={transaction.id}
      className="bg-white md:flex items-center justify-between px-3 py-5 hover:bg-gray-50 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl relative"
    >
      {/* Left side */}
      <div className="flex items-center">
        <div
          className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center mr-3 shadow-sm`}
        >

        </div>
        <div>
          <span className="font-bold text-gray-800">
            ₦{Number(transaction?.amount || 0).toLocaleString()}
          </span>
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
          <div className="text-sm text-gray-500 mt-1">{new Date(transaction.dateCreated).toLocaleString('en-GB', {
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
      <div className="flex flex-col pt-5 md:pt-0 items-end gap-1">
        {isAwaitingTransfer && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
            {isVendor && !isOutgoing ? "Awaiting Transfer From Client" : "Awaiting Transfer"}
          </span>
        )}
        {!isAwaitingTransfer && transaction.status === "IN_PROGRESS" && transaction.transferMode === "BANK_TRANSFER" && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
            Transfer Confirmed
          </span>
        )}
        <div className="flex items-center space-x-2">
          <span
            className={`font-medium ${
              transaction?.amount?.toString()?.startsWith("+") ? "text-indigo-600" : "text-red-600"
            }`}
          >
            {transaction?.charge}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
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
          <div ref={menuRef} className="absolute right-3 top-14 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-lg w-48 z-20">
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
