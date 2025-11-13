"use client";

import * as React from "react";
import { X, Paperclip, List, Underline } from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import Image from "next/image";
import CustomCalendar from "@/components/CustomCalendar";
import { UserDropdown } from "@/components/common/forms/UserDropdown";
import type { User as DFUser } from "@/components/common/forms/DynamicForm/types";
import { useGetCurrentUserQuery } from "@/store/api_query/auth.api";

type User = DFUser;

export interface ActivityData {
  type: string;
  subject: string;
  description: string;
  scheduledAt: string;
  duration: number;
  files: string[];
  priority: string;
  status: string;
  opportunityId?: string;
  dealId?: string;
  leadId?: string;
  contactId?: string;
}

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "meeting" | "call" | "notes" | "todo" | "email";
  relatedEntity?: {
    id: string;
    name: string;
    type: 'opportunity' | 'deal' | 'lead' | 'contact' | 'account' | 'customer';
  };
  onCreateActivity?: (activityData: ActivityData) => Promise<void>;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  type,
  relatedEntity,
  onCreateActivity
}) => {
  console.log("🎯 ActivityModal received relatedEntity:", relatedEntity);

  // Store relatedEntity in state to prevent losing it during re-renders
  const [storedRelatedEntity, setStoredRelatedEntity] = React.useState(relatedEntity);

  // Update storedRelatedEntity when relatedEntity prop changes AND modal opens
  React.useEffect(() => {
    if (isOpen && relatedEntity) {
      console.log("💾 Storing relatedEntity:", relatedEntity);
      setStoredRelatedEntity(relatedEntity);
    }
  }, [isOpen, relatedEntity]);

  const [startDate, setStartDate] = React.useState<Date | null>(new Date());
  const [endDate, setEndDate] = React.useState<Date | null>(
    new Date(new Date().getTime() + 60 * 60 * 1000)
  );
  const [openPicker, setOpenPicker] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [description, setDescription] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [owner, setOwner] = React.useState<DFUser | DFUser[] | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { data: currentUser } = useGetCurrentUserQuery();

  React.useEffect(() => {
    if (currentUser) {
      setOwner({
        id: currentUser.id || "",
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        role: currentUser.role || "Owner"
      });
    }
  }, [currentUser]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setFiles([]);
      setStartDate(new Date());
      setEndDate(new Date(new Date().getTime() + 60 * 60 * 1000));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Apply text formatting inside textarea
  const applyFormatting = (tag: string, align?: string) => {
    const textarea = document.getElementById("desc-area") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);

    let newText = description;

    if (tag === "underline") {
      newText =
        description.substring(0, start) +
        `<u>${selectedText}</u>` +
        description.substring(end);
    } else if (align) {
      newText =
        description.substring(0, start) +
        `<div style="text-align:${align}">${selectedText}</div>` +
        description.substring(end);
    }

    setDescription(newText);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!title.trim()) {
      alert('Please enter a title for the activity');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    if (startDate >= endDate) {
      alert('Start time must be before end time');
      return;
    }

    // Calculate duration in minutes
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

    // Prepare activity data with proper API field names
    const activityData: ActivityData = {
      type: type.toLowerCase(),
      subject: title.trim(),
      description: description.trim(),
      scheduledAt: startDate.toISOString(),
      duration: duration,
      files: files.map(file => file.name),
      priority: '',
      status: 'SCHEDULED',
      // Include the related entity
      ...(storedRelatedEntity && {
        [`${storedRelatedEntity.type}Id`]: storedRelatedEntity.id
      })
    };

    console.log("📤 ActivityModal sending payload:", activityData);
    console.log("🔗 Related entity:", storedRelatedEntity);

    // Call the parent handler to create the activity
    if (onCreateActivity) {
      try {
        await onCreateActivity(activityData);
        // Don't close here - let the parent handle success/close
      } catch (error) {
        console.error("Activity creation failed:", error);
        // Keep modal open on error
      }
    } else {
      console.log('Activity data (no handler):', activityData);
      alert('Activity created successfully!');
      onClose();
    }
  };

  const handleOwnerChange = (newOwner: DFUser[] | DFUser | null) => {
    if (newOwner && !Array.isArray(newOwner)) {
      setOwner(newOwner);
    } else if (Array.isArray(newOwner) && newOwner.length > 0) {
      setOwner(newOwner[0]);
    } else {
      setOwner(null);
    }
  };

  // Helper function to get entity type display name
  const getEntityTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'opportunity': 'Opportunity',
      'deal': 'Deal',
      'lead': 'Lead',
      'contact': 'Contact',
      'account': 'Account',
      'customer': 'Customer'
    };
    return typeMap[type] || type;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 h-auto -top-56">
        <div className="rounded-[10px] bg-white shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-[#33333312] p-5 flex items-center justify-between rounded-t-[10px]">
            <h2 className="font-inter font-medium text-[16px] leading-[100%]">
              Activity ({type}) {storedRelatedEntity && `- ${storedRelatedEntity.name}`}
            </h2>
            <button
              onClick={onClose}
              className="text-white rounded px-2 py-1"
              style={{ backgroundColor: "#C81C1F" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 md:p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left Panel */}
              <div className="w-full lg:w-2/3 flex-1 border border-[#0000004F] rounded-[10px] p-3 md:p-4 flex flex-col">
                {/* Custom Date Range Button */}
                <button
                  onClick={() => setOpenPicker(true)}
                  className="flex items-center gap-2 w-full border border-[#0000004F] rounded px-3 py-2 text-left hover:bg-gray-50"
                >
                  <Image src="/icons/time.svg" alt="Select date" width={17} height={17} />
                  <span className="text-sm text-gray-800">
                    {startDate && endDate
                      ? `${format(startDate, "dd/MM/yyyy")} ${format(startDate, "HH:mm")} - ${format(endDate, "dd/MM/yyyy")} ${format(endDate, "HH:mm")}`
                      : "Select date & time"}
                  </span>
                </button>
                {openPicker && (
                  <CustomCalendar
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(s, e) => {
                      setStartDate(s);
                      setEndDate(e);
                    }}
                    onClose={() => setOpenPicker(false)}
                    themeColor={"#C81C1F"}
                  />
                )}

                {/* Title */}
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-4 border-b border-b-[#0000004F] bg-transparent focus:outline-none focus:ring-0 px-3 py-2"
                />

                {/* Description (textarea with wrap) */}
                <textarea
                  id="desc-area"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="mt-4 border-b border-b-[#0000004F] bg-transparent focus:outline-none focus:ring-0 px-3 py-2 resize-none min-h-[100px]"
                />

                {/* File Upload */}
                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="max-h-[100px] overflow-y-auto mt-2 space-y-1 pr-1">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-100 rounded px-2 py-1 text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Add + Icons */}
                <div className="mt-auto flex flex-col sm:flex-row items-center justify-between border-t pt-3 gap-2">
                  <button
                    onClick={handleSubmit}
                    className="text-white px-4 py-2 rounded-[8px] w-full sm:w-auto min-w-[80px]"
                    style={{ backgroundColor: "#C81C1F" }}
                  >
                    Add
                  </button>

                  <div className="flex gap-4 text-gray-700">
                    <Paperclip
                      size={20}
                      className="cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <List size={20} className="cursor-pointer" />
                    <Underline
                      size={20}
                      className="cursor-pointer"
                      onClick={() => applyFormatting("underline")}
                    />
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="w-full lg:w-1/3 h-auto lg:h-[363px] border border-[#0000004F] rounded-[10px] p-3 md:p-4">
                {/* Owner */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center">
                    <div
                      className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: "#C81C1F" }}
                    >
                      <Image
                        src="/icons/project/Owner.svg"
                        alt="Owner"
                        width={16}
                        height={16}
                      />
                    </div>
                    <label className="block text-sm font-medium">Owner</label>
                  </div>
                  <UserDropdown
                    value={owner}
                    onChange={handleOwnerChange}
                    placeholder="Select Owner"
                    multiple={false}
                    error={false}
                    disabled
                    options={[]}
                  />
                </div>

                {/* Status */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center">
                    <div
                      className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: "#C81C1F" }}
                    >
                      <Image
                        src="/icons/project/status.svg"
                        alt="Status"
                        width={16}
                        height={16}
                      />
                    </div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                  </div>
                  <div className="w-full rounded-md bg-[#9CA3AF] px-3 py-2.5 text-center text-sm font-medium text-white shadow-sm">
                    Not Started
                  </div>
                </div>

                {/* Related Entity */}
                <div className="mb-3">
                  <div className="mb-2 flex items-center">
                    <div
                      className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: "#C81C1F" }}
                    >
                      <Image
                        src="/icons/project/tags.svg"
                        alt="Related Items"
                        width={16}
                        height={16}
                      />
                    </div>
                    <label className="text-sm font-medium text-gray-700">
                      Related {storedRelatedEntity ? getEntityTypeDisplayName(storedRelatedEntity.type) : 'Item'}
                    </label>
                  </div>

                  {storedRelatedEntity ? (
                    <>
                      <input
                        type="text"
                        value={storedRelatedEntity.name || 'Entity'}
                        className="w-full border border-[#0000004F] rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
                        readOnly
                        disabled
                      />
                    </>
                  ) : (
                    <div className="w-full border border-[#0000004F] rounded px-3 py-2 bg-gray-50 cursor-not-allowed">
                      <span className="text-gray-500">No related item selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};