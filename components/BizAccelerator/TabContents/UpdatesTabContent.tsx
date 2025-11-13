"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip } from "lucide-react";
import Image from "next/image";
import { RichTextEditor } from '@/components/common/forms/RichTextEditor';
import { toast } from 'react-toastify';
import { customToast } from '@/utils/toast';

// Define proper TypeScript interfaces
interface UpdateUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface UpdateItem {
  id: string;
  content?: string;
  updateNotes?: string;
  timestamp: string;
  createdBy?: UpdateUser;
  createdByName?: string;
}

interface UpdateOption {
  value: string;
  label: string;
  icon: string;
}

interface UpdatesTabContentProps {
  updateOptions?: UpdateOption[];
  className?: string;
  opportunityId?: string;
  // Updated props with proper types
  updatesData?: UpdateItem[];
  isLoading?: boolean;
  onCreateUpdate?: (content: string) => Promise<void>;
  onEditUpdate?: (updateId: string, content: string) => Promise<void>;
  onDeleteUpdate?: (updateId: string) => Promise<void>;
}

export const UpdatesTabContent: React.FC<UpdatesTabContentProps> = ({
  updateOptions = [
    { value: "email", label: "Email", icon: "/icons/email (1).svg" },
    { value: "whatsapp", label: "WhatsApp", icon: "/icons/whatsapp.svg" },
    { value: "sms", label: "SMS", icon: "/icons/sms.svg" },
  ],
  className = "",
  opportunityId,
  // Updated with proper types
  updatesData = [],
  isLoading = false,
  onCreateUpdate,
  onEditUpdate,
  onDeleteUpdate,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [showUpdateVia, setShowUpdateVia] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [updateContent, setUpdateContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customColor = "#C81C1F";

  const toggleSelect = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get initials for avatar
  const getInitials = (firstName?: string, lastName?: string, fullName?: string) => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Handle update submission
  const handleSubmitUpdate = async () => {
    if (!updateContent.trim()) {
      toast.error("Please enter update content");
      return;
    }

    if (!onCreateUpdate) {
      toast.error("Update functionality not available");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateUpdate(updateContent);
      setUpdateContent("");
      setSelected([]);
    } catch (error) {
      console.error("Failed to create update:", error);
      toast.error("Failed to add update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${className} h-full flex flex-col`}>
      <h3 className="font-semibold text-lg">Updates</h3>

      {/* Update via dropdown */}
      <div className="flex items-end justify-end mb-2 relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowUpdateVia((s) => !s)}
          className="inline-flex items-center justify-between rounded-md border border-gray-200 p-2 bg-gray-100"
        >
          <span className="font-normal text-sm">Update via</span>
          <svg className="ml-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showUpdateVia && (
          <div className="absolute top-full right-0 mt-1 w-56 rounded-md shadow-lg z-10 bg-white border border-gray-200 py-1">
            {updateOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleSelect(opt.value)}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
              >
                <span
                  className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${selected.includes(opt.value)
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-400"
                    }`}
                >
                  {selected.includes(opt.value) && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <Image src={opt.icon} alt={opt.label} width={26} height={26} />
                <span className="ml-2 font-medium text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="border border-gray-300 rounded-lg bg-[#4F50510D] p-2">
        <RichTextEditor
          value={updateContent}
          onChange={setUpdateContent}
          placeholder="Write an update and mention others with @"
          height={200}
          className="w-full min-h-[120px] bg-transparent text-gray-900"
        />

        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>@ Mention</span>
            {/* <Paperclip size={16} /> */}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-1.5 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#C81C1F" }}
              onClick={handleSubmitUpdate}
              disabled={isSubmitting || !updateContent.trim() || !onCreateUpdate}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Updates List */}
      <div className="mt-5 border border-gray-300 rounded-lg bg-[#4F50510D] p-2 overflow-y-auto max-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : updatesData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No updates yet. Be the first to add one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updatesData.map((update: UpdateItem) => (
              <div key={update.id} className="bg-white rounded-lg shadow-sm p-4 mx-5 mt-5 first:mt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                      style={{ backgroundColor: customColor }}
                    >
                      {getInitials(update.createdBy?.firstName, update.createdBy?.lastName, update.createdBy?.name)}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">
                        {update.createdByName || 'Unknown User'}
                      </p>
                      <p className="text-xs" style={{ color: customColor }}>
                        {formatDate(update.timestamp)}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">⋮</button>
                </div>
                <div
                  className="mt-3 text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: update.content || update.updateNotes || 'No content'
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};