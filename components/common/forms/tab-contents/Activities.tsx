import { Phone, Video, MoreVertical, Clock, Paperclip, User, Mail, CheckSquare, FileText } from "lucide-react";
import { useGetAllActivitiesQuery, Activity } from "@/store/api";
import { format } from "date-fns";
import { IoCall } from "react-icons/io5";

interface Filter {
  id: number;
  activity: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface ActivitiesProps {
  projectId?: string;
  taskId?: string;
  subTaskId?: string;
  filters?: Filter[];
  searchQuery?: string;
}

const Activities = ({ projectId, taskId, subTaskId, filters, searchQuery }: ActivitiesProps) => {
  // Determine the query parameters based on what IDs are provided
  // Priority: subTaskId > taskId > projectId
  const queryParams: any = {
    sort: 'createdAt',
    sortDirection: 'desc',
  };

  // Only add the relevant filter based on context
  if (subTaskId) {
    // If we have a subtask ID, fetch activities for this subtask only
    queryParams.subTaskId = `eq:${subTaskId}`;
    console.log('Fetching activities for subtask:', subTaskId);
  } else if (taskId) {
    // If we have a task ID, fetch activities for this task only
    queryParams.taskId = `eq:${taskId}`;
    console.log('Fetching activities for task:', taskId);
  } else if (projectId) {
    // If we have a project ID, fetch activities for this project only
    queryParams.projectId = `eq:${projectId}`;
    console.log('Fetching activities for project:', projectId);
  }

  // Debug: Log the query parameters
  console.log('Activities component - Query params:', queryParams);
  console.log('Activities component - Current filters:', filters);
  console.log('Activities component - Search query:', searchQuery);

  // Fetch activities from API with the appropriate filter
  const { data, isLoading, isError, error } = useGetAllActivitiesQuery(queryParams);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="relative m-18 flex items-center justify-center p-8">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="relative m-18 flex items-center justify-center p-8">
        <div className="text-red-500">
          Error loading activities: {error && 'data' in error ? JSON.stringify(error.data) : 'Unknown error'}
        </div>
      </div>
    );
  }

  const activities = data?.data?.activities || [];

  // Apply client-side filtering based on activity type and date range
  const filteredActivities = activities.filter((activity: Activity) => {
    // Apply search filter first (if search query exists)
    if (searchQuery && searchQuery.trim() !== '') {
      const searchLower = searchQuery.toLowerCase().trim();
      const titleMatch = activity.title?.toLowerCase().includes(searchLower);
      const descriptionMatch = activity.description?.toLowerCase().includes(searchLower);

      // If neither title nor description match search, exclude this activity
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }

    // If no filters are set, show all activities (that passed search)
    if (!filters || filters.length === 0) return true;

    // Check if all filters are empty (no criteria set in any filter)
    const hasAnyFilterCriteria = filters.some((filter) => {
      return filter.activity !== null || filter.startDate !== null || filter.endDate !== null;
    });

    // If all filters are empty, show all activities (that passed search)
    if (!hasAnyFilterCriteria) return true;

    // Check if activity matches any of the filter conditions
    return filters.some((filter) => {
      // Skip filter if it has no criteria set (no activity type and no dates)
      const hasActivityFilter = filter.activity !== null;
      const hasDateFilter = filter.startDate !== null || filter.endDate !== null;

      // If filter is completely empty, skip it
      if (!hasActivityFilter && !hasDateFilter) {
        return false;
      }

      // Check activity type match
      let typeMatch = true;
      if (hasActivityFilter) {
        typeMatch =
          filter.activity!.toLowerCase() === activity.type.toLowerCase() ||
          (filter.activity === "To Do" && activity.type === "toDo");
      }

      // Check date range match
      let dateMatch = true;
      if (hasDateFilter) {
        const activityDate = new Date(activity.createdAt);

        if (filter.startDate) {
          const startDate = new Date(filter.startDate);
          startDate.setHours(0, 0, 0, 0);
          dateMatch = dateMatch && activityDate >= startDate;
        }

        if (filter.endDate) {
          const endDate = new Date(filter.endDate);
          endDate.setHours(23, 59, 59, 999);
          dateMatch = dateMatch && activityDate <= endDate;
        }
      }

      return typeMatch && dateMatch;
    });
  });

  // Debug: Log filtering results
  console.log('Activities - Total:', activities.length, 'Filtered:', filteredActivities.length);
  console.log('Activities - Context:', { projectId, taskId, subTaskId });

  // Helper function to get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-5 h-5 text-black" />;
      case 'meeting':
        return <Video className="w-5 h-5 text-black" />;
      case 'email':
        return <Mail className="w-5 h-5 text-black" />;
      case 'toDo':
        return <CheckSquare className="w-5 h-5 text-black" />;
      case 'notes':
        return <FileText className="w-5 h-5 text-black" />;
      default:
        return <FileText className="w-5 h-5 text-black" />;
    }
  };

  // Helper function to calculate duration
  const calculateDuration = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const durationMs = toDate.getTime() - fromDate.getTime();
    const durationMin = Math.round(durationMs / 60000);
    return `${durationMin} min`;
  };

  // Show context information
  const getContextInfo = () => {
    if (subTaskId) {
      return "Showing activities for this subtask";
    } else if (taskId) {
      return "Showing activities for this task";
    } else if (projectId) {
      return "Showing activities for this project";
    }
    return "Showing all activities";
  };

  // Show empty state if no activities
  if (filteredActivities.length === 0) {
    return (
      <div className="relative m-18 flex flex-col items-center justify-center p-8">
        <div className="text-gray-500 mb-2">
          {activities.length === 0 ? "No activities found" : "No activities match the current filters"}
        </div>
        <div className="text-sm text-gray-400">
          {getContextInfo()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative m-18 overflow-hidden">
      {/* Context info */}
      <div className="mb-4 text-sm text-gray-500 italic">
        {getContextInfo()} ({filteredActivities.length} activities)
      </div>
      
      {/* Vertical line */}
      <div className="absolute top-10 left-[-20px] h-[calc(100%-40px)] w-[2px] bg-gray-300 overflow-scroll"></div>

      {filteredActivities.map((item: Activity) => {
        const userName = item.assignedTo
          ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
          : item.createdBy
            ? `${item.createdBy.firstName} ${item.createdBy.lastName}`
            : 'Unknown User';

        const userInitial = item.assignedTo?.firstName?.[0] || item.createdBy?.firstName?.[0] || 'U';
        const duration = calculateDuration(item.scheduleTimeFrom, item.scheduleTimeTo);
        const formattedDate = format(new Date(item.createdAt), "dd/MM/yyyy hh:mm a");

        return (
          <div key={item.id} className="relative overflow-hidden mb-6">
            {/* Icon on timeline */}
            <div
              className="absolute -left-[38px] flex items-center justify-center w-8 h-8 rounded-md text-gray-700"
              style={{ backgroundColor: item.status.color || '#f87171' }}
            >
              {getActivityIcon(item.type)}
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-1 p-1">
              <div className="flex items-center gap-2">
                {/* Icon with background */}
                {item.type === 'call' ? (
                  <div className="bg-[#ffcb00] rounded-md p-1.5 flex items-center justify-center">
                    <IoCall className="w-4 h-4 text-white" />
                  </div>
                ) : item.type === 'meeting' ? (
                  <div className="bg-[#888889] rounded-md p-1.5 flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                ) : item.type === 'email' ? (
                  <div className="bg-[#ee443f] rounded-md p-1.5 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                ) : item.type === 'toDo' ? (
                  <div className="bg-[#4e56a6] rounded-md p-1.5 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                ) : item.type === 'notes' ? (
                  <div className="bg-[#9c27b0] rounded-md p-1.5 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                ) : null}

                {/* Text outside icon box */}
                <span className="text-[14px] font-[400] text-black capitalize">
                  {item.type === 'toDo' ? 'To Do' : item.type}
                </span>
              </div>

              <span className="text-sm text-gray-500">{formattedDate}</span>
            </div>

            {/* Card */}
            <div className="relative flex flex-col justify-center">
              <span className="absolute top-0 left-4 w-[1px] h-full bg-gray-300"></span>
              <div className="border flex-1 border-gray-300 hover:border-gray-400 bg-white p-4 shadow-sm ml-8 relative my-2 rounded-[3px]">
                <div className="flex justify-between items-start">
                  {/* Left: User Info */}
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

                  {/* Right: menu */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded bg-gray-400 text-white"
                    >
                      {(() => {
                        const statusRaw = item.status?.statusName ?? '';
                        if (!statusRaw) return '';
                        const words = statusRaw.replace(/[-_]+/g, ' ').split(' ').filter(Boolean);
                        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      })()}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {item.title && (
                  <p className="mt-2 text-[#737B8B] font-[400]">{item.title}</p>
                )}
                {item.description && (
                  <p className="mt-2 text-[#737B8B] font-[400]">{item.description}</p>
                )}

                {/* Documents/Attachments */}
                {item.documents && item.documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {item.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="truncate max-w-md">{doc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Context Information */}
                <div className="mt-3 text-xs text-gray-500">
                  {item.project && (
                    <div>Project: <span className="font-medium">{item.project.name}</span></div>
                  )}
                  {item.taskId && !item.project && (
                    <div>Task Activity</div>
                  )}
                  {item.subTaskId && (
                    <div>Subtask Activity</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Activities;