"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiPlus } from "react-icons/fi";
import { Trash2, Edit, Tag } from "lucide-react";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import Header from "@/components/common/Header";
import BreadcrumbsNavbar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import CreateShift from "@/components/common/forms/CreateShift";
import { useTheme } from "@/store/hooks";
import AssignShiftForm from "@/components/common/forms/AssignShiftForm";
import DeleteConfirmation from "@/components/common/DeleteConfirmation";
import { useDispatch_ } from '@/store';
import {
  shiftApi,
  ShiftAttribute,
  ShiftAttributeAssignment,
  CreateShiftDto,
  AssignShiftDto,
  UpdateShiftAttributeDto
} from '@/store/api_query/bizignite/shift.api';
import { toast } from "react-toastify";
import SearchBar from "../AdvanceSearch/SearchBar";
import { FaSlidersH } from "react-icons/fa";
import Image from "next/image";
import FilterIcon from '@/assests/filter-icon.png'
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import AdvancedFilter, { FilterCondition } from "../Filter/AddFilter";

interface ApiShift {
  id: string;
  shiftAttributes: ShiftAttribute[];
}

type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  gracePeriodMinutes: number;
  assignedUser?: { id: string; name: string; email: string; assignmentId: string; }[];
  shiftAttributeId?: string;
};

