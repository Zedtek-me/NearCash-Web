import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  X,
  User,
  Calendar,
  CreditCard,
  Hash,
  MapPin,
  Building,
  Mail,
  Phone,
  FileText,
  HandHelping,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@apollo/client';
import { GET_TRANSACTION } from '../Dashboards/queries/analytics';
import useAuth from '../../../hooks/useAuth';
import { UPDATE_TRANSACTION_STATUS } from '../../Auths/mutations/userMutations';
import Navbar from '../Navs/Headers';
import toast from 'react-hot-toast';
import TransactionMap from './TransactionMap';
import { getCurrencySymbol } from '../../../utils/transactionHelpers';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG = {
  FULFILLED:   { label: 'Fulfilled',   pill: 'bg-indigo-100 text-indigo-700',       dot: 'bg-indigo-500'   },
  INITIATED:   { label: 'Initiated',   pill: 'bg-amber-100  text-amber-700',    dot: 'bg-amber-500'   },
  IN_PROGRESS: { label: 'In Progress', pill: 'bg-blue-100   text-blue-700',     dot: 'bg-blue-500'    },
  DECLINED:    { label: 'Declined',    pill: 'bg-red-100    text-red-700',       dot: 'bg-red-500'     },
  CANCELLED:   { label: 'Cancelled',   pill: 'bg-red-100    text-red-700',       dot: 'bg-red-500'     },
};

// ── Date formatter ────────────────────────────────────────────────────────────

const formatTxnDate = (dateStr) => {
  if (!dateStr) return '—';
  const d  = new Date(dateStr);
  const tz = 'Africa/Lagos';
  const weekday  = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: tz });
  const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz })
                    .toLowerCase().replace(' ', '');
  return `${weekday}, ${datePart} · ${timePart} WAT`;
};

const STEPS = [
  { key: 'INITIATED',   label: 'Initiated'    },
  { key: 'IN_PROGRESS', label: 'In Progress'  },
  { key: 'FULFILLED',   label: 'Fulfilled'    },
];


