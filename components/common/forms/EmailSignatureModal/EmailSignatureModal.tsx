"use client";

import { useState } from "react";
import { X } from "lucide-react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface EmailSignatureModalProps {
  initialSigType?: "simple" | "html";
  initialSigHtml?: string;
  initialComposeOn?: boolean;
  initialReplyOn?: boolean;
  onClose: () => void;
  onSave?: (data: {
    sigType: "simple" | "html";
    sigHtml: string;
    composeOn: boolean;
    replyOn: boolean;
  }) => void;
}

export const EmailSignatureModal: React.FC<EmailSignatureModalProps> = ({
  initialSigType = "simple",
  initialSigHtml = "",
  initialComposeOn = true,
  initialReplyOn = false,
  onClose,
  onSave,
}) => {
  const [sigType, setSigType] = useState<"simple" | "html">(initialSigType);
  const [sigHtml, setSigHtml] = useState(initialSigHtml);
  const [composeOn, setComposeOn] = useState(initialComposeOn);
  const [replyOn, setReplyOn] = useState(initialReplyOn);

  const handleSave = () => {
    onSave?.({
      sigType,
      sigHtml,
      composeOn,
      replyOn,
    });
    onClose();
  };

  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "blockquote", "code-block"],
      ["clean"],
    ],
  };

  return (
    <div className="w-full border border-gray-300 rounded-lg bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Email signature</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        {/* Signature type */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={sigType === "simple"}
              onChange={() => setSigType("simple")}
            />
            Simple
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={sigType === "html"}
              onChange={() => setSigType("html")}
            />
            HTML
          </label>
        </div>

        {/* Editor */}
        <ReactQuill
          value={sigHtml}
          onChange={setSigHtml}
          modules={modules}
          theme="snow"
          placeholder="Create your email signature..."
          className="h-40"
        />

        

        {/* Action buttons */}
        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            style={{ backgroundColor: "#C81C1F" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between text-sm">
    <span>{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </label>
);
