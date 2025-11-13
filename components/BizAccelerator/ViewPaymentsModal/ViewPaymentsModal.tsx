import React, { useState, useMemo } from 'react';
import { X, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowLeft, CreditCard, Tag, Edit, FileText, Eye, Download, Printer } from 'lucide-react';

import { useGetCustomerPaymentHistoryQuery, useGetPaymentQuery, useRecordInstallmentPaymentMutation, useGetPaymentInvoiceQuery } from '@/store/api_query/BizAcceleratorPayment.api';

type PaymentStatus = 'paid' | 'pending' | 'partially_paid' | 'overdue';
type PaymentInterval = 'one_time' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
type InstallmentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';

interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: InstallmentStatus;
  paymentMethod?: string;
  transactionRef?: string;
  notes?: string;
  paidDate?: string;
  paidBy?: {
    firstName: string;
    lastName: string;
  };
}

interface PaymentData {
  createdById: any;
  createdBy: any;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  isInterstate: any;
  id: string;
  recordId: string;
  paymentName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  paymentType: string;
  paymentInterval?: PaymentInterval;
  startDate?: string;
  dueDate?: string;
  installmentCount: number;
  createdAt: string;
  nextPaymentDate?: string;
  nextPaymentDescription?: string;
  description?: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  gstAmount?: number;
  installments?: Installment[];
  dealId?: string;
  dealName?: string;
  deal?: { id?: string; name?: string };
}

interface CustomerInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ViewPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerInfo;
  onEditPayment?: (paymentData: PaymentData) => void;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment;
  paymentId: string;
  onSuccess: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getStatusColor = (status: PaymentStatus | InstallmentStatus) => {
  if (!status) return 'bg-gray-100 text-gray-800 border-gray-300';
  const statusLower = status.toLowerCase();
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 border-green-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    partially_paid: 'bg-blue-100 text-blue-800 border-blue-300',
    overdue: 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[statusLower] || colors.pending;
};

const getStatusIcon = (status: PaymentStatus | InstallmentStatus) => {
  if (!status) return <Clock size={16} />;
  const statusLower = status.toLowerCase();
  const icons: Record<string, React.ReactNode> = {
    paid: <CheckCircle size={16} />,
    pending: <Clock size={16} />,
    partially_paid: <TrendingUp size={16} />,
    overdue: <AlertCircle size={16} />
  };
  return icons[statusLower] || icons.pending;
};

const getIntervalLabel = (interval?: PaymentInterval) => {
  const labels: Record<PaymentInterval, string> = {
    one_time: 'One Time',
    weekly: 'Weekly',
    bi_weekly: 'Bi-Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    half_yearly: 'Half-Yearly',
    yearly: 'Yearly',
    custom: 'Custom'
  };
  return interval ? labels[interval] : 'N/A';
};

