import React, { useRef } from 'react';

type InvoiceData = {
  invoiceNumber: string;
  paymentName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal: number;
  discountType?: string;
  discountValue?: number;
  taxType?: string;
  taxValue?: number;
  gstType?: string;
  gstRate?: number;
  isInterstate?: boolean;
  totalAmount: number;
  paymentType?: string;
  paymentInterval?: string;
  startDate?: string;
  dueDate?: string;
  numberOfInstallments?: number;
  customInstallments?: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: string;
  }>;
  serviceName?: string;
  serviceRate?: number;
  description?: string;
  createdAt?: string;
};

type InvoicePrintProps = {
  data: InvoiceData;
  onClose: () => void;
};

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ data, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDiscount = () => {
    if (!data.discountValue) return 0;
    if (data.discountType === 'percentage') {
      return (data.subtotal * data.discountValue) / 100;
    }
    return data.discountValue;
  };

  const calculateTax = () => {
    if (!data.taxValue) return 0;
    if (data.taxType === 'percentage') {
      return (data.subtotal * data.taxValue) / 100;
    }
    return data.taxValue;
  };

  const calculateGST = () => {
    if (!data.gstRate || data.gstType === 'none') return 0;
    if (data.gstType === 'exclusive') {
      return (data.subtotal * data.gstRate) / 100;
    }
    return 0; // Inclusive GST is already in subtotal
  };

  const discount = calculateDiscount();
  const tax = calculateTax();
  const gst = calculateGST();
  const cgst = data.isInterstate ? 0 : gst / 2;
  const sgst = data.isInterstate ? 0 : gst / 2;
  const igst = data.isInterstate ? gst : 0;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:p-4 md:p-6 overflow-auto">
        <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl flex flex-col min-h-0 my-2 sm:my-4">
          {/* Header - No Print */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b shrink-0">
            <h2 className="text-xl font-semibold">Invoice Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#c81c1f] text-white rounded hover:opacity-90"
              >
                Print / Download
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div id="invoice-print-area" ref={printRef} className="p-4 sm:p-6 md:p-8 flex-1 overflow-auto max-w-full min-h-0">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#c81c1f] mb-2">INVOICE</h1>
                <p className="text-gray-600">Invoice #: {data.invoiceNumber}</p>
                <p className="text-gray-600">Date: {formatDate(data.createdAt || new Date().toISOString())}</p>
                {data.dueDate && (
                  <p className="text-gray-600">Due Date: {formatDate(data.dueDate)}</p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-xl font-semibold mb-2">Your Company Name</h2>
                <p className="text-gray-600">123 Business Street</p>
                <p className="text-gray-600">City, State - 123456</p>
                <p className="text-gray-600">Email: info@company.com</p>
                <p className="text-gray-600">Phone: +91 1234567890</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Bill To:</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="font-semibold">{data.customerName || 'Customer Name'}</p>
                {data.customerEmail && <p className="text-gray-600">Email: {data.customerEmail}</p>}
                {data.customerPhone && <p className="text-gray-600">Phone: {data.customerPhone}</p>}
              </div>
            </div>

            {/* Payment Details */}
            {data.paymentName && (
              <div className="mb-6">
                <p className="text-gray-700"><span className="font-semibold">Payment For:</span> {data.paymentName}</p>
                {data.description && (
                  <p className="text-gray-600 mt-1">{data.description}</p>
                )}
              </div>
            )}

            {/* Service/Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-3 text-left">Description</th>
                    <th className="border px-4 py-3 text-right">Rate</th>
                    <th className="border px-4 py-3 text-right">Quantity</th>
                    <th className="border px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-4 py-3">{data.serviceName || data.paymentName || 'Service'}</td>
                    <td className="border px-4 py-3 text-right">
                      {formatCurrency(data.serviceRate || data.subtotal)}
                    </td>
                    <td className="border px-4 py-3 text-right">1</td>
                    <td className="border px-4 py-3 text-right font-semibold">
                      {formatCurrency(data.subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(data.subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between py-2 border-b text-green-600">
                    <span>
                      Discount ({data.discountType === 'percentage' ? `${data.discountValue}%` : 'Fixed'}):
                    </span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-700">
                      Tax ({data.taxType === 'percentage' ? `${data.taxValue}%` : 'Fixed'}):
                    </span>
                    <span className="font-semibold">{formatCurrency(tax)}</span>
                  </div>
                )}

                {data.gstType !== 'none' && data.gstRate && (
                  <>
                    {data.gstType === 'inclusive' && (
                      <div className="flex justify-between py-2 border-b text-gray-600 text-sm">
                        <span>GST ({data.gstRate}% Inclusive):</span>
                        <span>Included</span>
                      </div>
                    )}
                    {data.gstType === 'exclusive' && (
                      <>
                        {data.isInterstate ? (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-700">IGST ({data.gstRate}%):</span>
                            <span className="font-semibold">{formatCurrency(igst)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-700">CGST ({data.gstRate / 2}%):</span>
                              <span className="font-semibold">{formatCurrency(cgst)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-gray-700">SGST ({data.gstRate / 2}%):</span>
                              <span className="font-semibold">{formatCurrency(sgst)}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2">
                  <span className="text-lg font-bold">Total Amount:</span>
                  <span className="text-lg font-bold text-[#c81c1f]">
                    {formatCurrency(data.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Schedule for Installments */}
            {data.customInstallments && data.customInstallments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Payment Schedule:</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Installment</th>
                      <th className="border px-4 py-2 text-right">Amount</th>
                      <th className="border px-4 py-2 text-right">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customInstallments.map((inst) => (
                      <tr key={inst.installmentNumber}>
                        <td className="border px-4 py-2">Installment #{inst.installmentNumber}</td>
                        <td className="border px-4 py-2 text-right">{formatCurrency(inst.amount)}</td>
                        <td className="border px-4 py-2 text-right">{formatDate(inst.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.paymentType === 'recurring' && data.numberOfInstallments && (
              <div className="mb-8 bg-blue-50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Recurring Payment:</h3>
                <p className="text-gray-700">
                  This invoice represents a recurring payment of {formatCurrency(data.totalAmount)} 
                  {' '}split into {data.numberOfInstallments} installments.
                </p>
                <p className="text-gray-700 mt-1">
                  Payment Frequency: {data.paymentInterval?.replace('_', ' ').toUpperCase()}
                </p>
                {data.startDate && (
                  <p className="text-gray-700 mt-1">
                    Start Date: {formatDate(data.startDate)}
                  </p>
                )}
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="mt-12 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">Terms and Conditions:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Payment is due within the specified due date.</li>
                <li>• Late payments may incur additional charges.</li>
                <li>• Please retain this invoice for your records.</li>
                <li>• For any queries, please contact us at the above email or phone number.</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500 border-t pt-4">
              <p>Thank you for your business!</p>
              <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoicePrint;