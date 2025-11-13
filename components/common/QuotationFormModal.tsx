"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { customToast } from "@/utils/toast";
import {
  useCreateQuotationMutation,
  useReviseQuotationMutation,
} from "@/store/api_query/BizAcceleratorQuotations.api";

export type QuotationLineItem = {
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountType: "PERCENTAGE" | "FIXED";
  discount: number;
  taxType: "PERCENTAGE" | "FIXED";
  tax: number;
  sku?: string;
  unit?: string;
  notes?: string;
};

export type QuotationFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "revise";
  dealId: string;
  opportunityId?: string | null;
  latestQuotation?: any | null; // for revise prefill
  onSaved?: (createdOrRevised: any) => void;
  onGenerated?: (data: {
    quotationNumber?: string;
    quotationName?: string;
    dealName?: string;
    opportunityName?: string;
    quotationDate?: string;
    createdAt?: string;
    version?: number;
    lineItems: Array<QuotationLineItem & { subtotal: number; discountAmount: number; taxAmount: number; totalAmount: number }>;
  }) => void;
  dealName?: string;
  opportunityName?: string;
};

const currency = (n?: number) =>
  typeof n === "number" && isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0";

const computeLineItemAmounts = (li: QuotationLineItem) => {
  const qty = Number(li.quantity) || 0;
  const unit = Number(li.unitPrice) || 0;
  const subtotal = qty * unit;
  let discountAmount = 0;
  if (li.discountType === "PERCENTAGE") {
    discountAmount = (subtotal * (Number(li.discount) || 0)) / 100;
  } else {
    discountAmount = Number(li.discount) || 0;
  }
  const afterDiscount = subtotal - discountAmount;
  let taxAmount = 0;
  if (li.taxType === "PERCENTAGE") {
    taxAmount = (afterDiscount * (Number(li.tax) || 0)) / 100;
  } else {
    taxAmount = Number(li.tax) || 0;
  }
  const totalAmount = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxAmount, totalAmount };
};

