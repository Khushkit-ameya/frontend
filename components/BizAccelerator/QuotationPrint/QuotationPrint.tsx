import React from 'react';

export type QuotationLineItemPrint = {
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discount?: number;
  taxType?: 'PERCENTAGE' | 'FIXED';
  tax?: number;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
};

export type QuotationPrintData = {
  quotationNumber?: string;
  quotationName?: string;
  dealName?: string;
  opportunityName?: string;
  quotationDate?: string;
  createdAt?: string;
  version?: number;
  lineItems: QuotationLineItemPrint[];
};

type QuotationPrintProps = { data: QuotationPrintData; onClose: () => void };

const fmt = (n?: number) =>
  typeof n === 'number' && isFinite(n)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(0);

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');

const computeTotals = (items: QuotationLineItemPrint[]) => {
  return items.reduce(
    (acc, it) => {
      const qty = Number(it.quantity) || 0;
      const unit = Number(it.unitPrice) || 0;
      const subtotal = typeof it.subtotal === 'number' ? it.subtotal : qty * unit;
      const discountAmount = typeof it.discountAmount === 'number' ? it.discountAmount : 0;
      const taxAmount = typeof it.taxAmount === 'number' ? it.taxAmount : 0;
      const total = typeof it.totalAmount === 'number' ? it.totalAmount : subtotal - discountAmount + taxAmount;
      acc.subtotal += subtotal;
      acc.discount += discountAmount;
      acc.tax += taxAmount;
      acc.total += total;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 }
  );
};

const QuotationPrint: React.FC<QuotationPrintProps> = ({ data, onClose }) => {
  const totals = computeTotals(data.lineItems || []);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #quotation-print-area, #quotation-print-area * { visibility: visible; }
          #quotation-print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto !important; max-height: none !important; overflow: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:p-4 md:p-6 overflow-auto">
        <div className="bg-white rounded-lg w-full max-w-5xl shadow-xl flex flex-col min-h-0 my-2 sm:my-4">
          {/* Header */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b shrink-0">
            <h2 className="text-xl font-semibold">Quotation Preview</h2>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="px-4 py-2 bg-[#c81c1f] text-white rounded hover:opacity-90">Print / Download</button>
              <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Close</button>
            </div>
          </div>

          {/* Content */}
          <div id="quotation-print-area" className="p-4 sm:p-6 md:p-8 flex-1 overflow-auto max-w-full min-h-0">
            {/* Header info */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#c81c1f] mb-2">QUOTATION</h1>
                {data.quotationNumber && (
                  <p className="text-gray-600">Quotation #: {data.quotationNumber}</p>
                )}
                <p className="text-gray-600">Date: {fmtDate(data.quotationDate || data.createdAt || new Date().toISOString())}</p>
                {data.quotationName && <p className="text-gray-600">Title: {data.quotationName}</p>}
                {typeof data.version === 'number' && (
                  <p className="text-gray-600">Version: v{data.version}</p>
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

            {/* Names only (no labels) */}
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded">
                {data.dealName && (
                  <p className="font-semibold">{data.dealName}</p>
                )}
                {data.opportunityName && (
                  <p className="text-gray-600">{data.opportunityName}</p>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-3 text-left">Item</th>
                    <th className="border px-4 py-3 text-left">Description</th>
                    <th className="border px-4 py-3 text-right">Qty</th>
                    <th className="border px-4 py-3 text-right">Unit Price</th>
                    <th className="border px-4 py-3 text-right">Discount</th>
                    <th className="border px-4 py-3 text-right">Tax</th>
                    <th className="border px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lineItems.map((li, idx) => (
                    <tr key={idx}>
                      <td className="border px-4 py-3">{li.itemName || 'Item'}</td>
                      <td className="border px-4 py-3">{li.description || '-'}</td>
                      <td className="border px-4 py-3 text-right">{li.quantity}</td>
                      <td className="border px-4 py-3 text-right">{fmt(li.unitPrice)}</td>
                      <td className="border px-4 py-3 text-right">{li.discountAmount ? `- ${fmt(li.discountAmount)}` : '-'}</td>
                      <td className="border px-4 py-3 text-right">{li.taxAmount ? `+ ${fmt(li.taxAmount)}` : '-'}</td>
                      <td className="border px-4 py-3 text-right font-semibold">{fmt(li.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">{fmt(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between py-2 border-b text-green-600">
                    <span>Discount:</span>
                    <span>- {fmt(totals.discount)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-700">Tax:</span>
                    <span className="font-semibold">{fmt(totals.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2">
                  <span className="text-lg font-bold">Total Amount:</span>
                  <span className="text-lg font-bold text-[#c81c1f]">{fmt(totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-12 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">Terms and Conditions:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• This quotation is valid for 30 days from the date of issue.</li>
                <li>• Prices are subject to change without prior notice.</li>
                <li>• Taxes, if applicable, are calculated as per prevailing rates.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuotationPrint;
