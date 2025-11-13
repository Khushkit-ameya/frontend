"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { customToast } from "@/utils/toast";
import {
  useGetDealOpportunitiesQuery,
  useGetDealQuery,
} from "@/store/api_query/deals.api";
import {
  useGetOpportunityQuotationsQuery,
  useUpdateQuotationMutation,
} from "@/store/api_query/BizAcceleratorQuotations.api";
import { useCreateFromQuotationMutation } from "@/store/api_query/BizAcceleratorSalesOrders.api";
import QuotationsApi from "@/store/api_query/BizAcceleratorQuotations.api";
const QuotationFormModal = dynamic(() => import("../common/QuotationFormModal"), { ssr: false });
const QuotationPrint = dynamic(() => import("@/components/BizAccelerator/QuotationPrint/QuotationPrint"), { ssr: false });
import { useGetFieldDefinitionsByEntityQuery } from "@/store/api_query/field_definitions.api";
import { useDispatch_ } from "@/store";
const ConvertToSOWithPlanModal = dynamic(() => import("./ConvertToSOWithPlanModal"), { ssr: false });

export type ManageQuotationsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  dealName: string;
};

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "-");
const money = (n?: number) =>
  typeof n === "number" && isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0";

const computeTotalFromLineItems = (items: any[]): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
};

