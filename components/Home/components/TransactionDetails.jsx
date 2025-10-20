import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar, 
  CreditCard, 
  Hash, 
  MapPin,
  Building,
  Mail,
  Phone,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function TransactionDetails() {
  const [transaction] = useState({
    id: "TXN-2024-001234",
    name: "John Doe",
    amount: "+$1,234.56",
    status: "Done",
    dateCreated: "Jan 15, 2024",
    time: "10:30 AM",
    type: "Credit",
    category: "Payment Received",
    description: "Payment for professional services rendered in January 2024",
    paymentMethod: "Bank Transfer",
    accountNumber: "**** **** **** 4532",
    transactionFee: "$2.50",
    netAmount: "$1,232.06",
    reference: "REF-2024-JAN-001",
    customerEmail: "johndoe@example.com",
    customerPhone: "+1 (555) 123-4567",
    billingAddress: "123 Main Street, Suite 100",
    city: "New York, NY 10001",
    notes: "Regular monthly payment - Invoice #INV-2024-001"
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done': return <Check className="w-5 h-5" />;
      case 'Pending': return <Clock className="w-5 h-5" />;
      case 'Failed': return <X className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
    <div className="flex items-start space-x-3 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors duration-200">
      <div className="mt-0.5">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div className={`font-medium ${highlight ? 'text-black text-lg' : 'text-gray-900'} break-words`}>
          {value}
        </div>
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200">
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Transaction Details</h1>
                <p className="text-gray-400 text-sm mt-1">View complete transaction information</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 sm:px-4 sm:py-2 bg-white text-black hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg">
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Download</span>
              </button>
              <button className="p-2 sm:px-4 sm:py-2 bg-white text-black hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg">
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Status Card */}
        <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <div className="text-gray-400 text-sm mb-2">Transaction Amount</div>
              <div className={`text-4xl sm:text-5xl font-bold ${
                transaction.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
              }`}>
                {transaction.amount}
              </div>
              <div className="text-gray-500 text-sm mt-2">Net: {transaction.netAmount}</div>
            </div>
            <div className={`px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 border-2 ${getStatusColor(transaction.status)} shadow-lg`}>
              {getStatusIcon(transaction.status)}
              <span className="text-lg">{transaction.status}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Transaction Information */}
          <Section title="Transaction Information">
            <div className="space-y-2">
              <InfoRow icon={Hash} label="Transaction ID" value={transaction.id} />
              <InfoRow icon={FileText} label="Reference" value={transaction.reference} />
              <InfoRow icon={Calendar} label="Date & Time" value={`${transaction.dateCreated} at ${transaction.time}`} />
              <InfoRow icon={CreditCard} label="Gross Amount" value={transaction.amount} />
              <InfoRow icon={Hash} label="Transaction Fee" value={transaction.transactionFee} />
              <InfoRow icon={FileText} label="Category" value={transaction.category} />
            </div>
          </Section>

          {/* Customer Information */}
          <Section title="Customer Information">
            <div className="space-y-2">
              <InfoRow icon={User} label="Customer Name" value={transaction.name} highlight />
              <InfoRow icon={Mail} label="Email Address" value={transaction.customerEmail} />
              <InfoRow icon={Phone} label="Phone Number" value={transaction.customerPhone} />
              <InfoRow icon={MapPin} label="Billing Address" value={transaction.billingAddress} />
              <InfoRow icon={Building} label="City" value={transaction.city} />
            </div>
          </Section>

          {/* <Section title="Financial Breakdown">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Gross Amount</span>
                <span className="font-semibold text-gray-900 text-lg">{transaction.amount}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Transaction Fee</span>
                <span className="font-medium text-red-600">-{transaction.transactionFee}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-gray-50 rounded-lg px-4">
                <span className="text-gray-900 font-semibold">Net Amount</span>
                <span className="font-bold text-black text-xl">{transaction.netAmount}</span>
              </div>
            </div>
          </Section>

          <Section title="Additional Details">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Transaction Type</div>
                <div className="font-medium text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                  {transaction.type}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Description</div>
                <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg leading-relaxed">
                  {transaction.description}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Notes</div>
                <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg leading-relaxed">
                  {transaction.notes}
                </div>
              </div>
            </div>
          </Section> */}

        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
            <Check className="w-5 h-5" />
            <span>Approve Transaction</span>
          </button>
          <button className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
            <X className="w-5 h-5" />
            <span>Reject Transaction</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}