// Mark Payment Modal Component
const MarkPaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, installment, paymentId, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(installment.remainingAmount.toString());
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);

  const [recordPayment, { isLoading }] = useRecordInstallmentPaymentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let amountToPay = parseFloat(paidAmount);

    // If amount is very small (less than 0.01), just pay the full remaining amount
    if (amountToPay < 0.01 && installment.remainingAmount < 0.01) {
      amountToPay = installment.remainingAmount;
    }

    if (amountToPay > installment.remainingAmount) {
      alert(`Amount cannot exceed remaining balance of ${formatCurrency(installment.remainingAmount)}`);
      return;
    }

    if (amountToPay <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await recordPayment({
        paymentId,
        installmentId: installment.id,
        data: {
          paidAmount: amountToPay,
          paymentMethod: paymentMethod || undefined,
          transactionRef: transactionRef || undefined,
          notes: notes || undefined,
        }
      }).unwrap();

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Mark Payment</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installment #{installment.installmentNumber}
            </label>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Total Amount: {formatCurrency(installment.amount)}</div>
              <div className="text-green-600">Already Paid: {formatCurrency(installment.paidAmount || 0)}</div>
              <div className="text-orange-600 font-semibold">Remaining: {formatCurrency(installment.remainingAmount)}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Pay Now <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Enter the amount you're paying now (will be added to already paid amount)
            </p>
            <input
              type="number"
              step="0.0001"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c81c1f] focus:border-transparent"
              required
              max={installment.remainingAmount}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c81c1f] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c81c1f] focus:border-transparent"
            >
              <option value="">Select method</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Reference
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g., TXN123456"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c81c1f] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#c81c1f] focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-[#c81c1f] text-white hover:bg-[#a01619] disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Card Component
const PaymentCard: React.FC<{ payment: PaymentData; onClick?: () => void }> = ({ payment, onClick }) => {
  const progressPercentage = payment.totalAmount > 0
    ? (payment.paidAmount / payment.totalAmount) * 100
    : 0;

  return (
    <div
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{payment.paymentName || payment.recordId}</h4>
          <p className="text-sm text-gray-500">{payment.recordId}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(payment.status)}`}>
          {getStatusIcon(payment.status)}
          {payment.status ? payment.status.replace('_', ' ').toUpperCase() : 'N/A'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="font-semibold text-gray-900">{formatCurrency(payment.totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Paid Amount</p>
          <p className="font-semibold text-green-600">{formatCurrency(payment.paidAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p className="font-semibold text-orange-600">{formatCurrency(payment.remainingAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Installments</p>
          <p className="font-semibold text-gray-900">{payment.installmentCount}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{payment.nextPaymentDescription || formatDate(payment.dueDate)}</span>
        </div>
        <span className="text-gray-400">Created: {formatDate(payment.createdAt)}</span>
      </div>
    </div>
  );
};

// Payment Detail View Component
const PaymentDetailView: React.FC<{
  payment: PaymentData;
  onBack: () => void;
  onRefresh: () => void;
  onEditPayment?: (paymentData: PaymentData) => void; // Add this line
}> = ({ payment, onBack, onRefresh, onEditPayment }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const installmentCount = (Array.isArray(payment.installments) ? payment.installments.length : (typeof payment.installmentCount === 'number' ? payment.installmentCount : (payment.paymentInterval === 'one_time' ? 1 : 0)));

  const handleMarkPaid = (installment: Installment) => {
    setSelectedInstallment(installment);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    onRefresh();
    setShowPaymentModal(false);
    setSelectedInstallment(null);
  };

  // function onEditPayment(payment: PaymentData): void {
  //   // If the parent provided an onEditPayment prop, call it
  //   if (typeof (payment as any).onEditPayment === 'function') {
  //     (payment as any).onEditPayment(payment);
  //     return;
  //   }
  //   // Otherwise, show an alert or log for now
  //   alert('Edit Payment functionality is not implemented.');
  //   // You could open an edit modal here if you implement one
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{payment.paymentName}</h3>
          <p className="text-sm text-gray-500">{payment.recordId}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(payment.status)}`}>
          {getStatusIcon(payment.status)}
          {payment.status ? payment.status.replace('_', ' ').toUpperCase() : 'N/A'}
        </div>
        <button
          onClick={() => {
            if (onEditPayment) {
              onEditPayment(payment);
            }
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <Edit size={16} />
          Edit Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(payment.totalAmount)}</p>
        </div>

        {payment.gstAmount && payment.gstAmount > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-purple-700 font-medium">GST Breakdown</p>
            </div>
            <div className="space-y-1 text-sm">
              {payment.isInterstate ? (
                <p className="text-purple-900">IGST: {formatCurrency(payment.igstAmount || 0)}</p>
              ) : (
                <>
                  <p className="text-purple-900">CGST: {formatCurrency(payment.cgstAmount || 0)}</p>
                  <p className="text-purple-900">SGST: {formatCurrency(payment.sgstAmount || 0)}</p>
                </>
              )}
              <p className="font-bold text-purple-900 pt-1 border-t border-purple-300">
                Total: {formatCurrency(payment.gstAmount)}
              </p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-sm text-green-700 font-medium">Paid Amount</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(payment.paidAmount)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-orange-600" />
            <p className="text-sm text-orange-700 font-medium">Remaining</p>
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(payment.remainingAmount)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-purple-600" />
            <p className="text-sm text-purple-700 font-medium">Installments</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">{installmentCount}</p>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Payment Type</p>
            <p className="font-medium text-gray-900">{payment.paymentType || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Payment Interval</p>
            <p className="font-medium text-gray-900">{getIntervalLabel(payment.paymentInterval)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Start Date</p>
            <p className="font-medium text-gray-900">{formatDate(payment.startDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Due Date</p>
            <p className="font-medium text-gray-900">{formatDate(payment.dueDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Next Payment</p>
            <p className="font-medium text-gray-900">{payment.nextPaymentDescription || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Created</p>
            <p className="font-medium text-gray-900">{formatDate(payment.createdAt)}</p>
          </div>
        </div>
        {payment.description && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-900">{payment.description}</p>
          </div>
        )}
      </div>

      {/* Installments */}
      {payment.installments && payment.installments.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Installments</h4>
          <div className="space-y-3">
            {payment.installments.map((installment) => {
              const isOverdue = installment.status === 'PENDING' && new Date(installment.dueDate) < new Date();

              return (
                <div
                  key={installment.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-900">
                          Installment #{installment.installmentNumber}
                        </h5>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(installment.status)}`}>
                          {getStatusIcon(installment.status)}
                          {installment.status || 'N/A'}
                        </div>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Due: {formatDate(installment.dueDate)}
                      </p>
                    </div>

                    {installment.status !== 'PAID' && (
                      <button
                        onClick={() => handleMarkPaid(installment)}
                        className="px-4 py-2 rounded-lg bg-[#c81c1f] text-white text-sm font-medium hover:bg-[#a01619] flex items-center gap-2"
                      >
                        <CreditCard size={16} />
                        Mark Paid
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Amount</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(installment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Paid</p>
                      <p className="font-semibold text-green-600">{formatCurrency(installment.paidAmount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Remaining</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(installment.remainingAmount)}</p>
                    </div>
                  </div>

                  {((installment.paidAmount || 0) > 0) && (
                    <div className="mt-3 pt-3 border-t">
                      <h6 className="text-sm font-semibold text-gray-900 mb-2">Payment History</h6>
                      {(() => {
                        let paymentHistory: Array<{
                          paidAmount: number;
                          paidDate: string;
                          paymentMethod?: string;
                          transactionRef?: string;
                          notes?: string;
                        }> = [];

                        // Try to parse payment history from notes
                        if (installment.notes && typeof installment.notes === 'string') {
                          try {
                            const parsed = JSON.parse(installment.notes);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              paymentHistory = parsed;
                            }
                          } catch (e) {
                            // If parsing fails, show as single entry (old format)
                            console.log('Could not parse payment history:', e);
                          }
                        }

                        // Fallback: If no valid history array, create from current installment data
                        if (paymentHistory.length === 0 && (installment.paidAmount || 0) > 0) {
                          paymentHistory = [{
                            paidAmount: installment.paidAmount || 0,
                            paidDate: installment.paidDate || new Date().toISOString(),
                            paymentMethod: installment.paymentMethod,
                            transactionRef: installment.transactionRef,
                            notes: undefined, // Don't show raw JSON as notes
                          }];
                        }

                        if (paymentHistory.length === 0) {
                          return <p className="text-sm text-gray-500">No payment records yet</p>;
                        }

                        return (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {paymentHistory.map((payment, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                                    <span className="font-semibold text-green-700">
                                      {formatCurrency(payment.paidAmount)}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {formatDate(payment.paidDate)}
                                  </div>
                                </div>

                                <div className="space-y-1 text-xs">
                                  {payment.paymentMethod && (
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <CreditCard size={12} className="text-gray-400" />
                                      <span className="font-medium">{payment.paymentMethod}</span>
                                    </div>
                                  )}

                                  {payment.transactionRef && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Tag size={12} className="text-gray-400" />
                                      <span>{payment.transactionRef}</span>
                                    </div>
                                  )}

                                  {payment.notes && (
                                    <div className="mt-1 text-gray-600 italic bg-white px-2 py-1 rounded border border-gray-200">
                                      💬 {payment.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {paymentHistory.length > 1 && (
                              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                                Total {paymentHistory.length} payment(s) •
                                Total paid: {formatCurrency(paymentHistory.reduce((sum, p) => sum + (p.paidAmount || 0), 0))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInstallment && (
        <MarkPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInstallment(null);
          }}
          installment={selectedInstallment}
          paymentId={payment.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

// Main Modal Component
const ViewPaymentsModal: React.FC<ViewPaymentsModalProps> = ({ isOpen, onClose, customer, onEditPayment }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'interval' | 'status' | 'deals' | 'invoices'>('all');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data, isLoading } = useGetCustomerPaymentHistoryQuery(customer.id);
  const { data: selectedPaymentData, isLoading: paymentLoading, refetch: refetchPayment } = useGetPaymentQuery(
    selectedPaymentId || '',
    { skip: !selectedPaymentId }
  );

  const payments: PaymentData[] = useMemo(() => {
    if (!data) return [];
    const historyData = data as any;
    const rawPayments = historyData?.payments || historyData?.data?.payments || [];

    return rawPayments.map((p: any) => {
      const dealObj = p.deal || p.relatedDeal || p.dealInfo || p.opportunityDeal || null;
      const normalizedDealId = p.dealId ?? p.deal_id ?? dealObj?.id ?? dealObj?._id ?? (typeof p.deal === 'string' ? p.deal : undefined) ?? dealObj?.recordId ?? p.dealRecordId;
      const normalizedDealName = p.dealName ?? dealObj?.name ?? dealObj?.recordId ?? p.dealRecordId;
      return {
        ...p,
        totalAmount: typeof p.totalAmount === 'string' ? parseFloat(p.totalAmount) : (p.totalAmount || 0),
        paidAmount: typeof p.paidAmount === 'string' ? parseFloat(p.paidAmount) : (p.paidAmount || 0),
        remainingAmount: typeof p.remainingAmount === 'string' ? parseFloat(p.remainingAmount) : (p.remainingAmount || 0),
        dealId: normalizedDealId,
        dealName: normalizedDealName,
        deal: dealObj || p.deal,
      } as PaymentData;
    });
  }, [data]);

  const summary = useMemo(() => {
    const summaryData = (data as any)?.summary || (data as any)?.data?.summary;

    if (summaryData) {
      return {
        totalPayments: summaryData.totalPayments || payments.length,
        totalAmount: typeof summaryData.totalAmount === 'string'
          ? parseFloat(summaryData.totalAmount)
          : (summaryData.totalAmount || 0),
        totalPaid: typeof summaryData.totalPaid === 'string'
          ? parseFloat(summaryData.totalPaid)
          : (summaryData.totalPaid || 0),
        totalPending: typeof summaryData.totalPending === 'string'
          ? parseFloat(summaryData.totalPending)
          : (summaryData.totalPending || 0)
      };
    }

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      totalPaid: payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
      totalPending: payments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0)
    };
  }, [data, payments]);

  const paymentsByInterval = useMemo(() => {
    const groups: Record<string, PaymentData[]> = {
      one_time: [],
      weekly: [],
      bi_weekly: [],
      monthly: [],
      quarterly: [],
      half_yearly: [],
      yearly: [],
      custom: []
    };

    payments.forEach(payment => {
      const interval = payment.paymentInterval || 'one_time';
      if (groups[interval]) {
        groups[interval].push(payment);
      }
    });

    return groups;
  }, [payments]);

  const paymentsByStatus = useMemo(() => {
    const groups: Record<PaymentStatus, PaymentData[]> = {
      paid: [],
      pending: [],
      partially_paid: [],
      overdue: []
    };

    payments.forEach(payment => {
      if (groups[payment.status]) {
        groups[payment.status].push(payment);
      }
    });

    return groups;
  }, [payments]);

  const paymentsByDeal = useMemo(() => {
    const groups: Record<string, { label: string; items: PaymentData[] }> = {};
    payments.forEach((p) => {
      const anyP = p as unknown as Record<string, any>;
      const dealId = anyP.dealId || anyP.deal_id || anyP.deal?._id || anyP.deal?.id || anyP.deal?.recordId || anyP.dealRecordId || '';
      const dealName = anyP.dealName || anyP.deal?.name || anyP.deal?.recordId || anyP.dealRecordId || '';
      const key = String(dealId || dealName || 'no_deal');
      const label = dealName || (dealId ? `Deal ${String(dealId).toString().slice(-6)}` : 'No Deal');
      if (!groups[key]) groups[key] = { label, items: [] };
      groups[key].items.push(p);
    });
    return groups;
  }, [payments]);

  const handlePaymentClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
  };

  const handleBackToList = () => {
    setSelectedPaymentId(null);
  };

  const handleViewInvoice = (paymentId: string) => {
  setSelectedInvoiceId(paymentId);
  setActiveTab('invoices');
};

const handlePrintInvoice = (paymentId: string) => {
  window.open(`/api/payments/${paymentId}/invoice?format=pdf`, '_blank');
};

const handleDownloadInvoice = (paymentId: string) => {
  window.open(`/api/payments/${paymentId}/invoice?format=pdf`, '_blank');
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedPaymentId ? 'Payment Details' : 'Payment History'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{customer.name}</p>
            {customer.email && (
              <p className="text-xs text-gray-500">{customer.email} {customer.phone && `• ${customer.phone}`}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {selectedPaymentId ? (
          /* Payment Detail View */
          <div className="flex-1 overflow-y-auto p-6">
            {paymentLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c81c1f] mx-auto mb-4" />
                  <p className="text-gray-600">Loading payment details...</p>
                </div>
              </div>
            ) : selectedPaymentData ? (
              <PaymentDetailView
                payment={selectedPaymentData as any}
                onBack={handleBackToList}
                onRefresh={() => {
                  refetchPayment();
                }}
                onEditPayment={(paymentData) => {
                  // Close the view modal and trigger parent's onEditPayment
                  if (onEditPayment) {
                    onEditPayment(paymentData);
                  }
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Payment not found</p>
                <button
                  onClick={handleBackToList}
                  className="mt-4 px-4 py-2 bg-[#c81c1f] text-white rounded-lg hover:bg-[#a01619]"
                >
                  Back to List
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Payment List View */
          <>
            {/* Summary Cards */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} className="text-blue-600" />
                    <p className="text-sm text-gray-600">Total Payments</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalPayments}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-sm text-gray-600 mb-2">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-sm text-gray-600 mb-2">Remaining</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalPending)}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-3 border-b bg-white">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'all'
                    ? 'bg-[#c81c1f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All Payments ({payments.length})
                </button>
                <button
                  onClick={() => setActiveTab('interval')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'interval'
                    ? 'bg-[#c81c1f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  By Interval
                </button>
                <button
                  onClick={() => setActiveTab('deals')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'deals'
                    ? 'bg-[#c81c1f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  By Deals
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'status'
                    ? 'bg-[#c81c1f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  By Status
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'invoices'
                    ? 'bg-[#c81c1f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <FileText size={16} />
                  Invoices ({payments.length})
                </button>
              </div>
            </div>

            {/* Payment List Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c81c1f] mx-auto mb-4" />
                    <p className="text-gray-600">Loading payments...</p>
                  </div>
                </div>
              ) : payments.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <DollarSign size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No payments found</p>
                    <p className="text-gray-500 text-sm mt-2">This customer doesn't have any payments yet.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* All Payments View */}
                  {activeTab === 'all' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {payments.map(payment => (
                        <PaymentCard
                          key={payment.id}
                          payment={payment}
                          onClick={() => handlePaymentClick(payment.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* By Interval View */}
                  {activeTab === 'interval' && (
                    <div className="space-y-6">
                      {Object.entries(paymentsByInterval).map(([interval, intervalPayments]) => {
                        if (intervalPayments.length === 0) return null;
                        return (
                          <div key={interval}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Calendar size={20} className="text-[#c81c1f]" />
                              {getIntervalLabel(interval as PaymentInterval)}
                              <span className="text-sm font-normal text-gray-500">({intervalPayments.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {intervalPayments.map(payment => (
                                <PaymentCard
                                  key={payment.id}
                                  payment={payment}
                                  onClick={() => handlePaymentClick(payment.id)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* By Deals View */}
                  {activeTab === 'deals' && (
                    <div className="space-y-6">
                      {Object.entries(paymentsByDeal).map(([key, group]) => {
                        if (!group.items || group.items.length === 0) return null;
                        return (
                          <div key={key}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Tag size={20} className="text-[#c81c1f]" />
                              {group.label}
                              <span className="text-sm font-normal text-gray-500">({group.items.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {group.items.map(payment => (
                                <PaymentCard
                                  key={payment.id}
                                  payment={payment}
                                  onClick={() => handlePaymentClick(payment.id)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* By Status View */}
                  {activeTab === 'status' && (
                    <div className="space-y-6">
                      {/* Overdue */}
                      {paymentsByStatus.overdue.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                            <AlertCircle size={20} />
                            Overdue Payments ({paymentsByStatus.overdue.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paymentsByStatus.overdue.map(payment => (
                              <PaymentCard
                                key={payment.id}
                                payment={payment}
                                onClick={() => handlePaymentClick(payment.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pending */}
                      {paymentsByStatus.pending.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                            <Clock size={20} />
                            Pending Payments ({paymentsByStatus.pending.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paymentsByStatus.pending.map(payment => (
                              <PaymentCard
                                key={payment.id}
                                payment={payment}
                                onClick={() => handlePaymentClick(payment.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Partially Paid */}
                      {paymentsByStatus.partially_paid.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                            <TrendingUp size={20} />
                            Partially Paid ({paymentsByStatus.partially_paid.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paymentsByStatus.partially_paid.map(payment => (
                              <PaymentCard
                                key={payment.id}
                                payment={payment}
                                onClick={() => handlePaymentClick(payment.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Paid */}
                      {paymentsByStatus.paid.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <CheckCircle size={20} />
                            Completed Payments ({paymentsByStatus.paid.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paymentsByStatus.paid.map(payment => (
                              <PaymentCard
                                key={payment.id}
                                payment={payment}
                                onClick={() => handlePaymentClick(payment.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invoices View */}
{activeTab === 'invoices' && (
  <div className="space-y-4">
    {payments.map(payment => (
      <div key={payment.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} className="text-[#c81c1f]" />
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">
                  Invoice #{payment.recordId || payment.id.slice(-8)}
                </h4>
                <p className="text-sm text-gray-600">{payment.paymentName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-500">Invoice Date</p>
                <p className="font-medium text-gray-900">{formatDate(payment.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="font-medium text-gray-900">{formatDate(payment.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-semibold text-gray-900">{formatCurrency(payment.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                  {payment.status?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoice Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={() => handlePaymentClick(payment.id)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Eye size={16} />
            View Details
          </button>
          <button
            onClick={() => handleViewInvoice(payment.id)}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <FileText size={16} />
            View Invoice
          </button>
          <button
            onClick={() => handleDownloadInvoice(payment.id)}
            className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={() => handlePrintInvoice(payment.id)}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2 text-sm"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>
    ))}
  </div>
)}
                </>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPaymentsModal;