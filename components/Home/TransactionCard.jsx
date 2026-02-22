import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import { UPDATE_TRANSACTION_STATUS } from "../Auths/mutations/userMutations";
import { useNavigate } from "react-router";
import { useMutation } from "@apollo/client";
import toast from "react-hot-toast";

export default function TransactionCard({ transaction, index, refetch, onReject, onViewDetails, isVendor }) {
  const [open, setOpen] = useState(false);
   const [updateStatus] = useMutation(UPDATE_TRANSACTION_STATUS);
    const navigate = useNavigate()


  const getAvatarColor = (index) => {
    const colors = ['bg-blue-400', 'bg-gray-400', 'bg-teal-400', 'bg-amber-400', 'bg-orange-400'];
    return colors[index % colors.length];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'FULFILLED': return 'bg-green-100 text-green-600';
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
          {/* <span className="text-white text-sm font-medium">
            {transaction.name.split(" ").map((n) => n[0]).join("")}
          </span> */}
        </div>
        <div>
           <span
          className={`font-bold text-gray-800`}
        >
          ₦{transaction?.amount}
        </span>
          <div className="font-medium text-gray-800">{transaction?.name}</div>
          <div className="text-sm text-gray-500"> {new Date(transaction.dateCreated).toLocaleString('en-GB', {
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
      <div className="flex pt-5 md:pt-0 justify-between items-center space-x-2">
        <span
          className={`font-medium ${
            transaction?.amount?.toString()?.startsWith("+") ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction?.charge}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            transaction.status
          )}`}
        >
          {transaction.status}
        </span>

        {/* Dropdown Trigger */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="ml-2 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>

        {/* Dropdown Menu */}
        {open && (
          <div className="absolute right-3 top-14 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-lg w-48 z-20">
            {isVendor && (
              <>
               <button
              onClick={() => {
                handleUpdateStatus(transaction.id, 'IN_PROGRESS');
                setOpen(false);
              }}
               disabled={transaction.status !== 'INITIATED'}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
               Approve
            </button>
            <button
              onClick={() => {
                handleUpdateStatus(transaction.id, 'DECLINED');
                setOpen(false);
                
              }}
               disabled={transaction.status !== 'INITIATED' && transaction.status !== 'IN_PROGRESS'}
              className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              Reject
            </button>
              </>
            )}
             {!isVendor && (transaction.status === 'INITIATED' || transaction.status === 'IN_PROGRESS') && (
              <>
            <button
              onClick={() => {
                handleUpdateStatus(transaction.id, 'CANCELLED');
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
              </>
            )}
           
            <button
              onClick={() => {
                handleViewTransactionDetails(transaction.id);
                setOpen(false);
              }}
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