export default function ShiftPage() {
  const { isDark, colors } = useTheme();
  const dispatch = useDispatch_();

  // State management
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteType, setDeleteType] = useState<'shift' | 'assignment'>('shift');
  const [assignmentToDelete, setAssignmentToDelete] = useState<{ assignmentId: string, shiftId: string } | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState<Shift[]>([]);

  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
  const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [openFilter, setOpenFilter] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['name']);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // RTK Query hooks
  const [createShiftMutation] = shiftApi.useCreateShiftMutation();
  const [updateShiftMutation] = shiftApi.useUpdateShiftMutation();
  const [deleteShiftMutation] = shiftApi.useDeleteShiftMutation();
  const [assignShiftMutation] = shiftApi.useAssignShiftMutation();
  const [deleteShiftAssignmentMutation] = shiftApi.useDeleteShiftAssignmentMutation();
  const [updateShiftAttributeMutation] = shiftApi.useUpdateShiftAttributeMutation();
  // Load shifts on component mount
  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    setLoading(true);
    try {
      console.log("Loading shifts...");

      const result = await dispatch(
        shiftApi.endpoints.getAllShifts.initiate({})
      ).unwrap();

      console.log("Shifts API Response:", result);

      if (result?.data) {
        const transformedShifts = result.data.flatMap((apiShift: ApiShift) => {
          if (!apiShift.shiftAttributes || !Array.isArray(apiShift.shiftAttributes)) {
            console.warn("Shift missing shiftAttributes:", apiShift);
            return [];
          }

          return apiShift.shiftAttributes.map((attr: ShiftAttribute) => {
            // Extract numeric values from breakDuration and gracePeriodMinutes
            const breakDurationNum = attr.breakDuration ?
              (typeof attr.breakDuration === 'string' ? parseInt(attr.breakDuration) : attr.breakDuration) : 0;

            const gracePeriodMinutesNum = attr.gracePeriodMinutes ?
              (typeof attr.gracePeriodMinutes === 'string' ? parseInt(attr.gracePeriodMinutes) : attr.gracePeriodMinutes) : 0;

            console.log("Raw API times for", attr.shiftName, ":", {
              startTime: attr.startTime,
              endTime: attr.endTime
            });

            // Parse times to 12-hour format with AM/PM
            const parseTimeTo12Hour = (timeString: string | Date) => {
              if (!timeString) return "N/A";

              try {
                // If it's an ISO string, extract time manually
                if (typeof timeString === 'string' && timeString.includes('T')) {
                  const timePart = timeString.split('T')[1]; // Get "18:30:00.000Z"
                  const [hoursStr, minutesStr] = timePart.split(':');

                  let hours = parseInt(hoursStr, 10);
                  const minutes = parseInt(minutesStr, 10);

                  // Convert to 12-hour format
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12;
                  hours = hours ? hours : 12; // the hour '0' should be '12'

                  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                }

                // Fallback to Date object parsing
                const date = new Date(timeString);
                if (isNaN(date.getTime())) return "N/A";

                let hours = date.getHours();
                const minutes = date.getMinutes();

                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;

                return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

              } catch (error) {
                console.error("Error parsing time:", timeString, error);
                return "N/A";
              }
            };

            const startTime12 = parseTimeTo12Hour(attr.startTime);
            const endTime12 = parseTimeTo12Hour(attr.endTime);

            console.log("Parsed 12-hour times for", attr.shiftName, ":", {
              startTime12,
              endTime12,
              rawStart: attr.startTime,
              rawEnd: attr.endTime
            });

            return {
              id: apiShift.id,
              shiftAttributeId: attr.id,
              name: attr.shiftName,
              startTime: startTime12, // Now in 12-hour format (hh:mm AM/PM)
              endTime: endTime12,     // Now in 12-hour format (hh:mm AM/PM)
              breakDuration: breakDurationNum,
              gracePeriodMinutes: gracePeriodMinutesNum,
              assignedUser: attr.assignments?.map((assignment: ShiftAttributeAssignment) => ({
                id: assignment.assignedUserId,
                name: assignment.assignedUser?.user?.email?.split('@')[0] || `User ${assignment.assignedUserId}`,
                email: assignment.assignedUser?.user?.email || '',
                assignmentId: assignment.id
              })) || []
            };
          });
        });

        console.log("Transformed shifts (12-hour format):", transformedShifts);
        setShifts(transformedShifts);
        setFilteredItems(transformedShifts);
      } else {
        console.warn("No data in response, setting empty shifts");
        setShifts([]);
        setFilteredItems([]);
      }
    } catch (error: unknown) {
      console.error("Error loading shifts:", error);
      toast.error("Failed to load shifts. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    if (!shifts || shifts.length === 0) {
      setFilteredItems([]);
      return;
    }

    let filtered = [...shifts];

    // Apply advanced filters
    if (advancedFilters && advancedFilters.length > 0) {
      filtered = applyAdvancedFilters(advancedFilters, filtered);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = applySearch(searchTerm, selectedColumns, filtered);
    }

    setFilteredItems(filtered);
    setPage(1); // Reset to first page when filters change
  }, [shifts, advancedFilters, searchTerm, selectedColumns]);

  // Apply advanced filters
  const applyAdvancedFilters = (filters: FilterCondition[], data: Shift[]): Shift[] => {
    return data.filter(shift => {
      return filters.every(filter => {
        if (!filter.field || !filter.operator || !filter.value) return true;

        const fieldValue = shift[filter.field as keyof Shift];
        if (fieldValue === undefined) return false;

        const stringValue = String(fieldValue).toLowerCase();
        const filterValue = filter.value.toLowerCase();

        switch (filter.operator) {
          case 'eq': // equals
            return stringValue === filterValue;
          case 'ne': // not equals
            return stringValue !== filterValue;
          case 'cn': // contains
            return stringValue.includes(filterValue);
          case 'nc': // not contains
            return !stringValue.includes(filterValue);
          case 'sw': // starts with
            return stringValue.startsWith(filterValue);
          case 'ew': // ends with
            return stringValue.endsWith(filterValue);
          default:
            return true;
        }
      });
    });
  };

  // Apply search
  const applySearch = (term: string, columns: string[], data: Shift[]): Shift[] => {
    if (!term.trim() || columns.length === 0) return data;

    const lowerTerm = term.toLowerCase();

    return data.filter(shift =>
      columns.some(col => {
        const value = shift[col as keyof Shift];
        return value && String(value).toLowerCase().includes(lowerTerm);
      })
    );
  };

  // Pagination
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, page, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  // Filter handlers
  const handleAdvancedFilterClose = useCallback(() => {
    setOpenFilter(false);
    setFilterAnchorEl(null);
  }, []);

  const handleApplyAdvancedFilters = useCallback((filters: FilterCondition[], queryParams: Record<string, string>) => {
    console.log("Applied filters:", filters);
    setAdvancedFilters(filters);
    setAdvancedFilterParams(queryParams);
  }, []);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
    setOpenFilter(true);
  };

  // Search handler
  const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
    setSearchTerm(term);
    setSelectedColumns(columns);
  }, []);

  const handleAssignShift = () => setShowAssignForm(true);

  // Dynamic shift list for dropdown - ensure it has proper IDs
  const dynamicShiftList = shifts.map((s) => ({
    label: s.name,
    value: s.shiftAttributeId || s.id,
    icon: <Tag className="w-4 h-4 text-gray-500" />,
  }));

  // Add this to debug your shift list
  console.log("Available shifts for assignment:", dynamicShiftList);

  const handleCreateShift = () => {
    setShowCreateForm(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.shift-popup-content') && !target.closest('.shift-user-count')) {
        setActiveShift(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create or Update Shift
  const handleShiftSubmit = async (data: {
    id?: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    breakDuration: number;
    gracePeriodMinutes: number;
  }) => {
    setCreateLoading(true);
    try {
      console.log("Creating/updating shift with data:", data);
      console.log("Original editShift:", editShift);

      // For UPDATE - Only update the fields that were actually changed
      if (data.id && editShift?.shiftAttributeId) {
        // Convert editShift times to same format as data for comparison
        const convertToComparableTime = (timeString: string) => {
          // If time is in 12-hour format with AM/PM, convert to 24-hour
          if (timeString.includes('AM') || timeString.includes('PM')) {
            const [time, modifier] = timeString.split(' ');
            let [hours, minutes] = time.split(':');

            if (modifier === 'PM' && hours !== '12') {
              hours = (parseInt(hours, 10) + 12).toString();
            } else if (modifier === 'AM' && hours === '12') {
              hours = '00';
            }
            return `${hours.padStart(2, '0')}:${minutes}`;
          }
          return timeString; // Already in 24-hour format
        };

        // Convert original times for proper comparison
        const originalStartTime = convertToComparableTime(editShift.startTime);
        const originalEndTime = convertToComparableTime(editShift.endTime);

        console.log("Time comparison:", {
          originalStartTime,
          newStartTime: data.startTime,
          originalEndTime,
          newEndTime: data.endTime,
          startTimeChanged: originalStartTime !== data.startTime,
          endTimeChanged: originalEndTime !== data.endTime
        });

        // Create update data with only the fields that are different from original
        const updateData: UpdateShiftAttributeDto = {};

        // Compare each field and only include if changed
        if (data.shiftName !== editShift.name) {
          updateData.shiftName = data.shiftName;
          console.log("Shift name changed:", editShift.name, "->", data.shiftName);
        }

        if (originalStartTime !== data.startTime) {
          const today = new Date().toISOString().split('T')[0];
          updateData.startTime = `${today}T${data.startTime}:00.000Z`;
          console.log("Start time changed:", originalStartTime, "->", data.startTime);
        }

        if (originalEndTime !== data.endTime) {
          const today = new Date().toISOString().split('T')[0];
          const [startHours, startMinutes] = data.startTime.split(':').map(Number);
          const [endHours, endMinutes] = data.endTime.split(':').map(Number);

          let endDate = today;
          if (endHours < startHours || (endHours === startHours && endMinutes < startMinutes)) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            endDate = tomorrow.toISOString().split('T')[0];
          }
          updateData.endTime = `${endDate}T${data.endTime}:00.000Z`;
          console.log("End time changed:", originalEndTime, "->", data.endTime);
        }

        if (data.breakDuration !== editShift.breakDuration) {
          updateData.breakDuration = data.breakDuration;
          console.log("Break duration changed:", editShift.breakDuration, "->", data.breakDuration);
        }

        if (data.gracePeriodMinutes !== editShift.gracePeriodMinutes) {
          updateData.gracePeriodMinutes = data.gracePeriodMinutes;
          console.log("Grace period changed:", editShift.gracePeriodMinutes, "->", data.gracePeriodMinutes);
        }

        // Always include description and color if shift name changed
        if (data.shiftName !== editShift.name) {
          updateData.description = `${data.shiftName} shift`;
        }
        updateData.color = "#3B82F6";
        updateData.isActive = true;

        console.log("Final Update Data Being Sent:", updateData);

        // If no fields were changed (only color and isActive), show message and return
        const meaningfulFields = Object.keys(updateData).filter(key =>
          !['color', 'isActive'].includes(key)
        );

        if (meaningfulFields.length === 0) {
          toast.info("No changes detected.");
          setShowCreateForm(false);
          setEditShift(null);
          return;
        }

        // updateShiftAttribute mutation with correct parameters
        const result = await dispatch(
          shiftApi.endpoints.updateShiftAttribute.initiate({
            shiftAttributeId: editShift.shiftAttributeId!,
            updateData: updateData
          })
        ).unwrap();

        console.log("Shift attribute updated successfully:", result);
        toast.success("Shift updated successfully!");

      } else {
        // CREATE new shift 
        const today = new Date().toISOString().split('T')[0];

        // Handle new shift creation
        const [startHours, startMinutes] = data.startTime.split(':').map(Number);
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);

        let endDate = today;
        if (endHours < startHours || (endHours === startHours && endMinutes < startMinutes)) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          endDate = tomorrow.toISOString().split('T')[0];
        }

        const shiftData: CreateShiftDto = {
          shiftAttributes: [
            {
              shiftName: data.shiftName,
              startTime: `${today}T${data.startTime}:00.000Z`,
              endTime: `${endDate}T${data.endTime}:00.000Z`,
              breakDuration: data.breakDuration.toString(),
              gracePeriodMinutes: data.gracePeriodMinutes.toString(),
              description: `${data.shiftName} shift`,
              color: "#3B82F6"
            }
          ]
        };

        const result = await dispatch(
          shiftApi.endpoints.createShift.initiate(shiftData)
        ).unwrap();

        console.log("Shift created successfully:", result);
        toast.success("Shift created successfully!");
      }

      setShowCreateForm(false);
      setEditShift(null);
      await loadShifts();

    } catch (error: any) {
      console.error("Error creating/updating shift:", error);

      if (error.data?.message) {
        toast.error(`Failed to ${data.id ? 'update' : 'create'} shift: ${error.data.message}`);
      } else {
        toast.error(`Failed to ${data.id ? 'update' : 'create'} shift. Please try again.`);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // Assign Shift function
  const handleAssignSubmit = async (data: {
    shiftName: string;
    startDate: string;
    endDate: string;
    assigneeUsers: string[];
  }) => {
    setCreateLoading(true);
    try {
      console.log("Assigning shift with data:", data);
      console.log("Available shifts:", dynamicShiftList);

      if (dynamicShiftList.length === 0) {
        toast.error("No shifts available for assignment. Please create a shift first.");
        return;
      }

      const selectedShift = dynamicShiftList.find(shift => shift.label === data.shiftName);
      if (!selectedShift) {
        toast.error(`Error: Shift "${data.shiftName}" not found.`);
        return;
      }

      if (!selectedShift.value) {
        toast.error("Error: Invalid shift ID. Please select a different shift.");
        return;
      }

      // Get existing users for this shift
      const existingShift = shifts.find(s => s.shiftAttributeId === selectedShift.value);
      const existingUserIds = existingShift?.assignedUser?.map(u => u.id) || [];

      // Combine existing + new users, flatten in case nested, and remove duplicates
      const allUserIds = [...new Set([...existingUserIds, ...data.assigneeUsers].flat())];

      console.log("User assignment:", {
        existingUsers: existingUserIds,
        newUsers: data.assigneeUsers,
        allUsers: allUserIds
      });

      const assignData: AssignShiftDto = {
        shiftAttributeId: selectedShift.value,
        assignedUserIds: allUserIds
      };

      console.log("Sending assignment data:", assignData);

      const result = await assignShiftMutation(assignData).unwrap();
      console.log("Shift assignment successful:", result);

      await loadShifts();
      setShowAssignForm(false);
      toast.success("Users assigned to shift successfully!");

    } catch (error: any) {
      console.error("Error assigning shift:", error);
      if (error.status === 404) {
        toast.error("Shift not found. Please refresh and try again.");
      } else {
        toast.error("Failed to assign shift. Please try again.");
      }
    } finally {
      setCreateLoading(false);
    }
  };


  const handleEdit = (shift: Shift) => {
    const convertTo24Hour = (timeString: string) => {
      if (timeString.includes('AM') || timeString.includes('PM')) {
        const [time, modifier] = timeString.split(' ');
        let [hours, minutes] = time.split(':');

        if (modifier === 'PM' && hours !== '12') {
          hours = (parseInt(hours, 10) + 12).toString();
        } else if (modifier === 'AM' && hours === '12') {
          hours = '00';
        }
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      return timeString; // 24-hour format
    };

    setEditShift({
      ...shift,
      startTime: shift.startTime.includes('AM') || shift.startTime.includes('PM')
        ? convertTo24Hour(shift.startTime)
        : shift.startTime,
      endTime: shift.endTime.includes('AM') || shift.endTime.includes('PM')
        ? convertTo24Hour(shift.endTime)
        : shift.endTime
    });
    setShowCreateForm(true);
  };
  // component to debug the edit process
  useEffect(() => {
    if (editShift) {
      console.log("Editing shift:", editShift);
      console.log("Shift ID:", editShift.id);
      console.log("Shift Attribute ID:", editShift.shiftAttributeId);
    }
  }, [editShift]);
  // Remove user from shift
  const handleRemoveUser = (shiftId: string, assignmentId: string) => {
    if (!assignmentId) {
      console.error("No assignment ID provided");
      toast.error("Error: Assignment ID is missing");
      return;
    }
    setAssignmentToDelete({ assignmentId, shiftId });
    setDeleteType('assignment');
    setShowDeleteModal(true);
  };

  // Delete Shift function
  const handleDeleteShift = async (shiftId: string) => {
    try {
      console.log("Deleting shift with ID:", shiftId);
      setActionLoading(shiftId);

      await deleteShiftMutation(shiftId).unwrap();
      console.log("Shift deleted successfully");
      await loadShifts();

    } catch (error: unknown) {
      console.error("Error deleting shift:", error);
      toast.error("Failed to delete shift");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Assignment function
  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteShiftAssignmentMutation(assignmentId).unwrap();
      console.log("Assignment deleted successfully");
      await loadShifts();
    } catch (error: unknown) {
      console.error("Error deleting assignment:", error);
      throw error;
    }
  };

  // Confirm Delete function
  const handleConfirmDelete = async () => {
    if (!shiftToDelete && !assignmentToDelete) {
      return;
    }

    try {
      if (deleteType === 'shift' && shiftToDelete) {
        await handleDeleteShift(shiftToDelete);
      } else if (deleteType === 'assignment' && assignmentToDelete) {
        await handleDeleteAssignment(assignmentToDelete.assignmentId);
      }

      toast.success(`${deleteType === 'shift' ? 'Shift' : 'User assignment'} deleted successfully!`);

    } catch (error) {
      console.error("Error during deletion:", error);
      toast.error(`Failed to delete ${deleteType === 'shift' ? 'shift' : 'assignment'}`);
    } finally {
      setShowDeleteModal(false);
      setShiftToDelete(null);
      setAssignmentToDelete(null);
      setActiveShift(null);
    }
  };

  const projectTitleBtn = [
    {
      name: "Create Shift",
      icon: <FiPlus />,
      onClick: () => handleCreateShift()
    },
    {
      name: "Assign Shift",
      icon: <FiPlus />,
      onClick: () => handleAssignShift()
    },
  ];

  // Full screen loading state for initial load
  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden flex" style={{ backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg }}>
        <Sidebar />
        <div className="flex-1 flex flex-col relative min-w-0 w-full">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <div className="text-lg">Loading shifts...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden flex"
      style={{ backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0 w-full">
        <Header />

        {/* Overlay loading for create operation */}
        {createLoading && (
          <div className="absolute inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-lg">Loading...</div>
            </div>
          </div>
        )}

        <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>

          <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
            <BreadcrumbsNavBar
              customItems={[
                { label: 'Biz Ignite', href: '/dashboard' },
                { label: 'Shift', href: '/biz-ignite/shift' },

              ]}
            />
          </div>
          <div
            className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
            style={{
              backgroundColor: isDark ? colors.dark.sidebar : undefined
            }}
          >
            <Title projectTitleObj={projectTitleBtn} name="Shift" />
          </div>
          {/* <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 flex justify-end items-center h-fit' style={{
            backgroundColor: isDark ? colors.dark.sidebar : undefined
          }}> */}
          {/*  <div className="flex items-center justify-center gap-1">*/}

          {/* Add Search Bar */}
          {/*
              <SearchBar
                model="shift"
                onSearch={handleSearch}
                placeholder="Search shifts..."
                defaultSelectedColumns={['name']}
                defaultOperator="cn"
                showOperatorSelector={false}
                className="flex-shrink-0"
              />
*/}
          {/* Add Filters Button */}
          {/*  <button
                onClick={handleFilterClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                title="Advanced Filters"
              >
                <Image src={FilterIcon} alt="Filters" width={16} height={16} />
                <span>Filters</span></button>

            </div> */}
          {/* </div> */}
          {/* CreateShift Modal */}
          <CreateShift
            open={showCreateForm}
            onClose={() => {
              setShowCreateForm(false);
              setEditShift(null);
            }}
            initialValues={editShift ? {
              id: editShift.id,
              shiftName: editShift.name,
              startTime: editShift.startTime,
              endTime: editShift.endTime,
              breakDuration: editShift.breakDuration,
              gracePeriodMinutes: editShift.gracePeriodMinutes,
            } : undefined}
            onSubmit={handleShiftSubmit}
          />

          {/* Assign Shift Modal */}
          <AssignShiftForm
            open={showAssignForm}
            onClose={() => setShowAssignForm(false)}
            onSubmit={handleAssignSubmit}
            shiftList={dynamicShiftList}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmation
            open={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setShiftToDelete(null);
              setAssignmentToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
          />

          <div className="p-5">

            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {shifts.length === 0
                  ? "No shifts found. Create your first shift to get started."
                  : "No shifts match your current filters. Try adjusting your search or filters."}
              </div>
            ) : (
              <table className="min-w-full text-left border-collapse shadow-sm">
                <thead>
                  <tr style={{ backgroundColor: "#656462", color: "white" }}>
                    <th className="px-3 border-r border-gray-300 text-sm h-[35px]">Shift Name</th>
                    <th className="px-3 border-r border-gray-300 text-sm h-[35px]">Start Time</th>
                    <th className="px-3 border-r border-gray-300 text-sm h-[35px]">End Time</th>
                    <th className="px-3 border-r border-gray-300 text-sm h-[35px]">Break Time</th>
                    <th className="px-3 border-r border-gray-300 text-sm h-[35px]">Grace Period</th>
                    <th className="px-3 border-r border-gray-300 text-sm h-[35px]">Assigned Users</th>
                    <th className="px-3 text-center h-[35px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((s, i) => (
                    <tr
                      key={`${s.id}-${s.shiftAttributeId}`}
                      className={`
                        ${i % 2 === 0 ? "bg-white" : "bg-blue-50"}
                        hover:bg-gray-100 text-gray-800 transition-colors duration-150
                      `}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      {/* Shift Name */}
                      <td className="px-3 h-[30px] border-r border-gray-300 text-sm capitalize">
                        <span
                          className={`px-3 border rounded text-sm font-semibold`}
                          style={{
                            ...(s.name.toLowerCase().includes("day")
                              ? {
                                backgroundColor: "#fff7e6",
                                borderColor: "#f5d48a",
                                color: "#d48a00",
                              }
                              : s.name.toLowerCase().includes("night")
                                ? {
                                  backgroundColor: "#e6f2ff",
                                  borderColor: "#8ec7f7",
                                  color: "#0070d4",
                                }
                                : {
                                  backgroundColor: "#f5f5f5",
                                  borderColor: "#d1d5db",
                                  color: "#374151",
                                }),
                          }}
                        >
                          {s.name}
                        </span>
                      </td>
                      {/* Other Columns */}
                      <td className="px-3 h-[30px] border-r border-gray-300 text-sm">{s.startTime}</td>
                      <td className="px-3 h-[30px] border-r border-gray-300 text-sm">{s.endTime}</td>
                      <td className="px-3 h-[30px] border-r border-gray-300 text-sm">{s.breakDuration}</td>
                      <td className="px-3 h-[30px] border-r border-gray-300 text-sm">{s.gracePeriodMinutes}</td>
                      <td className="px-3 h-[30px] border-r border-gray-300 text-sm relative">
                        <span
                          className="cursor-pointer hover:text-blue-600 transition-colors shift-user-count"
                          onClick={() => {
                            if (activeShift?.id === s.id && activeShift?.shiftAttributeId === s.shiftAttributeId) {
                              setActiveShift(null);
                            } else {
                              setActiveShift(s);
                            }
                          }}
                        >
                          {s.assignedUser && s.assignedUser.length > 0
                            ? `${s.assignedUser.length} User${s.assignedUser.length > 1 ? "s" : ""}`
                            : "No Users"}
                        </span>

                        {/* Inline Popup */}
                        {activeShift?.id === s.id && activeShift?.shiftAttributeId === s.shiftAttributeId && (
                          <div className="absolute left-0 mt-1 w-72 bg-white border shadow-lg rounded z-10 p-3 shift-popup-content">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-sm font-semibold">Assigned Users</div>
                              <button
                                onClick={() => setActiveShift(null)}
                                className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            {s.assignedUser && s.assignedUser.length > 0 ? (
                              <ul className="space-y-2 max-h-48 overflow-auto">
                                {s.assignedUser.map((u) => (
                                  <li
                                    key={u.id}
                                    className="flex justify-between items-center border px-2 py-1 rounded"
                                  >
                                    <div>
                                      <div className="font-medium">{u.name}</div>
                                      <div className="text-xs text-gray-500">{u.email}</div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        u.assignmentId && handleRemoveUser(s.id, u.assignmentId);
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                      title="Remove user"
                                      disabled={!u.assignmentId}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-sm">No users assigned to this shift.</p>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Action Buttons */}
                      <td className="px-3 h-[30px] text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => {
                              setShiftToDelete(s.id);
                              setDeleteType('shift');
                              setShowDeleteModal(true);
                            }}
                            className="p-1 rounded hover:bg-gray-50 cursor-pointer text-gray-500 transition-colors"
                            title="Delete Shift"
                            disabled={actionLoading === s.id}
                          >
                            {actionLoading === s.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>

                          <button
                            onClick={() => handleEdit(s)}
                            title="Edit Shift"
                            className="p-1 rounded hover:bg-gray-50 cursor-pointer text-gray-500 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AdvancedFilter
        modelType="shift"
        anchorEl={filterAnchorEl}
        open={openFilter}
        onClose={handleAdvancedFilterClose}
        onApplyFilters={handleApplyAdvancedFilters}
        initialFilters={advancedFilters}
        title="Advanced shift Filters"
      />
    </div>
  );
}