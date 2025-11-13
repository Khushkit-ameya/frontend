"use client";

import React, { useState, useRef } from "react";
import { Paperclip, ChevronLeft, X } from "lucide-react";

// Import theme utils
import { setTheme, setCompanyThemeColor } from "@/store/api_query/global";
import { useTheme, useCompanyTheme } from "@/store/hooks";

interface EmailComposerProps {
  initialRecipients?: string[];
  initialRecipientsCc?: string[];
  initialSubject?: string;
  initialBody?: string;
  onSend: (emailData: {
    recipients: string[];
    recipientsCc: string[];
    subject: string;
    body: string;
  }) => void;
  onBack: () => void;
  className?: string;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  initialRecipients = [],
  initialRecipientsCc = [],
  initialSubject = "",
  initialBody = "",
  onSend,
  onBack,
  className = "",
}) => {
  const [recipients, setRecipients] = useState<string[]>(initialRecipients);
  const [toInputValue, setToInputValue] = useState("");
  const [recipientsCc, setRecipientsCc] = useState<string[]>(initialRecipientsCc);
  const [ccInputValue, setCcInputValue] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  // ✅ get theme values
  const { isDark, colors, companyThemeColor } = useTheme();

  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && toInputValue.trim() !== "") {
      e.preventDefault();
      setRecipients([...recipients, toInputValue.trim()]);
      setToInputValue("");
    }
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && ccInputValue.trim() !== "") {
      e.preventDefault();
      setRecipientsCc([...recipientsCc, ccInputValue.trim()]);
      setCcInputValue("");
    }
  };

  const removeCcRecipient = (index: number) => {
    setRecipientsCc(recipientsCc.filter((_, i) => i !== index));
  };

  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // include attachments in send
  const handleSend = () => {
    onSend({
      recipients,
      recipientsCc,
      subject,
      body,
    });
  };

  return (
    <div
      className={`border border-gray-300 rounded-lg bg-white dark:bg-gray-900 p-4 ${className}`}
    >
      {/* Header with only X button to close email composer */}
      <div className="flex justify-between items-center mb-4">
        {/* <h3 className="text-lg font-semibold">New Email</h3> */}
        {/* <button
          onClick={onBack}
          className="text-white bg-[#C81C1F] rounded-sm p-1 transition"
        >
          <X size={20} />
        </button> */}
      </div>

      {/* From */}
      <div className="mb-3">
        <label className="block text-sm text-gray-500">From </label>
        <input
          type="text"
          className="w-full mt-1 p-2 border-b border-[#0000001A] focus:outline-none bg-transparent"
        />
      </div>

      {/* To */}
      <div className="mb-1 flex items-start gap-2">
        <label className="block text-sm text-gray-500 mt-2">To</label>
        <div className="flex flex-wrap items-center gap-2 flex-1 border-[#0000001A] p-1">
          {recipients.map((email, index) => (
            <span
              key={index}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#1C75BB1A] text-sm"
            >
              {email}
              <button
                onClick={() => removeRecipient(index)}
                className="text-gray-600 hover:text-black"
              >
                <span className="text-xs">×</span>
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#0000001A] mb-3">
        <input
          type="email"
          value={toInputValue}
          onChange={(e) => setToInputValue(e.target.value)}
          onKeyDown={handleToKeyDown}
          placeholder="Add recipient"
          className="flex-1 p-2 focus:outline-none bg-transparent"
        />
        <div className="flex gap-2">
          <button
            style={{ backgroundColor: "#C81C1F" }}
            className="px-2 py-1 text-xs rounded text-white"
            onClick={() => {
              if (toInputValue.trim()) {
                setRecipients([...recipients, toInputValue.trim()]);
                setToInputValue("");
              }
            }}
          >
            Add
          </button>
          <button
            style={{ backgroundColor: "#C81C1F" }}
            className="px-2 py-1 text-xs rounded text-white"
            onClick={() => setShowCc(!showCc)}
          >
            {showCc ? "Cc ×" : "Cc"}
          </button>
        </div>
      </div>

      {/* Cc Section */}
      {showCc && (
        <>
          <div className="mb-1 flex items-start gap-2">
            <label className="block text-sm text-gray-500 mt-2">Cc:</label>
            <div className="flex flex-wrap items-center gap-2 flex-1 border-[#0000001A] p-1">
              {recipientsCc.map((email, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#1C75BB1A] text-sm"
                >
                  {email}
                  <button
                    onClick={() => removeCcRecipient(index)}
                    className="text-gray-600 hover:text-black"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[#0000001A] mb-3">
            <input
              type="email"
              value={ccInputValue}
              onChange={(e) => setCcInputValue(e.target.value)}
              onKeyDown={handleCcKeyDown}
              placeholder="Add CC recipient"
              className="flex-1 p-2 focus:outline-none bg-transparent"
            />
          </div>
        </>
      )}

      {/* Subject */}
      <div className="mb-3">
        <label className="block text-sm text-gray-500">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full mt-1 p-2 border-b border-[#0000001A] focus:outline-none bg-transparent"
        />
      </div>

      {/* Body */}
      <div className="mb-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Compose your email here...."
          className="w-full min-h-[120px] border-[#0000001A] p-2 border rounded bg-transparent focus:outline-none"
        />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative border rounded p-2 w-24 h-24 flex items-center justify-center bg-gray-50"
            >
              {/* If image, show thumbnail */}
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="max-w-full max-h-full rounded"
                />
              ) : (
                <span className="text-xs text-gray-700 text-center break-words">
                  {file.name}
                </span>
              )}

              {/* Remove button */}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          style={{ backgroundColor: "#C81C1F" }}
          className="px-4 py-1.5 text-white rounded"
        >
          Send
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={18} />
        </button>
      </div>
    </div>
  );
};