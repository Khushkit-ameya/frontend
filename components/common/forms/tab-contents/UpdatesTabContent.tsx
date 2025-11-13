"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip } from "lucide-react";
import Image from "next/image";
import { RichTextEditor } from '@/components/common/forms/RichTextEditor';
import { useGetProjectUpdatesQuery, } from '@/store/api_query/LazyKill/project.api';
import {
  useCreateProjectUpdateMutation,
  useGetTaskUpdatesQuery,
  useGetSubtaskUpdatesQuery
} from '@/store/api_query/LazyKill/lazyKill.api';
import { useGetCurrentUserQuery, useGetContactQuery, useUpdateFormContactMutation } from "@/store/api";
import customToast from "@/utils/toast";

// Update the component props
interface UpdatesTabContentProps {
  updateOptions?: Array<{ value: string; label: string; icon: string }>;
  className?: string;
  projectId?: string;
  contactId?: string;
  editContact?: unknown;
  taskId?: string; // Add direct taskId prop
  relatedItem?: {
    type?: 'task' | 'subtask';
    taskId?: string;
    subTaskId?: string;
    projectId?: string;
    projectName?: string;
  };
}

// Update the component implementation
export const UpdatesTabContent: React.FC<UpdatesTabContentProps> = ({
  updateOptions = [
    { value: "email", label: "Email", icon: "/icons/email (1).svg" },
    { value: "whatsapp", label: "WhatsApp", icon: "/icons/whatsapp.svg" },
    { value: "sms", label: "SMS", icon: "/icons/sms.svg" },
  ],
  className = "",
  projectId,
  contactId,
  editContact,
  taskId, // Direct taskId prop
  relatedItem,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [showUpdateVia, setShowUpdateVia] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [updateContent, setUpdateContent] = useState("");
  const customColor = "#C81C1F";

  // RTK Query hooks for current user
  const { data: currentUser } = useGetCurrentUserQuery();

  // Debug what we're receiving
  console.log("UpdatesTabContent - taskId prop:", taskId);
  console.log("UpdatesTabContent - relatedItem:", relatedItem);
  console.log("UpdatesTabContent - projectId:", projectId);

  // Determine if this is for task or subtask - check both sources
  const resolvedTaskId = taskId || relatedItem?.taskId;
  const resolvedSubTaskId = relatedItem?.subTaskId;

  const isTask = !!resolvedTaskId;
  const isSubtask = !!resolvedSubTaskId;

  console.log("UpdatesTabContent - resolvedTaskId:", resolvedTaskId);
  console.log("UpdatesTabContent - resolvedSubTaskId:", resolvedSubTaskId);
  console.log("UpdatesTabContent - isTask:", isTask, "isSubtask:", isSubtask);

  const {
    data: taskUpdatesData,
    isLoading: taskUpdatesLoading,
    refetch: refetchTaskUpdates
  } = useGetTaskUpdatesQuery(
    { projectId: projectId!, taskId: resolvedTaskId! },
    { skip: !projectId || !resolvedTaskId || !isTask }
  );

  const {
    data: subtaskUpdatesData,
    isLoading: subtaskUpdatesLoading,
    refetch: refetchSubtaskUpdates
  } = useGetSubtaskUpdatesQuery(
    { projectId: projectId!, subTaskId: resolvedSubTaskId! },
    { skip: !projectId || !resolvedSubTaskId || !isSubtask }
  );

  const {
    data: projectUpdatesData,
    isLoading: projectUpdatesLoading,
    refetch: refetchProjectUpdates
  } = useGetProjectUpdatesQuery(projectId || '', {
    skip: !projectId || (isTask || isSubtask),
  });

  const [createUpdate, { isLoading: isCreating }] = useCreateProjectUpdateMutation();

  // Contact-related hooks (for BizAccelerator) - keep existing
  const queryContactId = contactId || (editContact as { id?: string })?.id || '';
  const { data: contactData, refetch: refetchContact } = useGetContactQuery(
    queryContactId,
    { skip: !queryContactId }
  );
  const [updateContact, { isLoading: isUpdating }] = useUpdateFormContactMutation();

  const toggleSelect = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Format date for display (unified for both project and contact)
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

  const handleTaskUpdate = async () => {
    if (!updateContent.trim()) {
      customToast.error("Please enter update notes");
      return;
    }

    if (!projectId) {
      customToast.error("Project ID is missing");
      return;
    }

    if (!currentUser?.company?.id || !currentUser?.id) {
      customToast.error("User information is missing");
      return;
    }

    try {
      const payload: any = {
        projectId,
        updateNotes: updateContent,
        companyId: currentUser.company.id,
        createdById: currentUser.id,
      };

      // Determine the type of update
      if (isTask && resolvedTaskId) {
        payload.taskId = resolvedTaskId;
        console.log("Adding taskId to payload:", resolvedTaskId);
      } else if (isSubtask && resolvedSubTaskId) {
        payload.subTaskId = resolvedSubTaskId;
        if (relatedItem?.taskId) {
          payload.taskId = relatedItem.taskId;
        }
      }

      console.log("Final payload for update:", payload);

      await createUpdate(payload).unwrap();

      // REFETCH THE UPDATES AFTER SUCCESS
      if (isTask) {
        await refetchTaskUpdates();
      } else if (isSubtask) {
        await refetchSubtaskUpdates();
      } else {
        await refetchProjectUpdates();
      }

      customToast.success("Update added successfully!");
      setUpdateContent("");
      setSelected([]);
    } catch (error: unknown) {
      console.error("Failed to create update:", error);
      customToast.error((error as { data?: { message?: string } })?.data?.message || "Failed to add update");
    }
  };

  const handleContactUpdate = async () => {
    if (!updateContent.trim()) {
      customToast.error("Please enter update content");
      return;
    }

    if (!contactId && !(editContact as { id?: string })?.id) {
      customToast.error("No contact selected");
      return;
    }

    try {
      const targetContactId = contactId ?? (editContact as { id?: string })?.id;
      if (!targetContactId) {
        customToast.error("No contact selected");
        return;
      }

      await updateContact({
        contactId: targetContactId,
        data: {
          updates: updateContent,
          ...((contactData as any)?.data || (editContact as any)),
          id: targetContactId
        }
      }).unwrap();

      customToast.success("Update added successfully");
      setUpdateContent("");

      // REFETCH CONTACT DATA
      await refetchContact();
    } catch (error) {
      console.error("Failed to add update:", error);
      customToast.error("Failed to add update");
    }
  };

  const handleSubmitUpdate = async () => {
    if (!updateContent.trim()) {
      customToast.error("Please enter update content");
      return;
    }

    console.log("Submit Update Debug:", {
      projectId,
      contactId,
      editContactId: (editContact as { id?: string })?.id,
      isTask,
      isSubtask,
      resolvedTaskId,
      resolvedSubTaskId
    });

    try {
      if (projectId) {
        console.log("Calling handleTaskUpdate for project/task/subtask");
        await handleTaskUpdate();
      } else if (contactId || (editContact as { id?: string })?.id) {
        console.log("Calling handleContactUpdate for contact");
        await handleContactUpdate();
      } else {
        console.log("No valid ID found");
        customToast.error("No project or contact ID provided");
      }
    } catch (error: unknown) {
      console.error("Failed to create update:", error);
      customToast.error((error as { data?: { message?: string } })?.data?.message || "Failed to add update");
    }
  };

  // Get data for rendering
  const projectUpdates = ((projectUpdatesData as { data?: any[] } | undefined)?.data) ?? [];
  const taskUpdates = ((taskUpdatesData as { data?: any[] } | undefined)?.data) ?? [];
  const subtaskUpdates = ((subtaskUpdatesData as { data?: any[] } | undefined)?.data) ?? [];

  const contactUpdates = (contactData as any)?.data?.updates;
  const contactName = (contactData as any)?.data?.createdByName || (editContact as { createdByName?: string })?.createdByName || 'Unknown User';
  const contactCreatedAt = (contactData as any)?.data?.createdAt || (editContact as { createdAt?: string })?.createdAt;
  const contactUpdatedAt = (contactData as any)?.data?.updatedAt || (editContact as { updatedAt?: string })?.updatedAt;

  const isLoading = projectUpdatesLoading || taskUpdatesLoading || subtaskUpdatesLoading || isUpdating || isCreating;

  // Determine which updates to display
  const displayUpdates = isTask ? taskUpdates : isSubtask ? subtaskUpdates : projectUpdates;

  return (
    <div className={`${className} h-full flex flex-col`}>
      <h3 className="font-semibold text-lg">Updates</h3>

      {/* Update via dropdown - keep existing */}
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

      {/* Editor - keep existing */}
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
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-1.5 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#C81C1F" }}
              onClick={handleSubmitUpdate}
              disabled={isLoading || !updateContent.trim()}
            >
              {isLoading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Updates List - Updated to handle task/subtask updates */}
      <div className="mt-5 border border-gray-300 rounded-lg bg-[#4F50510D] p-2 overflow-y-auto max-h-[200px]">
        {/* Task/Subtask Updates (LazyKill) */}
        {(isTask || isSubtask || projectId) && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : displayUpdates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No updates yet. Be the first to add one!</p>
              </div>
            ) : (
              displayUpdates.map((update: any) => (
                <div key={update.id} className="bg-white rounded-lg shadow-sm p-4 mx-5 mt-5 first:mt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                        style={{ backgroundColor: customColor }}
                      >
                        {getInitials(update.createdBy?.firstName, update.createdBy?.lastName)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold">
                          {update.createdBy?.firstName || ''} {update.createdBy?.lastName || ''}
                        </p>
                        <p className="text-xs" style={{ color: customColor }}>
                          {formatDate(update.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">⋮</button>
                  </div>
                  <div
                    className="mt-3 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: update.updateNotes }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Contact Updates (BizAccelerator) - keep existing */}
        {(contactId || (editContact as { id?: string })?.id) && !projectId && (
          <div className="space-y-4">
            {contactUpdates ? (
              <div className="bg-white rounded-lg shadow-sm p-4 mr-5 ml-5 mt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                      style={{ backgroundColor: customColor }}
                    >
                      {getInitials(undefined, undefined, contactName)}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">{contactName}</p>
                      <p className="text-xs" style={{ color: customColor }}>
                        {formatDate(contactUpdatedAt || contactCreatedAt || '')}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">⋮</button>
                </div>
                <p className="mt-3 text-gray-700">{contactUpdates}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No updates yet. Be the first to add one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};