const ManageQuotationsModal: React.FC<ManageQuotationsModalProps> = ({ isOpen, onClose, dealId, dealName }) => {
  const { data: linkedOppsData } = useGetDealOpportunitiesQuery(dealId, { skip: !isOpen || !dealId });
  const linkedOpps: Array<{ id: string; name?: string; title?: string; recordId?: string }>
    = (linkedOppsData as any[]) || [];

  const [selectedOppId, setSelectedOppId] = useState<string>("");

  useEffect(() => {
    if (!selectedOppId && linkedOpps.length > 0) {
      setSelectedOppId(linkedOpps.find((o: any) => o.isPrimary)?.id || linkedOpps[0].id);
    }
  }, [linkedOpps, selectedOppId]);

  const { data: quotData, refetch } = useGetOpportunityQuotationsQuery(selectedOppId || "", { skip: !selectedOppId });
  const { data: dealDetails } = useGetDealQuery(dealId, { skip: !isOpen || !dealId });
  const { data: dealFields } = useGetFieldDefinitionsByEntityQuery('deal');
  const quotations: any[] = useMemo(() => {
    if (!quotData) return [];
    const items = (quotData as { items?: any[] } | undefined)?.items || (Array.isArray(quotData) ? (quotData as any[]) : []);
    const filtered = items.filter((q: any) => {
      const qDealId = String(q?.dealId || q?.deal?.id || q?.deal?.dealId || "");
      const qOppId = String(q?.opportunityId || q?.opportunity?.id || "");
      const matchDeal = !dealId || qDealId === String(dealId);
      const matchOpp = !selectedOppId || qOppId === String(selectedOppId);
      return matchDeal && matchOpp;
    });
    // Latest first by createdAt then version
    return [...filtered].sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      if (bd !== ad) return bd - ad;
      return (b.version || 0) - (a.version || 0);
    });
  }, [quotData, dealId, selectedOppId]);

  const latest = quotations[0];

  const [updateQuotation, { isLoading: updating }] = useUpdateQuotationMutation();
  const [convertMutation, { isLoading: converting }] = useCreateFromQuotationMutation();
  const dispatch = useDispatch_();

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "revise">("create");
  const [quotationPrintData, setQuotationPrintData] = useState<null | {
    quotationNumber?: string;
    quotationName?: string;
    dealName?: string;
    opportunityName?: string;
    quotationDate?: string;
    createdAt?: string;
    version?: number;
    lineItems: Array<{ itemName: string; description?: string; quantity: number; unitPrice: number; discountAmount?: number; taxAmount?: number; totalAmount?: number; subtotal?: number }>;
  }>(null);

  const stageField = useMemo(() => {
    const arr = (dealFields as any[]) || [];
    return arr.find((f: any) => String(f?.fieldKey).toLowerCase() === 'dealstage');
  }, [dealFields]);
  const stageChoices: Array<any> = useMemo(() => {
    const opts = (stageField?.options as any) || {};
    return Array.isArray(opts.choices) ? opts.choices : [];
  }, [stageField]);
  const getStageLabel = (val: string) => {
    const m = stageChoices.find((c: any) => String(c?.value).toLowerCase() === String(val).toLowerCase());
    return String(m?.label || val);
  };
  const dealStageRaw: any = (dealDetails as any)?.dealStage;
  const dealStageValue = useMemo(() => {
    if (!dealStageRaw) return '';
    if (typeof dealStageRaw === 'string') return dealStageRaw;
    if (typeof dealStageRaw === 'object' && dealStageRaw) return (dealStageRaw.value || dealStageRaw.label || '').toString();
    return '';
  }, [dealStageRaw]);
  const isProposalStage = String(dealStageValue || '').toLowerCase() === 'proposal';
  const isWonStage = String(dealStageValue || '').toLowerCase() === 'won';

  const anyConverted = quotations.some((q) => q.status === "CONVERTED_TO_SO" || q.salesOrder);
  const acceptedQuotation = quotations.find((q) => q.status === "ACCEPTED");
  const disableActions = anyConverted || false;
  const disableOthersDueToAcceptance = !!acceptedQuotation && !anyConverted;

  const topButtonLabel = quotations.length === 0 ? "Create Quotation" : "Revise Latest Quotation";
  const topButtonDisabled = disableActions || disableOthersDueToAcceptance || (linkedOpps.length > 0 && !selectedOppId);

  const openCreateOrRevise = () => {
    if (!isProposalStage) {
      const label = getStageLabel('proposal');
      customToast.info(`Change Deal Stage to "${label}" to create or revise quotations`);
      return;
    }
    setFormMode(quotations.length === 0 ? "create" : "revise");
    setShowForm(true);
  };

  const selectedOpp = useMemo(() => (linkedOpps || []).find((o: any) => o.id === selectedOppId), [linkedOpps, selectedOppId]);
  const selectedOppName = (selectedOpp?.name || selectedOpp?.title || selectedOpp?.recordId) as string | undefined;

  const handleAccept = async (q: any) => {
    try {
      await updateQuotation({ quotationId: q.id, data: { status: "ACCEPTED" } }).unwrap();
      customToast.success("Quotation accepted");
      await refetch();
    } catch (e: any) {
      customToast.error(e?.data?.message || "Failed to accept quotation");
    }
  };

  const handleReject = async (q: any) => {
    try {
      await updateQuotation({ quotationId: q.id, data: { status: "REJECTED" } }).unwrap();
      customToast.success("Quotation rejected");
      await refetch();
    } catch (e: any) {
      customToast.error(e?.data?.message || "Failed to reject quotation");
    }
  };

  const handleCancelAcceptance = async (q: any) => {
    try {
      if (q.salesOrder) {
        customToast.info("Quotation already converted to SO");
        return;
      }
      await updateQuotation({ quotationId: q.id, data: { status: "DRAFT" } }).unwrap();
      customToast.success("Acceptance cancelled");
      await refetch();
    } catch (e: any) {
      customToast.error(e?.data?.message || "Failed to cancel acceptance");
    }
  };

  const [showConvertChoice, setShowConvertChoice] = useState(false);
  const [convertTarget, setConvertTarget] = useState<any | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const onConvertClick = (q: any) => {
    if (!isWonStage) {
      const label = getStageLabel('won');
      customToast.info(`Change Deal Stage to "${label}" to convert to Sales Order`);
      return;
    }
    setConvertTarget(q);
    setShowConvertChoice(true);
  };

  const chooseDirectConversion = async () => {
    if (!convertTarget) return;
    try {
      await convertMutation({ quotationId: convertTarget.id }).unwrap();
      customToast.success("Converted to Sales Order");
      setShowConvertChoice(false);
      setConvertTarget(null);
      await refetch();
    } catch (e: any) {
      customToast.error(e?.data?.message || "Failed to convert to SO");
    }
  };

  const chooseWithPlan = () => {
    setShowConvertChoice(false);
    setShowPlanModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white rounded-[10px] w-full max-w-5xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: "#f7f7f7" }}>
          <div>
            <div className="text-base font-semibold">Manage Quotations</div>
            <div className="text-sm text-gray-600">Deal: {dealName}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`px-3 py-1.5 rounded text-white ${topButtonDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-[#c81c1f] hover:opacity-90"}`}
              disabled={topButtonDisabled}
              onClick={openCreateOrRevise}
              onMouseEnter={(e) => {
                const el = e.currentTarget as unknown as { __pf?: number };
                el.__pf = window.setTimeout(() => { import("../common/QuotationFormModal"); }, 1000);
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as unknown as { __pf?: number };
                if (el.__pf) { window.clearTimeout(el.__pf); el.__pf = undefined; }
              }}
            >
              {topButtonLabel}
            </button>
            <button type="button" onClick={onClose} className="p-1 rounded border hover:bg-gray-100"><X size={18} /></button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm text-gray-600">Deal Name</label>
              <input className="w-full border rounded px-3 py-2 bg-gray-100" value={dealName} readOnly />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Opportunity</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
              >
                {linkedOpps.length === 0 && <option value="">No linked opportunities</option>}
                {linkedOpps.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {(o.name || o.title || o.recordId || "Opportunity")}
                  </option>
                ))}
              </select>
              {/* <p className="text-xs text-gray-500 mt-1">Quotations are per opportunity.</p> */}
            </div>
          </div>
        </div>

        {/* Quotations List */}
        <div className="p-4">
          {selectedOppId ? (
            quotations.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No quotations yet. Click "Create Quotation" to add one.</div>
            ) : (
              <div className="space-y-3">
                {quotations.map((q) => {
                  const total = typeof q.totalAmount === "number" ? q.totalAmount : computeTotalFromLineItems(q.lineItems || []);
                  const isAccepted = q.status === "ACCEPTED";
                  const isRejected = q.status === "REJECTED";
                  const isConverted = q.status === "CONVERTED_TO_SO" || !!q.salesOrder;
                  const cardDisabled = disableActions || (disableOthersDueToAcceptance && !isAccepted);

                  const statusLabel = ((q.status || "").toString().replace(/_/g, ' ').toLowerCase());
                  const statusColor = (q.statusColor || (q.status && (q.status as any).color) || (q as any).statusHex || (q as any).color || "#6b7280");

                  return (
                    <div key={q.id} className={"border rounded p-4"}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold">{q.quotationName || q.name || q.recordId || q.quotationNumber || "Quotation"}</div>
                            <span
                              className="text-xs px-2 py-0.5 rounded border capitalize"
                              style={{ color: statusColor as string, borderColor: statusColor as string }}
                            >
                              {statusLabel}
                            </span>
                            {typeof q.version === "number" && (
                              <span className="text-xs px-2 py-0.5 rounded border text-gray-700">v{q.version}</span>
                            )}
                          </div>
                          <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                            <div><span className="text-gray-500">Quotation #:</span> <span>{q.quotationNumber || '-'}</span></div>
                            <div><span className="text-gray-500">Date:</span> <span>{fmtDate(q.quotationDate || q.createdAt)}</span></div>
                            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{money(total)}</span></div>
                            <div><span className="text-gray-500">Version:</span> <span>{typeof q.version === "number" ? `v${q.version}` : '-'}</span></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            type="button"
                            onClick={() => {
                              const items = (q.lineItems || []).map((it: any) => ({
                                itemName: it.itemName,
                                description: it.description,
                                quantity: Number(it.quantity) || 0,
                                unitPrice: Number(it.unitPrice) || 0,
                                discountAmount: Number(it.discountAmount) || 0,
                                taxAmount: Number(it.taxAmount) || 0,
                                subtotal: Number(it.subtotal) || (Number(it.quantity||0)*Number(it.unitPrice||0)) || 0,
                                totalAmount: Number(it.totalAmount) || 0,
                              }));
                              setQuotationPrintData({
                                quotationNumber: q.quotationNumber,
                                quotationName: q.quotationName || q.name,
                                dealName,
                                opportunityName: selectedOppName,
                                quotationDate: q.quotationDate || q.createdAt,
                                createdAt: q.createdAt,
                                version: q.version,
                                lineItems: items,
                              });
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as unknown as { __pf?: number };
                              el.__pf = window.setTimeout(() => { import("@/components/BizAccelerator/QuotationPrint/QuotationPrint"); }, 1000);
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as unknown as { __pf?: number };
                              if (el.__pf) { window.clearTimeout(el.__pf); el.__pf = undefined; }
                            }}
                            className="px-3 py-1.5 rounded border text-gray-700 hover:bg-gray-50"
                          >
                            Print
                          </button>
                          {!isConverted && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={cardDisabled || isAccepted || updating}
                                onClick={() => handleAccept(q)}
                                className={`px-3 py-1.5 rounded border ${cardDisabled || isAccepted ? "text-gray-400 border-gray-300" : "text-green-700 border-green-700 hover:bg-green-50"}`}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={cardDisabled || isRejected || updating}
                                onClick={() => handleReject(q)}
                                className={`px-3 py-1.5 rounded border ${cardDisabled || isRejected ? "text-gray-400 border-gray-300" : "text-red-700 border-red-700 hover:bg-red-50"}`}
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {isAccepted && !isConverted && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={converting}
                                onClick={() => onConvertClick(q)}
                                onMouseEnter={(e) => {
                                  const el = e.currentTarget as unknown as { __pf?: number };
                                  el.__pf = window.setTimeout(() => {
                                    dispatch(QuotationsApi.util.prefetch('getQuotation', q.id, { ifOlderThan: 300 }));
                                    import("./ConvertToSOWithPlanModal");
                                  }, 1000);
                                }}
                                onMouseLeave={(e) => {
                                  const el = e.currentTarget as unknown as { __pf?: number };
                                  if (el.__pf) { window.clearTimeout(el.__pf); el.__pf = undefined; }
                                }}
                                className="px-3 py-1.5 rounded bg-[#c81c1f] text-white hover:opacity-90 disabled:opacity-60"
                              >
                                {converting ? "Converting..." : "Convert to SO"}
                              </button>
                              <button
                                type="button"
                                disabled={updating}
                                onClick={() => handleCancelAcceptance(q)}
                                className="px-3 py-1.5 rounded border text-gray-700 hover:bg-gray-50"
                              >
                                Cancel Acceptance
                              </button>
                            </div>
                          )}

                          {isConverted && q.salesOrder && (
                            <div className="text-xs text-gray-600">SO Created</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center text-gray-500 py-10">Select an opportunity to view quotations.</div>
          )}
        </div>

        {showForm && (
          <QuotationFormModal
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            mode={formMode}
            dealId={dealId}
            opportunityId={selectedOppId}
            latestQuotation={formMode === "revise" ? latest : null}
            dealName={dealName}
            opportunityName={selectedOppName}
            onSaved={async () => { await refetch(); }}
            onGenerated={(data) => {
              setQuotationPrintData({
                quotationNumber: data.quotationNumber,
                quotationName: data.quotationName,
                dealName,
                opportunityName: selectedOppName,
                quotationDate: data.quotationDate,
                createdAt: data.createdAt,
                version: data.version,
                lineItems: (data.lineItems || []).map((it) => ({
                  itemName: it.itemName,
                  description: it.description,
                  quantity: it.quantity,
                  unitPrice: it.unitPrice,
                  discountAmount: it.discountAmount,
                  taxAmount: it.taxAmount,
                  subtotal: it.subtotal,
                  totalAmount: it.totalAmount,
                })),
              });
            }}
          />
        )}

        {quotationPrintData && (
          <QuotationPrint
            data={quotationPrintData}
            onClose={() => setQuotationPrintData(null)}
          />
        )}

        {showConvertChoice && convertTarget && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[10px] w-full max-w-md overflow-hidden">
              <div className="px-4 py-3 border-b text-base font-semibold">Convert to Sales Order</div>
              <div className="p-4 space-y-3">
                <button type="button" onClick={chooseDirectConversion} className="w-full px-3 py-2 rounded bg-[#c81c1f] text-white hover:opacity-90">Direct Conversion</button>
                <button type="button" onClick={chooseWithPlan} className="w-full px-3 py-2 rounded border hover:bg-gray-50">With Payment Plan</button>
                <button type="button" onClick={() => { setShowConvertChoice(false); setConvertTarget(null); }} className="w-full px-3 py-2 rounded border hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showPlanModal && convertTarget && (
          <ConvertToSOWithPlanModal
            isOpen={showPlanModal}
            quotation={convertTarget}
            onClose={() => { setShowPlanModal(false); setConvertTarget(null); }}
            onSubmit={async (plan) => {
              try {
                await convertMutation({ quotationId: convertTarget.id, paymentPlan: plan }).unwrap();
                customToast.success("Converted to Sales Order");
                setShowPlanModal(false);
                setConvertTarget(null);
                await refetch();
              } catch (e: any) {
                customToast.error(e?.data?.message || "Failed to convert to SO");
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ManageQuotationsModal;
