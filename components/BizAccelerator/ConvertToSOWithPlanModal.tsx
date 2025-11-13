"use client";

import React from "react";
import DatePicker from "@/components/common/DatePicker";
import { useGetQuotationQuery } from "@/store/api_query/BizAcceleratorQuotations.api";

type ConvertToSOWithPlanModalProps = {
  isOpen: boolean;
  quotation: any;
  onClose: () => void;
  onSubmit: (plan: any) => Promise<void> | void;
};

const planMaxReminderDays: Record<string, number> = {
  one_time: 6,
  weekly: 6,
  bi_weekly: 13,
  monthly: 27,
  quarterly: 89,
  half_yearly: 180,
  yearly: 360,
  custom: 360,
};

const computeInstallments = (plan?: string, from?: string, to?: string) => {
  if (!plan) return 1;
  const p = plan.toLowerCase();
  if (!from || !to) return 1;
  const d1 = new Date(from);
  const d2 = new Date(to);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 < d1) return 1;
  const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  switch (p) {
    case "weekly":
      return Math.max(1, Math.ceil(diffDays / 7));
    case "bi_weekly":
      return Math.max(1, Math.ceil(diffDays / 14));
    case "monthly": {
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
      return Math.max(1, months);
    }
    case "quarterly": {
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
      return Math.max(1, Math.ceil(months / 3));
    }
    case "half_yearly": {
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
      return Math.max(1, Math.ceil(months / 6));
    }
    case "yearly": {
      const years = d2.getFullYear() - d1.getFullYear() + 1;
      return Math.max(1, years);
    }
    default:
      return 1;
  }
};

