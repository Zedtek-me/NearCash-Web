import React, { useState } from "react";
import { MoreVertical } from "lucide-react";

export default function TransactionCard({ transaction, index, onApprove, onReject, onViewDetails }) {
  const [open, setOpen] = useState(false);

  const getAvatarColor = (index) => {
    const colors = ['bg-blue-400', 'bg-gray-400', 'bg-teal-400', 'bg-amber-400', 'bg-orange-400'];
    return colors[index % colors.length];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-600';
      case 'Pending': return 'bg-yellow-100 text-yellow-600';
      case 'Failed': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Grocery': return 'bg-green-100 text-green-600';
      case 'Retail': return 'bg-blue-100 text-blue-600';
      case 'Electronics': return 'bg-purple-100 text-purple-600';
      case 'Home Improvement': return 'bg-orange-100 text-orange-600';
      case 'Food & Beverage': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div
      key={transaction.id}
      className="bg-white flex items-center justify-between px-3 py-5 hover:bg-gray-50 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl relative"
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
          <div className="font-medium text-gray-800">{transaction?.name}</div>
          <div className="text-sm text-gray-500">{transaction.dateCreated}</div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2">
        <span
          className={`font-medium ${
            transaction?.amount?.startsWith("+") ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction?.amount}
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
            <button
              onClick={() => {
                onApprove(transaction.id);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
               Approve
            </button>
            <button
              onClick={() => {
                onReject(transaction.id);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Reject
            </button>
            <button
              onClick={() => {
                onViewDetails(transaction.id);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
