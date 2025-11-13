"use client";

import React from 'react';
import DatePicker from '@/components/common/DatePicker';
import { useForm } from 'react-hook-form';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

export type PlanOption = { value: string; label: string };
export type DealOption = { value: string; label: string };

export type AddPaymentModalProps = {
  onClose: () => void;
  onSave: (values: SavePayload, generateInvoice: boolean) => Promise<void> | void;
  recipient: { name?: string; email?: string; phone?: string };
  planOptions: PlanOption[];
  dealOptions: DealOption[];
  initialValues?: Partial<FormValues>;
  initialInvoiceNumber?: string;
  isEditMode?: boolean;
  paymentId?: string;
};

export type CustomInstallment = {
  installmentNumber: number;
  amountType: 'percentage' | 'fixed';
  amountValue: number;
  amount: number;
  dueDate: string;
  reminderDaysBefore?: number;
  // Edit mode tracking
  status?: string;
  paidAmount?: number;
  id?: string;
  isLocked?: boolean;
  paidDate?: string;
  paymentMethod?: string;
};

export type FormValues = {
  dealId?: string;
  serviceName?: string;
  serviceRate?: number;
  paymentPlan?: string;
  fromDate?: string;
  toDate?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: number;
  discountEnabled?: boolean;
  discountType?: 'none' | 'percentage' | 'fixed';
  discountValue?: number;
  taxEnabled?: boolean;
  taxType?: 'none' | 'percentage' | 'fixed';
  taxValue?: number;
  gstEnabled?: boolean;
  gstType?: 'none' | 'inclusive' | 'exclusive';
  gstRate?: number;
  isInterstate?: boolean;
  reminderDaysBefore?: number;
  invoiceNumber: string;
  nextReminderDate?: string;
  paymentName?: string;
  description?: string;
  customInstallments?: CustomInstallment[];
  status?: string;
  paymentStatus?: string;
};

export type SavePayload = Omit<FormValues, 'customInstallments'> & {
  paymentAmount?: number;
  numberOfInstallments?: number;
  paymentType?: 'full' | 'recurring' | 'custom';
  customInstallments?: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: string;
    reminderDaysBefore?: number;
    id?: string;
  }>;
  startDate?: string;
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
    case 'weekly':
      return Math.max(1, Math.ceil(diffDays / 7));
    case 'bi_weekly':
      return Math.max(1, Math.ceil(diffDays / 14));
    case 'monthly': {
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
      return Math.max(1, months);
    }
    case 'quarterly': {
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
      return Math.max(1, Math.ceil(months / 3));
    }
    case 'half_yearly': {
      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
      return Math.max(1, Math.ceil(months / 6));
    }
    case 'yearly': {
      const years = d2.getFullYear() - d1.getFullYear() + 1;
      return Math.max(1, years);
    }
    default:
      return 1;
  }
};

const formatCurrency = (n?: number) =>
  typeof n === 'number' && !Number.isNaN(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';

const computeTotals = (v: FormValues) => {
  const subtotal = Number(v.subtotal) || 0;
  let total = subtotal;
  let discountAmount = 0;
  let taxAmount = 0;
  let gstAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (v.discountEnabled) {
    const dv = Number(v.discountValue) || 0;
    if (v.discountType === 'percentage') {
      discountAmount = (subtotal * dv) / 100;
      total -= discountAmount;
    } else if (v.discountType === 'fixed') {
      discountAmount = dv;
      total -= dv;
    }
  }

  if (v.taxEnabled) {
    const tv = Number(v.taxValue) || 0;
    if (v.taxType === 'percentage') {
      taxAmount = (subtotal * tv) / 100;
      total += taxAmount;
    } else if (v.taxType === 'fixed') {
      taxAmount = tv;
      total += tv;
    }
  }

  if (v.gstEnabled) {
    const gr = Number(v.gstRate) || 0;
    if (v.gstType === 'exclusive') {
      gstAmount = (subtotal * gr) / 100;
      
      if (v.isInterstate) {
        igstAmount = gstAmount;
      } else {
        cgstAmount = gstAmount / 2;
        sgstAmount = gstAmount / 2;
      }
      
      total += gstAmount;
    } else if (v.gstType === 'inclusive') {
      gstAmount = (subtotal * gr) / (100 + gr);
      
      if (v.isInterstate) {
        igstAmount = gstAmount;
      } else {
        cgstAmount = gstAmount / 2;
        sgstAmount = gstAmount / 2;
      }
    }
  }

  if (total < 0) total = 0;
  
  return { 
    total, 
    discountAmount, 
    taxAmount, 
    gstAmount, 
    cgstAmount, 
    sgstAmount, 
    igstAmount 
  };
};

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  onClose,
  onSave,
  recipient,
  planOptions,
  dealOptions,
  initialValues,
  initialInvoiceNumber,
  isEditMode = false,
  paymentId,
}) => {
  const genInvoice = React.useCallback(() => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`, []);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      invoiceNumber: initialInvoiceNumber || genInvoice(),
      discountEnabled: false,
      discountType: 'none',
      taxEnabled: false,
      taxType: 'none',
      gstEnabled: false,
      gstType: 'none',
      isInterstate: false,
      ...initialValues,
    },
  });

  const wPlan = watch('paymentPlan');
  const wSubtotal = watch('subtotal');
  const wDiscountEnabled = watch('discountEnabled');
  const wDiscountType = watch('discountType');
  const wDiscountValue = watch('discountValue');
  const wTaxEnabled = watch('taxEnabled');
  const wTaxType = watch('taxType');
  const wTaxValue = watch('taxValue');
  const wGstEnabled = watch('gstEnabled');
  const wGstType = watch('gstType');
  const wGstRate = watch('gstRate');
  const wIsInterstate = watch('isInterstate');

  const [customInstallments, setCustomInstallments] = React.useState<CustomInstallment[]>(
    initialValues?.customInstallments?.map(inst => ({
      ...inst,
      isLocked: inst.status === 'PAID' || (inst.paidAmount || 0) > 0
    })) || []
  );

  const calculations = React.useMemo(() => computeTotals({
    subtotal: wSubtotal,
    discountEnabled: wDiscountEnabled,
    discountType: wDiscountType,
    discountValue: wDiscountValue,
    taxEnabled: wTaxEnabled,
    taxType: wTaxType,
    taxValue: wTaxValue,
    gstEnabled: wGstEnabled,
    gstType: wGstType,
    gstRate: wGstRate,
    isInterstate: wIsInterstate,
    invoiceNumber: watch('invoiceNumber') || '',
  } as FormValues), [
    wSubtotal, wDiscountEnabled, wDiscountType, wDiscountValue, 
    wTaxEnabled, wTaxType, wTaxValue, wGstEnabled, wGstType, 
    wGstRate, wIsInterstate, watch
  ]);

  const maxReminder = React.useMemo(() => planMaxReminderDays[(wPlan || '').toLowerCase()] ?? 360, [wPlan]);

  const showDueDate = (wPlan || '').toLowerCase() === 'one_time';
  const showRangeDates = ['weekly', 'bi_weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'].includes((wPlan || '').toLowerCase());
  const showCustomDates = (wPlan || '').toLowerCase() === 'custom';

  // Check if there are any locked installments
  const hasLockedInstallments = React.useMemo(() => 
    customInstallments.some(inst => inst.isLocked), 
    [customInstallments]
  );

  const calculateInstallmentAmount = (inst: CustomInstallment, totalAmount: number): number => {
    if (inst.amountType === 'percentage') {
      return (totalAmount * inst.amountValue) / 100;
    }
    return inst.amountValue;
  };

  const addCustomInstallment = () => {
    const newInstallment: CustomInstallment = {
      installmentNumber: customInstallments.length + 1,
      amountType: 'fixed',
      amountValue: 0,
      amount: 0,
      dueDate: '',
      reminderDaysBefore: 3,
      isLocked: false,
    };
    setCustomInstallments([...customInstallments, newInstallment]);
  };

  const removeCustomInstallment = (index: number) => {
    // Don't allow removing locked installments
    if (customInstallments[index].isLocked) {
      alert('Cannot remove a paid or partially paid installment');
      return;
    }
    
    const updated = customInstallments.filter((_, i) => i !== index);
    const renumbered = updated.map((inst, idx) => ({ ...inst, installmentNumber: idx + 1 }));
    setCustomInstallments(renumbered);
  };

  const updateCustomInstallment = (index: number, updates: Partial<CustomInstallment>) => {
    // Don't allow updating locked installments
    if (customInstallments[index].isLocked) {
      return;
    }
    
    const updated = [...customInstallments];
    updated[index] = { ...updated[index], ...updates };
    
    if (updates.amountType !== undefined || updates.amountValue !== undefined) {
      updated[index].amount = calculateInstallmentAmount(updated[index], calculations.total);
    }
    
    setCustomInstallments(updated);
  };

  const validateCustomInstallments = (): string | null => {
    if (customInstallments.length === 0) {
      return 'Please add at least one installment';
    }

    const totalInstallmentAmount = customInstallments.reduce((sum, inst) => {
      const amount = calculateInstallmentAmount(inst, calculations.total);
      return sum + amount;
    }, 0);

    if (Math.abs(totalInstallmentAmount - calculations.total) > 0.01) {
      return `Total installment amount (${formatCurrency(totalInstallmentAmount)}) must equal payment amount (${formatCurrency(calculations.total)})`;
    }

    for (let i = 0; i < customInstallments.length; i++) {
      const inst = customInstallments[i];
      if (!inst.dueDate) {
        return `Installment ${i + 1}: Due date is required`;
      }
      if (inst.amountValue <= 0) {
        return `Installment ${i + 1}: Amount must be greater than 0`;
      }
      
      // Validate that paid amount doesn't exceed new amount
      if (inst.isLocked && inst.paidAmount && inst.paidAmount > calculateInstallmentAmount(inst, calculations.total)) {
        return `Installment ${i + 1}: New amount cannot be less than paid amount (${formatCurrency(inst.paidAmount)})`;
      }
    }

    return null;
  };

  const handleSubmitAll = async (values: FormValues, generateInvoice: boolean) => {
    if (values.fromDate && values.toDate && new Date(values.toDate) < new Date(values.fromDate)) {
      alert('To Date must be after or equal to From Date');
      return;
    }
    const reminder = Number(values.reminderDaysBefore || 0);
    if (reminder > maxReminder) {
      alert(`Reminder Days Before cannot exceed ${maxReminder} for selected plan`);
      return;
    }

    const plan = (values.paymentPlan || '').toLowerCase();
    const paymentType: 'full' | 'recurring' | 'custom' = plan === 'one_time' ? 'full' : (plan === 'custom' ? 'custom' : 'recurring');
    const numberOfInstallments = paymentType === 'recurring' ? computeInstallments(plan, values.fromDate, values.toDate) : undefined;

    const status = values.status || values.paymentStatus || initialValues?.status || initialValues?.paymentStatus || 'pending';

    const startDate = values.fromDate || values.dueDate || initialValues?.fromDate  || new Date().toISOString().split('T')[0];

const payload: SavePayload = {
  ...values,
  paymentType,
  numberOfInstallments,
  paymentAmount: calculations.total,
  status,
  paymentStatus: status,
  fromDate: startDate, // Ensure fromDate is always present
  startDate: startDate, // Add startDate field explicitly
};

    if (paymentType === 'custom') {
      const validationError = validateCustomInstallments();
      if (validationError) {
        alert(validationError);
        return;
      }

      payload.customInstallments = customInstallments.map(inst => ({
        installmentNumber: inst.installmentNumber,
        amount: calculateInstallmentAmount(inst, calculations.total),
        dueDate: inst.dueDate,
        reminderDaysBefore: inst.reminderDaysBefore,
        id: inst.id, // Include ID for updates
      }));
    }

    await onSave(payload, generateInvoice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-auto">
      <div className="bg-white rounded-[10px] w-full max-w-4xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#656462' }}>
          <h3 className="text-white text-base font-medium">
            {isEditMode ? 'Edit Payment' : 'Add New Payment'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit((v) => handleSubmitAll(v, false))}>
          <div className="p-4 grid gap-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Edit Mode Warning */}
            {isEditMode && hasLockedInstallments && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Editing Payment with Paid Installments</p>
                    <p className="text-sm text-yellow-700">
                      Some installments have been paid and cannot be modified. Only unpaid installments can be edited.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Information */}
            <section className="border rounded p-4">
              <h4 className="font-semibold mb-3">Recipient Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Customer Name</label>
                  <input className="w-full border rounded px-3 py-2 bg-gray-100" value={recipient?.name || ''} readOnly />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email ID</label>
                  <input className="w-full border rounded px-3 py-2 bg-gray-100" value={recipient?.email || ''} readOnly />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Phone Number</label>
                  <input className="w-full border rounded px-3 py-2 bg-gray-100" value={recipient?.phone || ''} readOnly />
                </div>
                <div className="md:col-span-3">
                  <label className="text-sm text-gray-600">Deals</label>
                  <select className="w-full border rounded px-3 py-2" {...register('dealId')}>
                    <option value="">Select Deal</option>
                    {dealOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Service Details */}
            <section className="border rounded p-4">
              <h4 className="font-semibold mb-3">Service Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Service Details</label>
                  <input className="w-full border rounded px-3 py-2" placeholder="Service Name" {...register('serviceName')} />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Service Rate</label>
                  <input type="number" step="0.01" className="w-full border rounded px-3 py-2" placeholder="0" {...register('serviceRate', { valueAsNumber: true })} />
                </div>
              </div>
            </section>

            {/* Payment Details */}
            <section className="border rounded p-4">
              <h4 className="font-semibold mb-3">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-gray-600">Payment Plan</label>
                  <select 
                    className="w-full border rounded px-3 py-2" 
                    {...register('paymentPlan', { required: 'Payment Plan is required' })}
                    disabled={isEditMode && hasLockedInstallments}
                  >
                    <option value="">Select Payment Plan</option>
                    {planOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.paymentPlan && <p className="text-xs text-red-600 mt-1">{String(errors.paymentPlan.message)}</p>}
                  {isEditMode && hasLockedInstallments && (
                    <p className="text-xs text-yellow-600 mt-1">Payment plan cannot be changed when installments are paid</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Currency</label>
                  <input className="w-full border rounded px-3 py-2" placeholder="₹" {...register('currency')} />
                </div>
              </div>

              {/* Dates */}
              {showRangeDates && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-sm text-gray-600">From</label>
                    <DatePicker onChange={(d) => setValue('fromDate', d || '')} value={watch('fromDate')} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">To</label>
                    <DatePicker onChange={(d) => setValue('toDate', d || '')} value={watch('toDate')} />
                  </div>
                </div>
              )}

              {showDueDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-sm text-gray-600">Due Date</label>
                    <DatePicker onChange={(d) => setValue('dueDate', d || '')} value={watch('dueDate')} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Reminder Days Before (≤ {maxReminder})</label>
                    <input type="number" className="w-full border rounded px-3 py-2" {...register('reminderDaysBefore', { valueAsNumber: true })} />
                  </div>
                </div>
              )}

              <input type="hidden" {...register('status')} />
<input type="hidden" {...register('paymentStatus')} />

              {showCustomDates && (
                <>
                  <div className="mb-3 p-4 border rounded bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-sm">Custom Installments</h5>
                      <button
                        type="button"
                        onClick={addCustomInstallment}
                        className="px-3 py-1 text-sm rounded bg-[#c81c1f] text-white hover:opacity-90"
                      >
                        + Add Installment
                      </button>
                    </div>

                    {customInstallments.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No installments added. Click "Add Installment" to create a payment schedule.
                      </p>
                    )}

                    {customInstallments.map((inst, index) => {
                      const isPaid = inst.status === 'PAID';
                      const isPartiallyPaid = (inst.paidAmount || 0) > 0 && !isPaid;
                      const isLocked = inst.isLocked || false;

                      return (
                        <div key={index} className={`mb-3 p-3 border rounded ${isLocked ? 'bg-gray-50' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm flex items-center gap-2">
                              Installment #{inst.installmentNumber}
                              {isPaid && (
                                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  <CheckCircle size={12} /> Paid
                                </span>
                              )}
                              {isPartiallyPaid && (
                                <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                  <AlertTriangle size={12} /> Partially Paid
                                </span>
                              )}
                              {isLocked && (
                                <Lock size={12} className="text-gray-600" />
                              )}
                            </span>
                            {!isLocked && (
                              <button
                                type="button"
                                onClick={() => removeCustomInstallment(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {isPaid && inst.paidDate && (
                            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                              ✓ Paid {formatCurrency(inst.paidAmount)} on {new Date(inst.paidDate).toLocaleDateString()}
                              {inst.paymentMethod && ` via ${inst.paymentMethod}`}
                            </div>
                          )}

                          {isPartiallyPaid && (
                            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                              ⚠ Partially Paid: {formatCurrency(inst.paidAmount)} / {formatCurrency(inst.amount)}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-600">Type</label>
                              <select
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={inst.amountType}
                                onChange={(e) =>
                                  updateCustomInstallment(index, {
                                    amountType: e.target.value as 'percentage' | 'fixed',
                                  })
                                }
                                disabled={isLocked}
                              >
                                <option value="fixed">Fixed</option>
                                <option value="percentage">%</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs text-gray-600">
                                {inst.amountType === 'percentage' ? 'Percentage' : 'Amount'}
                              </label>
                              <input
                                type="number"
                                step={inst.amountType === 'percentage' ? 0.01 : 0.01}
                                min={isPartiallyPaid ? inst.paidAmount : 0.01}
                                max={inst.amountType === 'percentage' ? 100 : calculations.total}
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={inst.amountValue || ''}
                                onChange={(e) =>
                                  updateCustomInstallment(index, {
                                    amountValue: parseFloat(e.target.value) || 0,
                                  })
                                }
                                disabled={isLocked}
                              />
                              {isPartiallyPaid && (
                                <p className="text-xs text-yellow-600 mt-1">
                                  Min: {formatCurrency(inst.paidAmount)} (already paid)
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="text-xs text-gray-600">Due Date</label>
                              <DatePicker
                                value={inst.dueDate}
                                onChange={(d) =>
                                  updateCustomInstallment(index, { dueDate: d || '' })
                                }
                                disabled={isLocked}
                              />
                            </div>
                          </div>

                          <div className="mt-2">
                            <label className="text-xs text-gray-600">Reminder Days Before</label>
                            <input
                              type="number"
                              min="0"
                              max="360"
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={inst.reminderDaysBefore ?? 3}
                              onChange={(e) =>
                                updateCustomInstallment(index, {
                                  reminderDaysBefore: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              disabled={isLocked}
                            />
                          </div>

                          <div className="mt-2 text-sm text-gray-700">
                            Calculated Amount:{' '}
                            <span className="font-semibold">
                              {formatCurrency(calculateInstallmentAmount(inst, calculations.total))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Subtotal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-gray-600">Subtotal *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999999999"
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                    {...register('subtotal', {
                      valueAsNumber: true,
                      required: 'Subtotal is required',
                      min: { value: 0.01, message: 'Must be > 0' },
                      max: { value: 999999999, message: 'Too large' },
                    })}
                    disabled={isEditMode && hasLockedInstallments}
                  />
                  {errors.subtotal && (
                    <p className="text-xs text-red-600 mt-1">{String(errors.subtotal.message)}</p>
                  )}
                  {isEditMode && hasLockedInstallments && (
                    <p className="text-xs text-yellow-600 mt-1">Subtotal cannot be changed when installments are paid</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Invoice Number *</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    maxLength={50}
                    {...register('invoiceNumber', {
                      required: 'Invoice number is required',
                      maxLength: { value: 50, message: 'Max 50 chars' },
                    })}
                  />
                  {errors.invoiceNumber && (
                    <p className="text-xs text-red-600 mt-1">{String(errors.invoiceNumber.message)}</p>
                  )}
                </div>
              </div>

              {/* Discount */}
              <div className="mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...register('discountEnabled')}
                    disabled={isEditMode && hasLockedInstallments}
                  />
                  Apply Discount
                  {isEditMode && hasLockedInstallments && (
                    <span className="text-xs text-yellow-600">(locked)</span>
                  )}
                </label>
                {wDiscountEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <select
                      className="border rounded px-3 py-2"
                      {...register('discountType')}
                      disabled={isEditMode && hasLockedInstallments}
                    >
                      <option value="none">No discount</option>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                    {wDiscountType !== 'none' && (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={wDiscountType === 'percentage' ? 100 : wSubtotal}
                          className="border rounded px-3 py-2"
                          placeholder={wDiscountType === 'percentage' ? '%' : 'Amount'}
                          {...register('discountValue', { valueAsNumber: true })}
                          disabled={isEditMode && hasLockedInstallments}
                        />
                        <div className="flex items-center text-sm text-gray-600">
                          Discount: {formatCurrency(calculations.discountAmount)}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Tax */}
              <div className="mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...register('taxEnabled')}
                    disabled={isEditMode && hasLockedInstallments}
                  />
                  Apply Tax
                  {isEditMode && hasLockedInstallments && (
                    <span className="text-xs text-yellow-600">(locked)</span>
                  )}
                </label>
                {wTaxEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <select
                      className="border rounded px-3 py-2"
                      {...register('taxType')}
                      disabled={isEditMode && hasLockedInstallments}
                    >
                      <option value="none">No tax</option>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                    {wTaxType !== 'none' && (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={wTaxType === 'percentage' ? 100 : undefined}
                          className="border rounded px-3 py-2"
                          placeholder={wTaxType === 'percentage' ? '%' : 'Amount'}
                          {...register('taxValue', { valueAsNumber: true })}
                          disabled={isEditMode && hasLockedInstallments}
                        />
                        <div className="flex items-center text-sm text-gray-600">
                          Tax: {formatCurrency(calculations.taxAmount)}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* GST */}
              <div className="mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...register('gstEnabled')}
                    disabled={isEditMode && hasLockedInstallments}
                  />
                  Apply GST
                  {isEditMode && hasLockedInstallments && (
                    <span className="text-xs text-yellow-600">(locked)</span>
                  )}
                </label>
                {wGstEnabled && (
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        className="border rounded px-3 py-2"
                        {...register('gstType')}
                        disabled={isEditMode && hasLockedInstallments}
                      >
                        <option value="none">No GST</option>
                        <option value="inclusive">Inclusive</option>
                        <option value="exclusive">Exclusive</option>
                      </select>
                      {(wGstType === 'inclusive' || wGstType === 'exclusive') && (
                        <>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            className="border rounded px-3 py-2"
                            placeholder="Rate %"
                            {...register('gstRate', { valueAsNumber: true })}
                            disabled={isEditMode && hasLockedInstallments}
                          />
                          <div className="flex items-center text-sm text-gray-600">
                            GST: {formatCurrency(calculations.gstAmount)}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {(wGstType === 'inclusive' || wGstType === 'exclusive') && (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register('isInterstate')}
                            disabled={isEditMode && hasLockedInstallments}
                          />
                          <label className="text-sm text-gray-600">Interstate Transaction (IGST)</label>
                        </div>
                        
                        {/* GST Breakdown */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <h5 className="text-sm font-semibold text-blue-900 mb-2">GST Breakdown</h5>
                          <div className="space-y-1 text-sm">
                            {wIsInterstate ? (
                              <div className="flex justify-between">
                                <span className="text-gray-700">IGST ({wGstRate}%):</span>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(calculations.igstAmount)}
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-700">CGST ({(wGstRate || 0) / 2}%):</span>
                                  <span className="font-semibold text-gray-900">
                                    {formatCurrency(calculations.cgstAmount)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-700">SGST ({(wGstRate || 0) / 2}%):</span>
                                  <span className="font-semibold text-gray-900">
                                    {formatCurrency(calculations.sgstAmount)}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between pt-2 border-t border-blue-300">
                              <span className="text-gray-700 font-medium">Total GST:</span>
                              <span className="font-bold text-blue-900">
                                {formatCurrency(calculations.gstAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Name / Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-gray-600">Payment Name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    maxLength={100}
                    {...register('paymentName')}
                  />
                  {errors.paymentName && (
                    <p className="text-xs text-red-600 mt-1">{String(errors.paymentName.message)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Description</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                    maxLength={1000}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600 mt-1">{String(errors.description.message)}</p>
                  )}
                </div>
              </div>

              {/* Final Amount Preview */}
              <div className="p-4 bg-gray-50 border border-gray-300 rounded">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Payment Summary</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(wSubtotal)}</span>
                  </div>
                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span className="font-medium">-{formatCurrency(calculations.discountAmount)}</span>
                    </div>
                  )}
                  {calculations.taxAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Tax:</span>
                      <span className="font-medium">+{formatCurrency(calculations.taxAmount)}</span>
                    </div>
                  )}
                  {calculations.gstAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>GST ({wIsInterstate ? 'IGST' : 'CGST+SGST'}):</span>
                      <span className="font-medium">
                        {wGstType === 'inclusive' ? '(Included)' : `+${formatCurrency(calculations.gstAmount)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-900 font-semibold text-base">Total Amount:</span>
                    <span className="font-bold text-lg text-[#c81c1f]">
                      {formatCurrency(calculations.total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#c81c1f] text-white hover:opacity-90"
            >
              {isEditMode ? 'Update Payment' : 'Save Payment'}
            </button>
            {!isEditMode && (
              <button
                type="button"
                onClick={handleSubmit((v) => handleSubmitAll(v, true))}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Save & Generate Invoice
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal; 