function InfoRow({ icon: Icon, label, value, highlight = false, mono = false }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="mt-0.5 flex-shrink-0">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`break-words ${
          highlight
            ? 'text-sm font-semibold text-gray-900'
            : mono
            ? 'text-xs font-mono text-gray-600'
            : 'text-sm text-gray-700'
        }`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TransactionDetails() {
  const { userData } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const { userData: { userType } } = useAuth();
  const [clientLocation, setClientLocation] = useState(null);
  const [vendorLocation, setVendorLocation] = useState(null);

  const transactionId = params?.id;

  const { data: transactionData, refetch } = useQuery(GET_TRANSACTION, {
    variables: { transactionId },
    skip: !transactionId,
  });

  const transaction = transactionData?.transaction || {};

  useEffect(() => {
    if (!transaction?.meta) return;
    try {
      const meta = JSON.parse(transaction.meta);
      if (meta.client_current_location) {
        const loc = meta.client_current_location;
        setClientLocation({ lat: loc.latitude, lng: loc.longitude });
      }
      if (meta.vendor_current_location) {
        const loc = meta.vendor_current_location;
        setVendorLocation({ lat: loc.latitude, lng: loc.longitude });
      }
    } catch {}
  }, [transaction]);

  // ── Outgoing-vendor detection ────────────────────────────────────────────────
  // A vendor who initiated a vendor-to-vendor sourcing request is stored as the
  // transaction's client. For such transactions, render the client perspective.
  const isOutgoingVendor =
    userType === 'VENDOR' &&
    transaction?.client?.id != null &&
    String(transaction.client.id) === String(userData?.id);

  const effectiveViewType = isOutgoingVendor ? 'CLIENT' : userType;

  // ── Amount formatting ───────────────────────────────────────────────────────

  const formatTrxnAmount = (amount) => {
    switch (effectiveViewType) {
      case 'VENDOR':
        if (amount.includes('+')) return amount.replace('+', '-');
        return `-${amount}`;
      case 'CLIENT':
        if (!amount?.includes('+')) return `+${amount}`;
        return amount;
      default:
        return amount;
    }
  };

  const formattedAmount  = formatTrxnAmount(String(transactionData?.transaction?.amount));
  const amountSign       = ['+', '-'].includes(formattedAmount?.[0]) ? formattedAmount[0] : '';
  const numericAmount    = Number((formattedAmount || '0').replace(/[+-]/, '') || 0).toLocaleString();
  const netAmount        = Number(
    parseFloat((formattedAmount || '0').replace(/[+-]/, '')) - (transaction?.charge || 0)
  ).toLocaleString();

  // FX transactions are denominated in `transaction.currency` (the destination
  // currency requested by the client), not naira.
  const isFxTxn        = transaction?.txnType === 'FX';
  const currencySymbol = getCurrencySymbol(isFxTxn ? transaction?.currency || 'USD' : 'NGN');
  const formatCurrencyAmount = (value) => `${currencySymbol}${Number(value || 0).toLocaleString()}`;
  const heroAmountLabel = `${amountSign}${currencySymbol}${numericAmount}`;
  const netAmountLabel  = `${currencySymbol}${netAmount}`;

  const txnDate = formatTxnDate(transactionData?.transaction?.dateCreated);

  // ── Participants ────────────────────────────────────────────────────────────

  const trxnClient   = transactionData?.transaction?.client;
  const trxnVendor   = transactionData?.transaction?.vendor;
  const trxnBusiness = transactionData?.transaction?.business;

  const [updateStatus] = useMutation(UPDATE_TRANSACTION_STATUS);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getSectionTitle = (type) => {
    if (type === 'VENDOR') return 'Customer Information';
    if (type === 'CLIENT') return 'Vendor Information';
    return 'Party Information';
  };

  const getTrxnUserInfo = (type) => {
    if (type === 'VENDOR') return {
      name:        trxnClient?.fullName,
      email:       trxnClient?.email,
      phoneNumber: trxnClient?.phoneNumber || 'N/A',
      location:    trxnBusiness?.address  || 'N/A',
    };
    if (type === 'CLIENT') return {
      name:        trxnVendor?.fullName,
      email:       trxnVendor?.email,
      phoneNumber: trxnVendor?.phoneNumber || 'N/A',
      location:    trxnBusiness?.address  || 'N/A',
    };
    return {
      name:        trxnClient?.fullName,
      email:       trxnClient?.email,
      phoneNumber: trxnClient?.phoneNumber || 'N/A',
      location:    trxnClient?.transaction?.txnLocation,
    };
  };

  const trxnUserInfo = getTrxnUserInfo(effectiveViewType);

  const handleUpdateStatus = async (id, status) => {
    try {
      const { data } = await updateStatus({ variables: { id, status } });
      refetch();
      toast.success(`Transaction updated: ${data.updateTransactionStatus.message}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update transaction');
    }
  };

  // ── Derived flags ────────────────────────────────────────────────────────────

  const isPending          = ['INITIATED', 'IN_PROGRESS'].includes(transaction?.status);
  const isTerminal         = ['DECLINED', 'CANCELLED', 'FULFILLED'].includes(transaction?.status);
  const statusCfg          = STATUS_CFG[transaction?.status] || STATUS_CFG.INITIATED;
  const currentStepIdx     = STEPS.findIndex((s) => s.key === transaction?.status);
  const isPositive         = formattedAmount?.startsWith('+');

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userData} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* Live map */}
        {isPending && (
          <TransactionMap
            txnId={transaction.id}
            status={transaction.status}
            collectionMode={transaction.collectionMode}
            userType={userType}
            clientLocation={clientLocation}
            vendorLocation={vendorLocation}
            userData={userData}
            transaction={transaction}
          />
        )}

        {/* ── Hero card ── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            {/* Amount block */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Transaction Amount
              </p>
              <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${
                isPositive ? 'text-indigo-400' : 'text-rose-400'
              }`}>
                {heroAmountLabel}
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Net after fees: <span className="text-slate-200 font-medium">{netAmountLabel}</span>
              </p>
            </div>

            {/* Status + meta */}
            <div className="flex flex-col items-start sm:items-end gap-2 sm:text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusCfg.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <p className="text-slate-300 text-xs font-mono tracking-wide">{transaction?.txnRef}</p>
              <p className="text-slate-400 text-xs">{txnDate}</p>
            </div>
          </div>

          {/* Progress steps — hidden for terminal declined/cancelled */}
          {!['DECLINED', 'CANCELLED'].includes(transaction?.status) && (
            <div className="mt-7 pt-6 border-t border-slate-700/60">
              <div className="flex items-center justify-between relative">
                {/* Track */}
                <div className="absolute inset-x-0 top-3 h-px bg-slate-700/50" />

                {STEPS.map((step, idx) => {
                  const done   = currentStepIdx > idx;
                  const active = currentStepIdx === idx;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                        done
                          ? 'bg-indigo-500 border-indigo-500'
                          : active
                          ? 'bg-white border-white'
                          : 'bg-slate-800 border-slate-700'
                      }`}>
                        {done
                          ? <Check size={12} className="text-white" />
                          : <span className={`w-2 h-2 rounded-full ${active ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                        }
                      </div>
                      <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        done || active ? 'text-white' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Info cards ── */}
        <div className={
          effectiveViewType === 'VENDOR'
            ? 'grid lg:grid-cols-2 gap-5'
            : 'max-w-2xl mx-auto'
        }>
          {/* Transaction details */}
          <Card title="Transaction Details">
            <InfoRow icon={Hash}        label="Transaction ID"   value={transaction?.id}           mono />
            <InfoRow icon={FileText}    label="Reference"        value={transaction?.txnRef}        mono />
            <InfoRow icon={Calendar}    label="Date & Time"      value={txnDate} />
            <InfoRow icon={CreditCard}  label="Amount Demanded"  value={formatCurrencyAmount(transaction?.amount)} highlight />
            <InfoRow icon={Hash}        label="Transaction Fee"  value={formatCurrencyAmount(transaction?.charge)} />
            <InfoRow icon={HandHelping} label="Collection Mode"  value={transaction?.collectionMode?.replaceAll('_', ' ')} />
            <InfoRow icon={Building}    label="Vendor"           value={transaction?.business?.name} />
          </Card>

          {/* Counter-party info card */}
          {effectiveViewType === 'VENDOR' && (
            <Card title={getSectionTitle(effectiveViewType)}>
              <InfoRow icon={User}     label="Customer Name"  value={trxnUserInfo?.name}        highlight />
              <InfoRow icon={Mail}     label="Email Address"  value={trxnUserInfo?.email} />
              <InfoRow icon={Phone}    label="Phone Number"   value={trxnUserInfo?.phoneNumber} />
              <InfoRow icon={Building} label="City"           value={trxnUserInfo?.city} />
            </Card>
          )}
        </div>

        {/* ── Action buttons ── */}
        {isPending && (
          <div className={`mt-6 flex flex-col lg:flex-row gap-3 ${
            effectiveViewType === 'VENDOR' ? '' : 'max-w-2xl mx-auto'
          }`}>
            {/* Incoming vendor transactions: Approve */}
            {transaction.status === 'INITIATED' && effectiveViewType === 'VENDOR' && (
              <button
                onClick={() => handleUpdateStatus(transaction.id, 'IN_PROGRESS')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-sm"
              >
                <Check size={17} />
                Approve Transaction
              </button>
            )}

            {/* Incoming vendor transactions: Reject */}
            {effectiveViewType === 'VENDOR' && (
              <button
                onClick={() => handleUpdateStatus(transaction.id, 'DECLINED')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-semibold transition-all shadow-sm"
              >
                <X size={17} />
                Reject Transaction
              </button>
            )}

            {/* Client / outgoing vendor: Cancel */}
            {effectiveViewType !== 'VENDOR' && (
              <button
                onClick={() => handleUpdateStatus(transaction.id, 'CANCELLED')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-semibold transition-all shadow-sm"
              >
                <X size={17} />
                Cancel Transaction
              </button>
            )}

            {/* Client / outgoing vendor: Call the fulfilling vendor */}
            {effectiveViewType !== 'VENDOR' && trxnVendor?.phoneNumber && (
              <a
                href={`tel:${trxnVendor?.phoneNumber}`}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-10 py-3.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 transition-all duration-200 rounded-xl font-semibold shadow-sm"
              >
                <Phone size={17} />
                Call Vendor
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
