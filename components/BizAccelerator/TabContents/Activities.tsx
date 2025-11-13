import React, { useEffect } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  Clock,
  Paperclip,
  Mail,
  CheckSquare,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { IoCall } from "react-icons/io5";

/* --------------  TYPES  -------------- */
interface Filter {
  id: number;
  activity: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Activity {
  id: string;
  type: string;
  subject?: string;
  description?: string;
  status: string;
  priority?: string;
  duration?: number;
  location?: string;
  scheduledAt?: string;
  createdAt: string;
  assignedTo?: User;
  createdBy?: string;
  filesLinks?: string[];
}

interface ActivitiesProps {
  activitiesData?: Activity[];
  activitiesLoading?: boolean;
  filters?: Filter[];
  searchQuery?: string;
  highlightActivityId?: string;
}

/* --------------  COMPONENT  -------------- */
const Activities: React.FC<ActivitiesProps> = ({
  activitiesData,
  activitiesLoading,
  filters,
  searchQuery,
  highlightActivityId,
}) => {
  const displayedActivities = activitiesData || [];

  // Ensure hooks run before any early returns
  useEffect(() => {
    if (highlightActivityId) {
      const el = document.getElementById(`activity-${highlightActivityId}`);
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {}
      }
    }
  }, [highlightActivityId]);

  if (activitiesLoading) {
    return <div className="text-center p-8">Loading activities...</div>;
  }

