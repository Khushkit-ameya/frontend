"use client";
import React from "react";
import { X, Edit } from "lucide-react";

type DescriptionModalProps = {
  open: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (text: string) => Promise<void> | void;
  title?: string;
};

const DescriptionModal: React.FC<DescriptionModalProps> = ({ open, initialText, onClose, onSave, title }) => {
  const [value, setValue] = React.useState<string>(initialText ?? "");
  const [editing, setEditing] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);

  React.useEffect(() => {
    setValue(initialText ?? "");
    setEditing(false);
  }, [initialText, open]);

  if (!open) return null;

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await onSave(value ?? "");
      setSaving(false);
      setEditing(false);
    } catch (e) {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4">
      <div className="bg-white rounded-[10px] w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: "#656462" }}>
          <h3 className="text-white text-base font-medium">{title || "Update Description"}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title={editing ? "View" : "Edit"}
              onClick={() => setEditing((e) => !e)}
              className="p-1 rounded hover:bg-white/10 text-white"
            >
              <Edit size={18} />
            </button>
            <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 min-h-[140px] focus:outline-none focus:ring-1 focus:ring-gray-400"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!editing}
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={!editing || saving}
              className="px-4 py-2 rounded text-white disabled:opacity-60"
              style={{ backgroundColor: "#C81C1F" }}
            >
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DescriptionModal;
