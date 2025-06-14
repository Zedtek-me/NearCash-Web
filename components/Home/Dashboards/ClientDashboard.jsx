import React, {useState} from "react";
import { useParams } from "react-router-dom";
import { ArrowUpRight, ArrowUp, ArrowDown, Clock, MoreHorizontal } from 'lucide-react';

export default function ClientDashboard() {
     let [clientInfo, setClientInfo] = useState({});
    let { user_type } = useParams();
    return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome, Riyad Capital 👋</h1>
          <p className="text-sm text-gray-500">Member Since April 30, 2025</p>
        </div>

        <div className="mb-8">
             <div className="flex gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Investment Wallet</h2>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">₦ 63 <span className="text-gray-400 font-normal">500</span></div>
                  <div className="text-sm text-gray-500">Your Balance</div>
                </div>

                <div className="mb-4">
                  <div className="font-semibold text-gray-900">₦ 58 200 <span className="text-sm font-normal text-gray-500">Available Funds</span></div>
                </div>

                <div className="flex space-x-3">
                  <button className="text-sm font-medium text-gray-700 underline">Deposit</button>
                  <button className="text-sm font-medium text-gray-700 underline">Withdraw</button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Borrowing</h2>
                  <ArrowUpRight className="w-5 h-5 text-white/80" />
                </div>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-1">₦ 70 <span className="text-white/60 font-normal">250</span></div>
                  <div className="text-sm text-white/80">Loan Amount</div>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-4 h-4 text-white/80" />
                  <span className="text-sm text-white/80">2026-09-01</span>
                </div>

                <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                  Pay Now
                </button>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Portfolio</h2>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">₦ 492 <span className="text-gray-400 font-normal">800</span></div>
                
                <div className="flex space-x-1 mb-4">
                  <div className="h-2 bg-blue-500 rounded-full flex-1"></div>
                  <div className="h-2 bg-pink-400 rounded-full flex-1"></div>
                  <div className="h-2 bg-teal-400 rounded-full flex-1"></div>
                  <div className="h-2 bg-yellow-400 rounded-full flex-1"></div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">₦ 175 200</div>
                    <div className="text-gray-500">Due</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">₦ 136 500</div>
                    <div className="text-gray-500">Paid</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">₦ 42 900</div>
                    <div className="text-gray-500">Late</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">₦ 82 400</div>
                    <div className="text-gray-500">Canceled</div>
                  </div>
                </div>

                <div className="flex space-x-6 mt-4">
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-semibold">24%</span>
                    <span className="text-gray-600">Received</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-500 font-semibold">19%</span>
                    <span className="text-gray-600">Expected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                  <p className="text-sm text-gray-500">Wallet & Portfolio Movements</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <ArrowUp className="w-4 h-4 text-red-500 rotate-45" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Portfolio</div>
                      <div className="text-sm text-gray-500">Sent</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">- ₦ 30 700</div>
                    <div className="text-sm text-gray-500">2025-05-11</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <ArrowDown className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Investment Wallet</div>
                      <div className="text-sm text-gray-500">Received</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">+ ₦ 48 250</div>
                    <div className="text-sm text-gray-500">2025-04-30</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Best Opportunities</h2>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">Saudi Electric</h3>
                      <p className="text-sm text-gray-500">Energy Sector Investment</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs rounded-full">A - Low Risk</span>
                      <span className="px-2 py-1 bg-teal-100 text-teal-600 text-xs rounded-full">Upcoming</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xl font-bold text-gray-900 mb-1">₦ 815 <span className="text-gray-400 font-normal">300</span></div>
                    <div className="text-sm text-gray-500">Amount Needed</div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-500 font-semibold">14%</span>
                      <span className="text-gray-600 text-sm">Expected Return</span>
                    </div>
                  </div>

                  <button className="text-sm font-medium text-gray-700 underline">Invest Now</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
           

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Loan Request</h2>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="mb-4">
                <div className="text-xl font-bold text-gray-900 mb-1">₦ 507 <span className="text-gray-400 font-normal">100</span></div>
                <div className="text-sm text-gray-500 mb-3">Amount Needed</div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">Ready to Apply</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-lg font-semibold text-gray-900">1.8%</span>
                    <div className="text-sm text-gray-500">Interest Rate</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">12 months</span>
                    </div>
                    <div className="font-semibold text-gray-900">₦ 602 500</div>
                  </div>
                </div>

                <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Apply Now
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Fund</h2>
                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">Purchase Order (PO)</h3>
                    <p className="text-sm text-gray-500">Office Equipment Purchase</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">Pending</span>
                </div>
                
                <div className="mb-3">
                  <div className="text-xl font-bold text-gray-900 mb-1">₦ 267 <span className="text-gray-400 font-normal">900</span></div>
                  <div className="text-sm text-gray-500">Amount Needed</div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{width: '40%'}}></div>
                  </div>
                </div>

                <button className="text-sm font-medium text-gray-700 underline">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}