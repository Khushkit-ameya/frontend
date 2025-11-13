"use client";

import React, { useEffect, useRef, useState } from "react";
import ColumnSelect from "./CustomColumnSelect";
interface ProjectFilterProps {
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}

export default function ProjectFilter({ anchorRef, onClose }: ProjectFilterProps) {
  const popupRef = useRef(null);

  const COLUMNS = [
    { key: "name", label: "Name", icon: "/assests/name.svg", color: "text-purple-600" },
    { key: "group", label: "Group", icon: "/assests/Group.svg", color: "text-indigo-600" },
    { key: "status", label: "Status", icon: "/assests/status.svg", color: "text-green-600" },
    { key: "company", label: "Company", icon: "/assests/Company.svg", color: "text-emerald-600" },
    { key: "title", label: "Title", icon: "/assests/title.svg", color: "text-yellow-500" },
    { key: "email", label: "Email", icon: "/assests/email (1).svg", color: "text-orange-400" },
    { key: "phone", label: "Phone", icon: "/assests/phone-n.svg", color: "text-yellow-600" },
    { key: "last_interaction", label: "Last interaction", icon: "/assests/last-interaction.svg", color: "text-sky-600" },
  ];

  const CONDITIONS = [
    { key: "Is", label: "Is" },
    { key: "Not", label: "Is not" },
    { key: "contain", label: "contains" },
    { key: "not_contain", label: "doesn't contains" },
    { key: "starts_with", label: "starts with" },
  ];

  function createRow() {
    return {
      id: `${Date.now()}_${Math.random()}`,
      column: "",
      condition: "",
      value: "",
      valueOptions: [] as Array<{ key: string; label: string }>,
    };
  }

  const [rows, setRows] = useState([createRow()]);

  // position the popup under the anchor
  const maxWidth = 1500;
  const minWidth = 200;
  const [style, setStyle] = useState<{ top: number; left: number; minWidth: number; maxWidth: number }>({ top: 0, left: 0, minWidth: 200, maxWidth });

  useEffect(() => {
    const anchorEl = anchorRef?.current;
    if (!anchorEl) {
      // Calculate center position numerically instead of using percentage
      const viewportWidth = window.innerWidth;
      const popupWidth = 615; // Your popup width
      const left = (viewportWidth - popupWidth) / 2;
      setStyle((s) => ({ ...s, top: 160, left, minWidth, maxWidth }));
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.left + window.scrollX;
    setStyle({ top, left, minWidth, maxWidth });
  }, [anchorRef]);

  // click outside to close
  useEffect(() => {
    function onDocMouse(e: MouseEvent) {
      const p = popupRef.current;
      const a = anchorRef?.current;
      if (!p) return;
      // @ts-expect-error - p is a ref that will contain the popup element
      if (p.contains(e.target as Node)) return;
      if (a && a.contains(e.target as Node)) return;
      onClose?.();
    }
    document.addEventListener("mousedown", onDocMouse);
    return () => document.removeEventListener("mousedown", onDocMouse);
  }, [onClose, anchorRef]);

  async function fetchValuesForColumn(colKey: string | number, rowId: string) {
    if (!colKey) return;
    try {
      const MAP: Record<string, string[]> = {
        name: ["Alice", "Bob", "Charlie"],
        group: ["Sales", "Support", "Engineering"],
        status: ["New", "Contacted", "Qualified", "Lost"],
        company: ["Acme Pvt Ltd", "Globex", "Stark Industries"],
        title: ["CEO", "Manager", "Developer"],
        email: ["alice@example.com", "bob@example.com"],
        phone: ["+91-99999-00000", "+91-88888-11111"],
        last_interaction: ["2024-06-21", "2025-07-01", "2025-07-15"],
      };

      const list: string[] = MAP[colKey] || [];

      // normalize to objects suited for ColumnSelect
      const options = list.map((v) => ({ key: String(v), label: String(v) }));

      // update only the specific row's valueOptions (and reset selected value)
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, valueOptions: options, value: "" } : r)));
    } catch (err) {
      console.error("fetchValues error", err);
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, valueOptions: [], value: "" } : r)));
    }
  }

  function updateRow(rowId: string, patch: {
    column?: string;
    condition?: string;
    value?: string;
    valueOptions?: Array<{ key: string; label: string }>;
  }) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, createRow()]);
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }

  function saveFilters() {
    const payload = rows.map((r) => ({ column: r.column, condition: r.condition, value: r.value }));
    console.log("Save filters payload:", payload);
    onClose?.();
  }

  return (
    <div
      ref={popupRef}
      className="absolute z-10  w-[615px] bg-white rounded shadow-lg border"
      style={{
        top: style.top,
        left: style.left,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        // transform: style|| undefined,
      }}
    >
      <div className="px-3 py-4 flex items-center justify-between">
        <h4 className="font-semibold text-xl">Filter</h4>
        <div className="flex gap-2">
          <button className="text-[13px] px-2 py-1 text-gray-400 rounded" onClick={() => setRows([createRow()])}>
            Clear all
          </button>
          <select className="border rounded px-2 py-1 text-sm">
            <option value="">Saved filters</option>
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <button className="text-sm px-2 py-1 rounded border" onClick={onClose}>
            Save Filter setting
          </button>
        </div>
      </div>

      <div className="px-3 space-y-3 max-h-[60vh] overflow-auto">
        {rows.map((row, idx) => (
          <div key={row.id} className="flex gap-2 items-end">
            <div className=" flex relative z-26">
              <label className="text-[13px] mr-1.5 flex items-center font-semibold">Where:</label>
              <ColumnSelect
                value={row.column}
                data={COLUMNS}
                placeholder="Column"
                onChange={(colKey: string | number | undefined) => {
                  if (colKey) {
                    updateRow(row.id, { column: String(colKey), condition: "", value: "", valueOptions: [] });
                    fetchValuesForColumn(String(colKey), row.id);
                  }
                }}

              />
            </div>

            <div className="relative">
              <ColumnSelect
                value={row.condition}
                data={CONDITIONS}
                placeholder="Condition"
                onChange={(condKey: string | number | undefined) => {
                  if (condKey) {
                    updateRow(row.id, { condition: String(condKey) });
                  }
                }}
              />
            </div>

            <div className="">
              <ColumnSelect
                value={row.value}
                data={row.valueOptions}
                placeholder="Value"
                onChange={(condKey: string | number | undefined) => {
                  if (condKey) {
                    updateRow(row.id, { condition: String(condKey) });
                  }
                }}
              />
            </div>
            <div className="">
              <button onClick={() => removeRow(row.id)} className="text-red-500 font-semibold py-1" title="Remove">
                ✕
              </button>
            </div>
          </div>
        ))}

        <div>
          <button onClick={addRow} className="bg-gray-100 text-sm mt-8 mb-2 px-2 border flex rounded">
            <p className="text-[16px]">+</p> <p className="flex items-center ml-1">New filter</p>
          </button>
        </div>
      </div>

      <div className="p-3 border-t flex justify-end gap-2">
        <button className="px-3 py-1 border rounded" onClick={onClose}>
          Cancel
        </button>
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={saveFilters}>
          Apply
        </button>
      </div>
    </div>
  );
}