const formatCurrency = (n?: number) => (typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0");

const ConvertToSOWithPlanModal: React.FC<ConvertToSOWithPlanModalProps> = ({ isOpen, quotation, onClose, onSubmit }) => {
  const { data: fullQuotation } = useGetQuotationQuery(quotation?.id || "", { skip: !quotation?.id });
  const sourceQuote: any = fullQuotation || quotation;
  const items = React.useMemo(() => (Array.isArray(sourceQuote?.lineItems) ? sourceQuote.lineItems : []), [sourceQuote]);

  type CustomInst = { installmentNumber: number; amount: number; dueDate: string; reminderDaysBefore?: number };
  type LineItemPlan = {
    lineItemId: string;
    itemName: string;
    totalAmount: number;
    paymentPlan: string; // one_time | weekly | bi_weekly | monthly | quarterly | half_yearly | yearly | custom
    dueDate?: string; // one_time
    reminderDaysBefore?: number;
    fromDate?: string; // recurring
    toDate?: string;   // recurring
    customInstallments?: CustomInst[]; // custom
  };

  const [plans, setPlans] = React.useState<LineItemPlan[]>([]);

  React.useEffect(() => {
    setPlans(items.map((it: any) => ({
      lineItemId: String(it.id || it.lineItemId || ""),
      itemName: String(it.itemName || "Item"),
      totalAmount: Number(it.totalAmount || 0),
      paymentPlan: "one_time",
      dueDate: "",
      reminderDaysBefore: 3,
      fromDate: "",
      toDate: "",
      customInstallments: [],
    })));
  }, [items]);

  const updatePlan = (idx: number, updates: Partial<LineItemPlan>) => {
    setPlans((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  const addCustomInstallment = (idx: number) => {
    setPlans((prev) => {
      const copy = [...prev];
      const list = copy[idx].customInstallments || [];
      const next: CustomInst = { installmentNumber: list.length + 1, amount: 0, dueDate: "", reminderDaysBefore: 3 };
      copy[idx] = { ...copy[idx], customInstallments: [...list, next] };
      return copy;
    });
  };

  const removeCustomInstallment = (idx: number, instIndex: number) => {
    setPlans((prev) => {
      const copy = [...prev];
      const list = (copy[idx].customInstallments || []).filter((_: any, i: number) => i !== instIndex).map((ci: any, i: number) => ({ ...ci, installmentNumber: i + 1 }));
      copy[idx] = { ...copy[idx], customInstallments: list };
      return copy;
    });
  };

  const validateAll = (): string | null => {
    if (!items.length) {
      return "Quotation has no line items available. Please reload or open the quotation to verify.";
    }
    for (let i = 0; i < plans.length; i++) {
      const p = plans[i];
      if (!p.lineItemId) return `${p.itemName}: Missing line item reference. Please reopen and try again.`;
      const plan = (p.paymentPlan || '').toLowerCase();
      const maxRem = planMaxReminderDays[plan] ?? 360;

      if (p.reminderDaysBefore && p.reminderDaysBefore > maxRem) {
        return `${p.itemName}: Reminder Days Before cannot exceed ${maxRem}`;
      }

      if (plan === 'one_time') {
        if (!p.dueDate) return `${p.itemName}: Due date is required`;
      } else if (["weekly","bi_weekly","monthly","quarterly","half_yearly","yearly"].includes(plan)) {
        if (!p.fromDate || !p.toDate) return `${p.itemName}: From and To dates are required`;
        if (new Date(p.toDate) < new Date(p.fromDate)) return `${p.itemName}: To Date must be after or equal to From Date`;
      } else if (plan === 'custom') {
        const list = p.customInstallments || [];
        if (list.length === 0) return `${p.itemName}: Please add at least one installment`;
        let sum = 0;
        for (let j = 0; j < list.length; j++) {
          const inst = list[j];
          if (!inst.dueDate) return `${p.itemName}: Installment ${j + 1} due date is required`;
          if (!(inst.amount > 0)) return `${p.itemName}: Installment ${j + 1} amount must be > 0`;
          sum += Number(inst.amount || 0);
        }
        if (Math.abs(sum - p.totalAmount) > 0.01) return `${p.itemName}: Sum of installments (${formatCurrency(sum)}) must equal total (${formatCurrency(p.totalAmount)})`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validateAll();
    if (err) {
      alert(err);
      return;
    }

    const lineItemPaymentPlans = plans.map((p) => {
      const plan = (p.paymentPlan || '').toLowerCase();
      if (plan === 'one_time') {
        return {
          lineItemId: p.lineItemId,
          itemName: p.itemName,
          paymentType: 'full',
          paymentInterval: 'one_time',
          startDate: p.dueDate,
          reminderDaysBefore: p.reminderDaysBefore ?? 3,
          totalAmount: p.totalAmount,
        };
      }
      if (["weekly","bi_weekly","monthly","quarterly","half_yearly","yearly"].includes(plan)) {
        return {
          lineItemId: p.lineItemId,
          itemName: p.itemName,
          paymentType: 'recurring',
          paymentInterval: plan,
          numberOfInstallments: computeInstallments(plan, p.fromDate, p.toDate),
          startDate: p.fromDate,
          reminderDaysBefore: p.reminderDaysBefore ?? 3,
          totalAmount: p.totalAmount,
        };
      }
      // custom
      return {
        lineItemId: p.lineItemId,
        itemName: p.itemName,
        paymentType: 'custom',
        customInstallments: (p.customInstallments || []).map((c) => ({
          installmentNumber: c.installmentNumber,
          amount: Number(c.amount || 0),
          dueDate: c.dueDate,
          reminderDaysBefore: c.reminderDaysBefore ?? 3,
        })),
        reminderDaysBefore: p.reminderDaysBefore ?? 3,
        totalAmount: p.totalAmount,
      };
    });

    const payload = { lineItemPaymentPlans };
    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-auto">
      <div className="bg-white rounded-[10px] w-full max-w-5xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#656462' }}>
          <h3 className="text-white text-base font-medium">Convert to SO • Payment Plan</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          {!items.length && (
            <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-800 text-sm">
              No line items found on this quotation. Payment plan cannot be configured without items.
            </div>
          )}
          {plans.map((p, idx) => (
            <div key={p.lineItemId || idx} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.itemName}</div>
                <div className="text-sm text-gray-700">Total: <span className="font-medium">{formatCurrency(p.totalAmount)}</span></div>
              </div>

              {/* Line item details */}
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                <div><span className="text-gray-500">SKU:</span> {(items[idx]?.sku) || '-'}</div>
                <div><span className="text-gray-500">Unit:</span> {(items[idx]?.unit) || '-'}</div>
                <div><span className="text-gray-500">Quantity:</span> {items[idx]?.quantity ?? '-'}</div>
                <div><span className="text-gray-500">Unit Price:</span> {formatCurrency(items[idx]?.unitPrice)}</div>
                <div><span className="text-gray-500">Discount:</span> {formatCurrency(items[idx]?.discount)} {items[idx]?.discountType ? `(${String(items[idx]?.discountType).toUpperCase()})` : ''}</div>
                <div><span className="text-gray-500">Tax:</span> {formatCurrency(items[idx]?.tax)} {items[idx]?.taxType ? `(${String(items[idx]?.taxType).toUpperCase()})` : ''}</div>
                <div><span className="text-gray-500">Subtotal:</span> {formatCurrency(items[idx]?.subtotal)}</div>
                <div><span className="text-gray-500">Discount Amt:</span> {formatCurrency(items[idx]?.discountAmount)}</div>
                <div><span className="text-gray-500">Tax Amt:</span> {formatCurrency(items[idx]?.taxAmount)}</div>
                <div className="md:col-span-3"><span className="text-gray-500">Description:</span> {items[idx]?.description || '-'}</div>
                {items[idx]?.notes ? (
                  <div className="md:col-span-3"><span className="text-gray-500">Notes:</span> {items[idx]?.notes}</div>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Payment Plan</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={p.paymentPlan}
                    onChange={(e) => updatePlan(idx, { paymentPlan: e.target.value })}
                  >
                    <option value="one_time">One Time</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half-Yearly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Reminder Days Before (≤ {planMaxReminderDays[(p.paymentPlan || '').toLowerCase()] ?? 360})</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={p.reminderDaysBefore ?? 3} onChange={(e) => updatePlan(idx, { reminderDaysBefore: parseInt(e.target.value || '0', 10) })} />
                </div>
              </div>

              {(p.paymentPlan || '').toLowerCase() === 'one_time' && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Due Date</label>
                    <DatePicker value={p.dueDate} onChange={(d) => updatePlan(idx, { dueDate: d || '' })} />
                  </div>
                </div>
              )}

              {["weekly","bi_weekly","monthly","quarterly","half_yearly","yearly"].includes((p.paymentPlan || '').toLowerCase()) && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">From</label>
                    <DatePicker value={p.fromDate} onChange={(d) => updatePlan(idx, { fromDate: d || '' })} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">To</label>
                    <DatePicker value={p.toDate} onChange={(d) => updatePlan(idx, { toDate: d || '' })} />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-gray-700">Installments: <span className="font-medium">{computeInstallments(p.paymentPlan, p.fromDate, p.toDate)}</span></div>
                  </div>
                </div>
              )}

              {(p.paymentPlan || '').toLowerCase() === 'custom' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">Custom Installments</div>
                    <button type="button" onClick={() => addCustomInstallment(idx)} className="px-3 py-1 text-sm rounded bg-[#c81c1f] text-white hover:opacity-90">+ Add Installment</button>
                  </div>
                  {(p.customInstallments || []).length === 0 && (
                    <p className="text-sm text-gray-500">No installments added.</p>
                  )}
                  {(p.customInstallments || []).map((ci, i) => (
                    <div key={i} className="mb-3 p-3 border rounded">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Installment #{ci.installmentNumber}</label>
                          <input type="number" step="0.01" min="0.01" className="w-full border rounded px-2 py-1 text-sm" value={ci.amount || ''} onChange={(e) => {
                            const v = parseFloat(e.target.value || '0');
                            const list = (plans[idx].customInstallments || []).map((row, ri) => ri === i ? { ...row, amount: v } : row);
                            updatePlan(idx, { customInstallments: list });
                          }} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Due Date</label>
                          <DatePicker value={ci.dueDate} onChange={(d) => {
                            const list = (plans[idx].customInstallments || []).map((row, ri) => ri === i ? { ...row, dueDate: d || '' } : row);
                            updatePlan(idx, { customInstallments: list });
                          }} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Reminder Days Before</label>
                          <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={ci.reminderDaysBefore ?? 3} onChange={(e) => {
                            const list = (plans[idx].customInstallments || []).map((row, ri) => ri === i ? { ...row, reminderDaysBefore: parseInt(e.target.value || '0', 10) } : row);
                            updatePlan(idx, { customInstallments: list });
                          }} />
                        </div>
                        <div className="flex items-end">
                          <button type="button" onClick={() => removeCustomInstallment(idx, i)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-gray-700">Sum of installments should equal total: <span className="font-medium">{formatCurrency(plans[idx].customInstallments?.reduce((s, c) => s + Number(c.amount || 0), 0) || 0)} / {formatCurrency(p.totalAmount)}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handleSubmit} className="px-3 py-1.5 rounded bg-[#c81c1f] text-white hover:opacity-90">Create Sales Order</button>
        </div>
      </div>
    </div>
  );
};

export default ConvertToSOWithPlanModal;
