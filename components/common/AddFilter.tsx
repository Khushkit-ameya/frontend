"use client";

import React, { useEffect, useRef, useState } from "react";
import { BiUser, BiGroup, BiPhone } from "react-icons/bi";
import { AiOutlineMail, AiOutlineIdcard } from "react-icons/ai";
import { FaRegBuilding } from "react-icons/fa";
import { HiOutlineClock } from "react-icons/hi";
import ColumnSelect from "./CustomColumnSelect";

// Define the icon map to convert string icons to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BiUser,
  BiGroup,
  BiPhone,
  AiOutlineMail,
  AiOutlineIdcard,
  FaRegBuilding,
  HiOutlineClock,
};

type Option = {
  key: string;
  label: string;
  icon?: string; // Change to string to match ColumnItem
  color?: string;
};

type Row = {
  id: string;
  column: string;
  condition: string;
  value: string;
  valueOptions: Option[];
};

type AddFilterProps = {
  anchorRef: React.RefObject<HTMLElement> | { current: HTMLElement | null };
  onClose?: () => void;
};

type ColumnItem = {
  key: string;
  label: string;
  icon?: string;
  color?: string;
};

export default function AddFilter({ anchorRef, onClose }: AddFilterProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);

  const COLUMNS: ColumnItem[] = [
    { key: "name", label: "Name", icon: "BiUser", color: "text-purple-600" },
    { key: "group", label: "Group", icon: "BiGroup", color: "text-indigo-600" },
    { key: "status", label: "Status", icon: "HiOutlineClock", color: "text-green-600" },
    { key: "company", label: "Company", icon: "FaRegBuilding", color: "text-emerald-600" },
    { key: "title", label: "Title", icon: "AiOutlineIdcard", color: "text-yellow-500" },
    { key: "email", label: "Email", icon: "AiOutlineMail", color: "text-orange-400" },
    { key: "phone", label: "Phone", icon: "BiPhone", color: "text-yellow-600" },
    { key: "last_interaction", label: "Last interaction", icon: "HiOutlineClock", color: "text-sky-600" },
  ];

  const CONDITIONS: ColumnItem[] = [ // Use ColumnItem type for consistency
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
      valueOptions: [] as Option[],
    };
  }

  const [rows, setRows] = useState<Row[]>([createRow()]);

  // position the popup under the anchor
  const maxWidth = 1500;
  const minWidth = 200;
  const [style, setStyle] = useState<{ top: number; left: number | string; minWidth: number; maxWidth: number; transform?: string }>({ top: 0, left: 0, minWidth: 200, maxWidth });

  useEffect(() => {
    const anchorEl = anchorRef?.current;
    if (!anchorEl) {
      setStyle((s) => ({ ...s, top: 228, left: "50%", transform: "translateX(-50%)" }));
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
      if (p.contains(e.target as Node)) return;
      if (a && a.contains(e.target as Node)) return;
      onClose?.();
    }
    document.addEventListener("mousedown", onDocMouse);
    return () => document.removeEventListener("mousedown", onDocMouse);
  }, [onClose, anchorRef]);

  async function fetchValuesForColumn(colKey: string, rowId: string) {
    if (!colKey) return;
    try {
      const MAP: Record<string, Array<string>> = {
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

      // Convert to Option[] type (using string for icon)
      const options: Option[] = list.map((v) => ({ key: String(v), label: String(v) }));

      // update only the specific row's valueOptions (and reset selected value)
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, valueOptions: options, value: "" } : r)));
    } catch (err) {
      console.error("fetchValues error", err);
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, valueOptions: [], value: "" } : r)));
    }
  }

  function updateRow(rowId: string, patch: Partial<Row>) {
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

  // Helper function to handle onChange with proper typing
  const handleColumnChange = (value: string | number) => {
    const colKey = String(value); // Convert to string since we know it should be string
    return colKey;
  };

  const handleConditionChange = (value: string | number) => {
    const condKey = String(value);
    return condKey;
  };

  const handleValueChange = (value: string | number) => {
    const valKey = String(value);
    return valKey;
  };

  return (
    <div
      ref={popupRef}
      className="absolute z-10  w-[615px] bg-white rounded shadow-lg border"
      style={{
        top: style.top,
        left: style.left,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        transform: style.transform || undefined,
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

      <div className="px-4 space-y-3 max-h-[60vh] overflow-auto">
        {rows.map((row) => (
          <div key={row.id} className="flex gap-2 items-end">
            <div className=" flex relative z-26">
              <label className="text-xs mr-1.5 flex items-center font-semibold">Where:</label>
              <ColumnSelect
                value={row.column}
                data={COLUMNS}
                placeholder="Column"
                onChange={(value: string | number) => {
                  const colKey = handleColumnChange(value);
                  updateRow(row.id, { column: colKey, condition: "", value: "", valueOptions: [] });
                  fetchValuesForColumn(colKey, row.id);
                }}
              />
            </div>

            <div className="relative">
              <ColumnSelect
                value={row.condition}
                data={CONDITIONS}
                placeholder="Condition"
                onChange={(value: string | number) => {
                  const condKey = handleConditionChange(value);
                  updateRow(row.id, { condition: condKey });
                }}
              />
            </div>

            <div className="">
              <ColumnSelect
                value={row.value}
                data={row.valueOptions}
                placeholder="Value"
                onChange={(value: string | number) => {
                  const valKey = handleValueChange(value);
                  updateRow(row.id, { value: valKey });
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