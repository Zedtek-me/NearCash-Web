import React, { useEffect, useState } from 'react';
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
  AlertCircle,
  Hand,
  HandHelping
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@apollo/client';
import { GET_TRANSACTION } from '../Dashboards/queries/analytics';
import useAuth from '../../../Hooks/Auths';
import { handleBackToggle, getDateAndTimeFromDateTimeStr } from '../../../utils/helpers';
import { UPDATE_TRANSACTION_STATUS } from '../../Auths/mutations/userMutations';
import Navbar from '../Navs/Headers';
import toast from 'react-hot-toast';
import TransactionMap from './TransactionMap';

export default function TransactionDetails() {
  const { userData } = useAuth();
  const params = useParams()
  const navigate = useNavigate()
  const { userData: { userType } } = useAuth()
  const [clientLocation, setClientLocation] = useState(null);
const [vendorLocation, setVendorLocation] = useState(null);

  const transactionId = params?.id
  const id = transactionId

  const {
    data: transactionData,
    error: tranactionError,
    loading: transactionLoading,
    refetch
  } = useQuery(
    GET_TRANSACTION, {
      variables: {
        transactionId: transactionId
      },
      skip: !transactionId
    }
  )

  const transaction = transactionData?.transaction || {}


  useEffect(() => {
  if (!transaction?.meta) return;

  try {
    const meta = JSON.parse(transaction.meta); // Parse the JSON string

    // Client location (always sent)
    if (meta.client_current_location) {
      const loc = meta.client_current_location;
      setClientLocation({
        lat: loc.latitude,
        lng: loc.longitude
      });
    }

    // Vendor location (only sent when vendor moves)
    if (meta.vendor_current_location) {
      const loc = meta.vendor_current_location;
      setVendorLocation({
        lat: loc.latitude,
        lng: loc.longitude
      });
    }
  } catch (err) {
    console.log("Failed to parse meta:", err);
  }
}, [transaction]);
  const formatTrxnAmount = (amount) => {
    switch(userType){
      case "VENDOR":
        if(amount.includes("+")) return amount?.replace("+", "-");
        return `-${amount}`;
      case "CLIENT":
        if(!amount?.includes("+")) return `+${amount}`;
        return amount
      default:
        return amount;
    }
  }
  const formattedAmount = formatTrxnAmount(String(transactionData?.transaction?.amount))
  const [localDate, localTime] = getDateAndTimeFromDateTimeStr(transactionData?.transaction?.dateCreated || Date.now())

  const trxnClient = transactionData?.transaction?.client;
  const trxnVendor = transactionData?.transaction?.vendor;
  const trxnBusiness = transactionData?.transaction?.business
  const [updateStatus] = useMutation(UPDATE_TRANSACTION_STATUS);
  

  const getStatusColor = (status) => {
    switch (status) {
      case 'FULFILLED': return 'bg-green-100 text-green-700 border-green-200';
      case 'INITIATED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'DECLINED': return 'bg-red-100 text-red-700 border-red-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'FULFILLED': return <Check className="w-5 h-5" />;
      case 'INITIATED': return <Clock className="w-5 h-5" />;
      case 'CANCELLED': return <X className="w-5 h-5" />;
      case 'DECLINED': return <X className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getSectionTitle = (userType) => {
    switch (userType){
      case "VENDOR":
        return "Customer Information";
      case "CLIENT":
        return "Vendor Information";
      default: return "Transaction Information";
    }
  }

  const getTrxnUserInfo = (userType) => {
    switch(userType){
      case "VENDOR": return {
        name: trxnClient?.fullName,
        email: trxnClient?.email,
        phoneNumber: trxnClient?.phoneNumber || "N/A",
        location: trxnBusiness?.address || "N/A"
      }
      case "CLIENT": return {
        name: trxnVendor?.fullName,
        email: trxnVendor?.email,
        phoneNumber: trxnVendor?.phoneNumber || "N/A",
        location: trxnBusiness?.address || "N/A"
      }
      default: return {
        name: trxnClient?.fullName,
        email: trxnClient?.email,
        phoneNumber: trxnClient?.phoneNumber || "N/A",
        location: trxnClient?.transaction?.txnLocation
      }
    }
  }

  const trxnUserInfo = getTrxnUserInfo(userType)

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

  const date = new Date(transaction.dateCreated).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', ':');

  function formatLabel(text) {
  if (!text) return '';
  return text
    .toLowerCase()  
    .split('_')      
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');  
}

const handleUpdateStatus = async (id, status) => {
    try {
      const { data } = await updateStatus({ variables: { id, status } });
      refetch()
      toast.success(`Transaction approved: ${data.updateTransactionStatus.message}`);
    } catch (err) {
      toast.error(err.message || "Failed to approve transaction");
    }
  };

  const goBack = () => {
    navigate(-1);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar user={userData}/>
      <div className="max-w-7xl mt-16 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className='flex mb-5 cursor-pointer' onClick={goBack}><ArrowLeft /> Back</div>

        {['INITIATED', 'IN_PROGRESS'].includes(transaction?.status) && (
          <TransactionMap
            txnId={transaction.id}
            status={transaction.status}
            category={transaction.category}
            userType={userType}
            clientLocation={clientLocation}
            vendorLocation={vendorLocation}
            userData={userData}
          />
        )}
        
        <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <div className="text-gray-400 text-sm mb-2">Transaction Amount</div>
              <div className={`text-4xl sm:text-5xl font-bold ${
                formattedAmount?.startsWith('+') ? 'text-green-400' : 'text-red-400'
              }`}>
                ₦ {formattedAmount}
              </div>
              <div className="text-gray-500 text-sm mt-2">Net: {`${parseFloat(formattedAmount.replace("-", "")) - transaction?.charge}`}</div>
            </div>
            <div className={`px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 border-2 ${getStatusColor(transaction?.status)} shadow-lg`}>
              {getStatusIcon(transaction?.status)}
              <span className="text-lg">{transaction?.status}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          
          <Section title="Transaction Information">
            <div className="space-y-2">
              <InfoRow icon={Hash} label="Transaction ID" value={transaction?.id} />
              <InfoRow icon={FileText} label="Reference" value={transaction?.txnRef} />
              <InfoRow icon={Calendar} label="Date & Time" value={`${localDate} at ${localTime}`} />
              <InfoRow icon={CreditCard} label="Amount Demanded" value={transaction?.amount} />
              <InfoRow icon={Hash} label="Transaction Fee" value={transaction?.charge} />
              <InfoRow icon={HandHelping} label="Collection Mode" value={transactionData?.transaction?.collectionMode?.replaceAll("_", "-")} />
              <InfoRow icon={FileText} label="Category" value={transaction.category} />
            </div>
          </Section>

          {/* Customer Information */}
          <Section title={getSectionTitle(userType)}>
            <div className="space-y-2">
              <InfoRow icon={User} label={userType == "VENDOR"? "Customer Name": "Vendor Name"} value={trxnUserInfo?.name} highlight />
              <InfoRow icon={Mail} label="Email Address" value={trxnUserInfo?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={trxnUserInfo?.phoneNumber} />
              {userType == "CLIENT" && <InfoRow icon={MapPin} label="Vendor Business Address" value={trxnUserInfo?.location} />}
              <InfoRow icon={Building} label="City" value={trxnUserInfo?.city} />
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

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          {transaction.status === 'INITIATED' && userData?.userType === 'VENDOR' && (
            <button  onClick={() => {
                handleUpdateStatus(transaction.id, 'IN_PROGRESS');
              }}  className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
            <Check className="w-5 h-5" />
            <span>Approve Transaction</span>
          </button>
          )}

          {userData?.userType === 'VENDOR' && (transaction.status === 'INITIATED' || transaction.status === 'IN_PROGRESS') && (
          <button onClick={() => {
                handleUpdateStatus(transaction.id, 'DECLINED');
              }} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
            <X className="w-5 h-5" />
            <span>Reject Transaction</span>
          </button>
          )}

          {userData?.userType !== 'VENDOR' && (transaction.status === 'INITIATED' || transaction.status === 'IN_PROGRESS') && (
          <button onClick={() => {
                handleUpdateStatus(transaction.id, 'CANCELLED');
              }} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
            <X className="w-5 h-5" />
            <span>Cancel Transaction</span>
          </button>
          )}
          
         
          
        </div>
      </div>
    </div>
  );
}