  /* --------------  FILTERING LOGIC  -------------- */
  const filteredActivities = displayedActivities.filter((activity) => {
    // Search filter
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const subjectMatch = activity.subject?.toLowerCase().includes(q);
      const descriptionMatch = activity.description?.toLowerCase().includes(q);
      const typeMatch = activity.type?.toLowerCase().includes(q);

      if (!subjectMatch && !descriptionMatch && !typeMatch) return false;
    }

    // No filters
    if (!filters || filters.length === 0) return true;

    const hasCriteria = filters.some(
      (f) => f.activity !== null || f.startDate !== null || f.endDate !== null
    );
    if (!hasCriteria) return true;

    // Any filter matches
    return filters.some((f) => {
      const hasType = f.activity !== null;
      const hasDate = f.startDate !== null || f.endDate !== null;

      if (!hasType && !hasDate) return false;

      let typeMatch = true;
      if (hasType) {
        typeMatch =
          f.activity!.toLowerCase() === activity.type?.toLowerCase() ||
          (f.activity === "To Do" && activity.type === "toDo");
      }

      let dateMatch = true;
      if (hasDate) {
        const actDate = new Date(activity.createdAt || activity.scheduledAt || '');
        if (f.startDate) {
          const start = new Date(f.startDate);
          start.setHours(0, 0, 0, 0);
          dateMatch = dateMatch && (actDate >= start);
        }
        if (f.endDate) {
          const end = new Date(f.endDate);
          end.setHours(23, 59, 59, 999);
          dateMatch = dateMatch && (actDate <= end);
        }
      }
      return typeMatch && dateMatch;
    });
  });

  

  /* --------------  HELPERS  -------------- */
  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "call":
        return <Phone className="w-5 h-5 text-black" />;
      case "meeting":
        return <Video className="w-5 h-5 text-black" />;
      case "email":
        return <Mail className="w-5 h-5 text-black" />;
      case "todo":
        return <CheckSquare className="w-5 h-5 text-black" />;
      case "notes":
        return <FileText className="w-5 h-5 text-black" />;
      default:
        return <FileText className="w-5 h-5 text-black" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#10b981";
      case "in_progress":
        return "#f59e0b";
      case "planned":
        return "#6366f1";
      case "cancelled":
        return "#ef4444";
      case "scheduled":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const formatStatusText = (status: string) => {
    return status
      ?.replace(/[-_]+/g, " ")
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  /* --------------  RENDER  -------------- */
  if (filteredActivities.length === 0) {
    return (
      <div className="relative m-18 flex items-center justify-center p-8">
        <div className="text-gray-500">
          {displayedActivities.length === 0 ? "No activities found" : "No activities match the current filters"}
        </div>
      </div>
    );
  }

  return (
    <div className="relative m-18 overflow-hidden">
      {/* Debug: Show raw data */}
      {/* <div className="text-xs bg-yellow-100 p-2 mb-4">
        Debug: {displayedActivities.length} activities loaded
        <pre>{JSON.stringify(displayedActivities[0], null, 2)}</pre>
      </div> */}

      {/* vertical line */}
      <div className="absolute top-0 left-[-20px] h-full w-[2px] bg-gray-300" />

      {filteredActivities.map((item) => {
        const highlighted = highlightActivityId === item.id;
        const userName = item.assignedTo
          ? `${item.assignedTo.firstName || ''} ${item.assignedTo.lastName || ''}`.trim()
          : item.createdBy
            ? "System User"
            : "Unknown User";

        const userInitial = item.assignedTo?.firstName?.[0] || item.createdBy?.[0] || "U";
        const duration = item.duration ? `${item.duration} min` : "N/A";
        const formattedDate = format(new Date(item.createdAt || item.scheduledAt || ''), "dd/MM/yyyy hh:mm a");
        const statusColor = getStatusColor(item.status);

        return (
          <div key={item.id} id={`activity-${item.id}`} className="relative overflow-hidden mb-6">
            {/* timeline icon */}
            <div
              className="absolute -left-[38px] flex items-center justify-center w-8 h-8 rounded-md text-gray-700 bg-white border border-gray-300"
              style={{ backgroundColor: statusColor }}
            >
              {getActivityIcon(item.type)}
            </div>

            {/* header */}
            <div className="flex justify-between items-center mb-1 p-1">
              <div className="flex items-center gap-2">
                {/* coloured icon box */}
                {item.type?.toLowerCase() === "call" ? (
                  <div className="bg-[#ffcb00] rounded-md p-1.5 flex items-center justify-center">
                    <IoCall className="w-4 h-4 text-white" />
                  </div>
                ) : item.type?.toLowerCase() === "meeting" ? (
                  <div className="bg-[#888889] rounded-md p-1.5 flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                ) : item.type?.toLowerCase() === "email" ? (
                  <div className="bg-[#ee443f] rounded-md p-1.5 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                ) : item.type?.toLowerCase() === "todo" ? (
                  <div className="bg-[#4e56a6] rounded-md p-1.5 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                ) : item.type?.toLowerCase() === "notes" ? (
                  <div className="bg-[#9c27b0] rounded-md p-1.5 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="bg-gray-500 rounded-md p-1.5 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                )}

                <span className="text-[14px] font-[400] text-black capitalize">
                  {item.type?.toLowerCase() === "todo" ? "To Do" : item.type?.toLowerCase()}
                </span>
              </div>

              <span className="text-sm text-gray-500">{formattedDate}</span>
            </div>

            {/* card */}
            <div className="relative flex flex-col justify-center">
              <span className="absolute top-0 left-4 w-[1px] h-full bg-gray-300" />
              <div className={("border flex-1 bg-white p-4 shadow-sm ml-8 relative my-2 rounded-[3px] " + (highlighted ? "pulse-red-outline border-gray-300" : "border-gray-300 hover:border-gray-400"))}>
                <div className="flex justify-between items-start">
                  {/* left: user */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold uppercase">
                      {userInitial}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{userName}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {duration}
                      </div>
                    </div>
                  </div>

                  {/* right: status */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded text-white"
                      style={{ backgroundColor: statusColor }}
                    >
                      {formatStatusText(item.status)}
                    </span>
                  </div>
                </div>

                {/* subject as title */}
                {item.subject && (
                  <p className="mt-2 text-gray-800 font-[500]">{item.subject}</p>
                )}

                {/* description */}
                {item.description && (
                  <p className="mt-2 text-[#737B8B] font-[400]">{item.description}</p>
                )}

                {/* location */}
                {item.location && (
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>Location:</strong> {item.location}
                  </p>
                )}

                {/* scheduled time */}
                {item.scheduledAt && (
                  <p className="mt-1 text-sm text-gray-600">
                    <strong>Scheduled:</strong> {format(new Date(item.scheduledAt), "MMM d, yyyy 'at' hh:mm a")}
                  </p>
                )}

                {/* priority */}
                {item.priority && (
                  <p className="mt-1 text-sm text-gray-600">
                    <strong>Priority:</strong>
                    <span className="capitalize"> {item.priority.toLowerCase()}</span>
                  </p>
                )}

                {/* attachments placeholder */}
                {item.filesLinks && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Paperclip className="w-4 h-4" />
                    <span>Has attached files / links</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Activities;