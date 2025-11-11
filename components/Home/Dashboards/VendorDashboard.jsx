import React, { useState, useEffect } from 'react';
import { ArrowRight, Send, FileText, Plus, MoreHorizontal, Eye, MapPin, ArrowLeft, SwitchCamera, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';
import Navbar from '../Navs/Headers';
import { useMutation, useQuery } from '@apollo/client';
import { GET_SUB_BUSINESSES, GET_TRANSACTIONS } from '../../Auths/queries/userQueries';
import { GET_ANALYTICS } from './queries/analytics';
import useAuth from '../../../Hooks/Auths';
import { UPDATE_TRANSACTION_STATUS } from '../../Auths/mutations/userMutations';
import TransactionCard from '../TransactionCard';
import EmptyTableState from '../components/EmptyTable';
import toast from 'react-hot-toast';
import { useStateValue } from '../../../providers/stateProvider';
import TransactionStatusFilter from '../TransactionStatusFilter';



const Dashboard = () => {
  const navigate = useNavigate()
  const [pageNumber, setPageNumber] = useState(1);
  const [subBizPage, setSubBizPage] = useState(1);
  const { userData } = useAuth();

  const { userType } = userData;

  let vendorBusinessId = userData?.businesses?.find(item => Object.is(item.isPrimary, true))?.id;
  const [
    {
      businessStates: { selectedBusiness }
    },
    dispatch
  ] = Object.values(useStateValue())

  useEffect(
    () => {
      if(vendorBusinessId && !selectedBusiness){
        localStorage.setItem("selected_business", vendorBusinessId);
        dispatch({
          type: "UPDATE_SELECTED_BUSINESS",
          value: vendorBusinessId
        })
      }
      else if(selectedBusiness) {
        localStorage.setItem("selected_business", selectedBusiness)
        vendorBusinessId = selectedBusiness;
      }
    },
    [vendorBusinessId, selectedBusiness]
  )
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
  variables: { pageCount: 10, pageNumber, businessId: selectedBusiness ?? vendorBusinessId},
  fetchPolicy: "network-only",
});

const {
  data: subBizData,
  loading: subBizLoading,
  error: subBizError,
  refetch: refetchSubBiz,
} = useQuery(GET_SUB_BUSINESSES, {
  variables: { pageCount: 10, pageNumber: subBizPage, ownerId: userData?.id || "" },
  fetchPolicy: "network-only",
});

const {
  data: analyticsData,
  error: analyticsError,
  loading: analyticsLoading,
  refetch: refectAnalytics
} = useQuery(GET_ANALYTICS, {
  variables: {
    businessId: vendorBusinessId,
    userType: userType?.toLowerCase()
  },
  skip: !(vendorBusinessId || selectedBusiness)
})

const [updateStatus] = useMutation(UPDATE_TRANSACTION_STATUS);

console.log(userData);


const handleNext = () => {
  setPageNumber((prev) => prev + 1);
};

const handlePrevious = () => {
  if (pageNumber > 1) setPageNumber((prev) => prev - 1);
};

const handleSubBizNext = () => {
  setSubBizPage((prev) => prev + 1);
};

const handleSubBizPrevious = () => {
  if (subBizPage > 1) setSubBizPage((prev) => prev - 1);
};

const subBusinessList = subBizData?.businesses || [];

const handleUpdateStatus = async (id, newStatus) => {
  try {
    await updateStatus({ variables: { id, status: newStatus } });
    refetch(); // refresh transactions after update
  } catch (err) {
    console.error("Failed to update status:", err);
  }
};