const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  dealId,
  opportunityId,
  latestQuotation,
  onSaved,
  onGenerated,
  dealName,
  opportunityName,
}) => {
  const [name, setName] = useState("");
  const [quotationDate, setQuotationDate] = useState<string>("");
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    {
      itemName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountType: "PERCENTAGE",
      discount: 0,
      taxType: "PERCENTAGE",
      tax: 0,
      unit: "unit",
    },
  ]);

  const [createQuotation, { isLoading: creating }] = useCreateQuotationMutation();
  const [reviseQuotation, { isLoading: revising }] = useReviseQuotationMutation();

  useEffect(() => {
    if (mode === "revise" && latestQuotation) {
      const q = latestQuotation as any;
      const n = (q.quotationName || q.name || "").toString();
      setName(n);
      const qd = (q.quotationDate || q.createdAt || "").toString();
      setQuotationDate(qd ? qd.slice(0, 10) : "");
      const items = Array.isArray(q.lineItems) ? q.lineItems : [];
      if (items.length > 0) {
        setLineItems(
          items.map((it: any) => ({
            itemName: it.itemName || "",
            description: it.description || "",
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            discountType: (it.discountType || "PERCENTAGE") as any,
            discount: Number(it.discount) || 0,
            taxType: (it.taxType || "PERCENTAGE") as any,
            tax: Number(it.tax) || 0,
            sku: it.sku || "",
            unit: it.unit || "unit",
            notes: it.notes || "",
          }))
        );
      }
    }
  }, [mode, latestQuotation]);

  const totals = useMemo(() => {
    return lineItems.reduce(
      (acc, li) => {
        const a = computeLineItemAmounts(li);
        acc.subtotal += a.subtotal;
        acc.discountAmount += a.discountAmount;
        acc.taxAmount += a.taxAmount;
        acc.total += a.totalAmount;
        return acc;
      },
      { subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 }
    );
  }, [lineItems]);

  const addItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        itemName: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountType: "PERCENTAGE",
        discount: 0,
        taxType: "PERCENTAGE",
        tax: 0,
        unit: "unit",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, updates: Partial<QuotationLineItem>) => {
    setLineItems((prev) => prev.map((li, i) => (i === idx ? { ...li, ...updates } : li)));
  };

  const buildPayload = () => {
    const payload: Record<string, any> = {
      dealId,
      opportunityId: opportunityId || undefined,
      quotationName: name || undefined,
      quotationDate: quotationDate ? new Date(quotationDate).toISOString() : undefined,
      validUntil: (() => {
        const base = quotationDate ? new Date(quotationDate) : new Date();
        base.setDate(base.getDate() + 30);
        return base.toISOString();
      })(),
      lineItems: lineItems.map((li) => ({
        ...li,
        ...computeLineItemAmounts(li),
      })),
    };
    return payload;
  };

  const handleSave = async (generate: boolean) => {
    try {
      if (!dealId) {
        customToast.error("Deal is required");
        return;
      }
      if (!opportunityId) {
        // If multiple opportunities exist, the parent already enforces selection; still warn if missing
        customToast.info("Select an opportunity for this quotation (if applicable)");
      }
      if (lineItems.length === 0) {
        customToast.error("Add at least one line item");
        return;
      }

      const payload = { ...buildPayload(), ...(mode === "create" ? { status: "DRAFT" } : {}) };

      let res: any;
      if (mode === "create") {
        res = await createQuotation({ data: payload }).unwrap();
        customToast.success(generate ? "Quotation saved and generated" : "Quotation created");
      } else {
        const baseId = (latestQuotation as any)?.id as string;
        if (!baseId) {
          customToast.error("Latest quotation not found");
          return;
        }
        res = await reviseQuotation({ quotationId: baseId, data: payload }).unwrap();
        customToast.success(generate ? "Revised quotation saved and generated" : "Quotation revised");
      }

      onSaved?.(res);
      if (generate) {
        const qi = lineItems.map((li) => ({
          ...li,
          ...computeLineItemAmounts(li),
        })) as Array<QuotationLineItem & { subtotal: number; discountAmount: number; taxAmount: number; totalAmount: number }>;
        onGenerated?.({
          quotationNumber: res?.quotationNumber || res?.data?.quotationNumber,
          quotationName: name,
          dealName,
          opportunityName,
          quotationDate,
          createdAt: res?.createdAt || res?.data?.createdAt || new Date().toISOString(),
          version: (typeof res?.version === "number" ? res?.version : (typeof res?.data?.version === "number" ? (res as any).data.version : undefined)) as number | undefined,
          lineItems: qi,
        });
      }
      onClose();
    } catch (e: any) {
      console.error("Failed to save quotation", e);
      const msg = e?.data?.message || e?.message || "Failed to save quotation";
      customToast.error(msg);
    }
  };

  if (!isOpen) return null;

  const saving = creating || revising;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-auto">
      <div className="bg-white rounded-[10px] w-full max-w-5xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: "#656462" }}>
          <h3 className="text-white text-base font-medium">
            {mode === "create" ? "Create Quotation" : "Revise Latest Quotation"}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white"><X size={18} /></button>
        </div>

        <div className="p-4 grid gap-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          <section className="border rounded p-4">
            <h4 className="font-semibold mb-3">Quotation Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-600">Quotation Name</label>
                <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Quotation Date</label>
                <input type="date" className="w-full border rounded px-3 py-2" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Opportunity</label>
                <input className="w-full border rounded px-3 py-2 bg-gray-100" value={opportunityName || "-"} readOnly />
              </div>
            </div>
          </section>

          <section className="border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Line Items</h4>
              <button type="button" onClick={addItem} className="px-3 py-1 text-sm rounded bg-[#c81c1f] text-white hover:opacity-90">+ Item</button>
            </div>

            {lineItems.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No items. Click "+ Item" to add.</p>
            )}

            {lineItems.map((li, idx) => {
              const a = computeLineItemAmounts(li);
              return (
                <div key={idx} className="mb-3 p-3 border rounded bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-600">Item Name</label>
                      <input className="w-full border rounded px-2 py-1 text-sm" value={li.itemName} onChange={(e) => updateItem(idx, { itemName: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Qty</label>
                      <input type="number" min={0} step={1} className="w-full border rounded px-2 py-1 text-sm" value={li.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Unit Price</label>
                      <input type="number" min={0} step={0.01} className="w-full border rounded px-2 py-1 text-sm" value={li.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Discount</label>
                      <div className="flex gap-2">
                        <select className="w-24 border rounded px-2 py-1 text-sm" value={li.discountType} onChange={(e) => updateItem(idx, { discountType: e.target.value as any })}>
                          <option value="PERCENTAGE">%</option>
                          <option value="FIXED">Fixed</option>
                        </select>
                        <input type="number" min={0} step={0.01} className="flex-1 border rounded px-2 py-1 text-sm" value={li.discount} onChange={(e) => updateItem(idx, { discount: Number(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Tax</label>
                      <div className="flex gap-2">
                        <select className="w-24 border rounded px-2 py-1 text-sm" value={li.taxType} onChange={(e) => updateItem(idx, { taxType: e.target.value as any })}>
                          <option value="PERCENTAGE">%</option>
                          <option value="FIXED">Fixed</option>
                        </select>
                        <input type="number" min={0} step={0.01} className="flex-1 border rounded px-2 py-1 text-sm" value={li.tax} onChange={(e) => updateItem(idx, { tax: Number(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-2">
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-600">Description</label>
                      <textarea rows={2} className="w-full border rounded px-2 py-1 text-sm" value={li.description || ""} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <div className="w-full p-2 bg-gray-50 border rounded text-xs">
                        <div className="flex justify-between"><span>Subtotal</span><span>{currency(a.subtotal)}</span></div>
                        <div className="flex justify-between"><span>Discount</span><span>-{currency(a.discountAmount)}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>+{currency(a.taxAmount)}</span></div>
                        <div className="flex justify-between font-semibold border-t mt-1 pt-1"><span>Total</span><span>{currency(a.totalAmount)}</span></div>
                      </div>
                    </div>
                    <div className="flex items-end justify-end">
                      <button type="button" onClick={() => removeItem(idx)} className="px-3 py-1 text-sm rounded border hover:bg-gray-100">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {lineItems.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 border rounded">
                <div className="flex justify-end gap-6 text-sm">
                  <div><span className="text-gray-600">Subtotal:</span> <span className="font-medium">{currency(totals.subtotal)}</span></div>
                  <div><span className="text-gray-600">Discount:</span> <span className="font-medium">-{currency(totals.discountAmount)}</span></div>
                  <div><span className="text-gray-600">Tax:</span> <span className="font-medium">+{currency(totals.taxAmount)}</span></div>
                  <div className="font-semibold"><span className="text-gray-900">Total:</span> <span className="text-[#c81c1f]">{currency(totals.total)}</span></div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="button" disabled={saving} onClick={() => handleSave(false)} className="px-4 py-2 rounded bg-[#c81c1f] text-white hover:opacity-90 disabled:opacity-60">{saving ? "Saving..." : "Save Quotation"}</button>
          <button type="button" disabled={saving} onClick={() => handleSave(true)} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">{saving ? "Saving..." : "Save & Generate"}</button>
        </div>
      </div>
    </div>
  );
};

export default QuotationFormModal;