const handleSwitchBusiness = (id) =>{
  localStorage.setItem("selected_business", id);
  dispatch({
    type: "UPDATE_SELECTED_BUSINESS",
    value: id
  });
  toast.success('Business updated sucessfully')
}

  const transactionHistory = data?.transactions || [];

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

  const statusMap = [
    {
      name: "All", color: "black"
    },
    {
      name: "Initiated", color: "black"
    },
    {
      name: "Declined", color: "black"
    },
    {
      name: "Cancelled", color: "black"
    },
    {
      name: "In Progress", color: "black"
    },
    {
      name: "Fulfilled", color: "black"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <Navbar user={userData}/>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 sm:mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-12 space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm opacity-90">Fulfilled Transactions Value
</span>
                </div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-lg font-bold">$</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {`$${analyticsData?.analytics?.totalTransactionValue || 0}`}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    Total Profit (plus extra charges)
                  </span>
                  <ArrowRight className="w-4 h-4 text-white bg-black rounded-full p-0.5" />
                </div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-teal-600 text-lg">$</span>
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {`$${analyticsData?.analytics?.totalChargesPlusExtra || 0}`}
                </div>
                <div className="text-xs text-red-500 mt-1">
                  {`${analyticsData?.analytics?.percentageReductionFromPastMonth || 0}% increase from last Month`}
                </div>
              </div>

              {/* Spending */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Total Fulfilled Transactions</span>
                  <ArrowRight className="w-4 h-4 text-white bg-black rounded-full p-0.5" />
                </div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 text-lg">$</span>
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {`$${analyticsData?.analytics?.fulfilledTransactions || analyticsData?.analytics?.totalTransactions || 0}`}
                </div>
                <div className="text-xs text-red-500 mt-1">
                  {`${analyticsData?.analytics?.percentageReductionFromPastMonth || 0}% increase from last Month`}
                </div>
              </div>

              {/* EMI */}
              <div className="flex justify-end px-6 py-2">
               <button
                  className="flex items-center h-12 gap-2 px-4 py-2 bg-black text-white hover:bg-white hover:text-black border border-black transition-all duration-200 rounded-2xl text-sm font-medium"
                  onClick={() => navigate('/create-store')}
                >
                  <Plus size={16} />
                  <span>Create Sub Business</span>
                </button>
              </div>
            </div>

            <div className='w-full grid sm:grid-cols-1 md:grid-cols-2  gap-6 mt-20'>
              <div className="bg-grey-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
                <TransactionStatusFilter statusMap={statusMap} refetch={refetch}/>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={handlePrevious}
                    disabled={pageNumber === 1}
                    className="p-2 bg-gray-300 text-gray-800 rounded-[100%] hover:bg-gray-400 disabled:opacity-50"
                  >
                    <ArrowLeft />
                  </button>


                  <button
                    onClick={handleNext}
                    className="ml-3 p-2 bg-gray-300 text-gray-800 rounded-[100%] hover:bg-gray-400"
                  >
                    <ArrowRight />
                  </button>
                </div>

              </div>
              
              <div className="space-y-4">
                 {!transactionHistory?.length && (
                <EmptyTableState description="All transactions initiated to this business will appear here."/>
              )}
                {transactionHistory.map((tx, index) => (
                  <TransactionCard
                      transaction={tx}
                      index={index}
                      refetch={refetch}
                      onReject={(id) => console.log("Reject:", id)}
                      onViewDetails={(id) => navigate(`/transactions/${tx.id}`)}
                      key={tx.id}
                      isVendor={true}
                    />

                ))}
              </div>
            </div>

            <div className="bg-grey-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border  border-gray-100">
             <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Sub Business List</h2>
        <div className="flex justify-between items-center">
          <button
            onClick={handleSubBizPrevious}
            disabled={subBizPage === 1}
            className="p-2 bg-gray-300 text-gray-800 rounded-[100%] hover:bg-gray-400 disabled:opacity-50"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={handleSubBizNext}
            className="ml-3 p-2 bg-gray-300 text-gray-800 rounded-[100%] hover:bg-gray-400"
          >
            <ArrowRight />
          </button>
        </div>
      </div>

<div className="space-y-4">
    {!subBusinessList?.length && (
                <EmptyTableState />
              )}
  {subBizLoading ? (
    <p className="text-gray-500 text-sm">Loading...</p>
  ) : subBusinessList.length > 0 ? (
    subBusinessList.map((store, index) => (
      <div
        key={store.id}
        className="bg-white hover:scale-105 flex items-center justify-between px-3 py-5 hover:bg-gray-50 shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl group"
      >
        <div className="flex items-center flex-1">
          <div
            className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center mr-3 shadow-sm`}
          >
            <span className="text-white text-sm font-medium">
              {store.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate">{store.name}</div>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{store.address}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center ml-2">
          <button
            className=" flex gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 group-hover:scale-110"
            onClick={() => handleSwitchBusiness(store?.id)}
          >
            Switch Business
            <SwitchCamera className="w-4 h-4" />
          </button>
        </div>
      </div>
    ))
  ) : (
    <p className="text-gray-500 text-sm">No sub businesses found.</p>
  )}
</div>

            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;