"use client";

import { useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTask } from "./SortableTask";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import Header from "@/components/common/Header";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/common/Title";
import { useTheme } from "@/store/hooks";
import colors from "@/components/constants/colors";

type Task = { id: string; title: string; status: string };

const initialTasks: Task[] = [
  { id: "1", title: "UI Design Home Page", status: "todo" },
  { id: "2", title: "Build API for Auth", status: "in-progress" },
  { id: "3", title: "Integrate Stripe Payments", status: "review" },
  { id: "4", title: "Deploy to Production", status: "done" },
  { id: "5", title: "Fix Header Alignment", status: "todo" },
  { id: "6", title: "User Research & Analysis", status: "backlog" },
  { id: "7", title: "Database Optimization", status: "in-progress" },
  { id: "8", title: "Mobile Responsive Testing", status: "testing" },
  { id: "9", title: "Documentation", status: "done" },
  { id: "10", title: "Client Feedback Implementation", status: "review" },
];

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100", border: "border-gray-400" },
  { id: "todo", title: "To Do", color: "bg-blue-100", border: "border-blue-400" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-100", border: "border-yellow-400" },
  { id: "review", title: "Review", color: "bg-purple-100", border: "border-purple-400" },
  { id: "testing", title: "Testing", color: "bg-orange-100", border: "border-orange-400" },
  { id: "done", title: "Completed", color: "bg-green-100", border: "border-green-400" },
  { id: "blocked", title: "Blocked", color: "bg-red-100", border: "border-red-400" },
  { id: "cancelled", title: "Cancelled", color: "bg-gray-200", border: "border-gray-500" },
];

export default function KanbanPage() {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState("");

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped on a column
    if (columns.some((c) => c.id === over.id) && over.id !== activeTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, status: over.id } : t
        )
      );
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && overTask.status !== activeTask.status) {
      // Move to different column
      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, status: overTask.status } : t
        )
      );
      return;
    }

    // Reorder within same column
    const sameColTasks = tasks.filter((t) => t.status === activeTask.status);
    const oldIndex = sameColTasks.findIndex((t) => t.id === active.id);
    const newIndex = sameColTasks.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const newColTasks = arrayMove(sameColTasks, oldIndex, newIndex);
      setTasks((prev) =>
        prev.map((t) =>
          t.status === activeTask.status
            ? newColTasks.find((nt) => nt.id === t.id) || t
            : t
        )
      );
    }
  };

  const handleAddTask = (status: string) => {
    if (!newTask.trim()) return;
    const newId = (tasks.length + 1).toString();
    setTasks((prev) => [
      ...prev,
      { id: newId, title: newTask, status },
    ]);
    setNewTask("");
  };

  return (
    <ProtectedRoute>
      <div>
        <div
          className="w-screen h-screen overflow-hidden flex"
          style={{
            backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
          }}
        >
          <Sidebar />
          <div className="flex-1 flex flex-col relative min-w-0 w-full">
            <Header />

            {/* MAIN CONTAINER */}
            <div className="border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative">
              {/* Breadcrumb */}
              <div
                className="border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit"
                style={{
                  borderBottomColor: isDark ? colors.dark.text : undefined,
                }}
              >
                <BreadcrumbsNavBar
                  customItems={[
                    { label: "Project Management", href: "/dashboard" },
                    { label: "Kanban", href: "/dashboard/lazykill/projects/kanban" },
                  ]}
                />
              </div>

              {/* Title & Add Task */}
              <div
                className="flex mx-5 mt-5 px-3 py-2 rounded shadow h-fit bg-gray-800"
                style={{
                  backgroundColor: isDark ? colors.dark.sidebar : undefined,
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    {/* Left side — title */}
                    <Title name="Kanban Board" TitleObj={[]} />

                    {/* Right side — button */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddTask("todo")}
                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                      >
                        ➕ Add Task
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Kanban Board - Horizontally Scrollable */}
              <div className="p-6 overflow-auto flex-1">
                <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                  <div className="flex gap-6 min-w-max pb-4">
                    {columns.map((col) => (
                      <div
                        key={col.id}
                        className={`${col.color} ${col.border} border-2 rounded-xl shadow p-4 flex flex-col w-80 flex-shrink-0`}
                      >
                        <h2 className="font-semibold text-gray-800 text-lg mb-3">
                          {col.title}
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({tasks.filter(t => t.status === col.id).length})
                          </span>
                        </h2>

                        <SortableContext
                          items={tasks.filter((t) => t.status === col.id).map((t) => t.id)}
                          strategy={rectSortingStrategy}
                        >
                          <div className="flex flex-col gap-2 min-h-[150px] flex-1">
                            {tasks
                              .filter((t) => t.status === col.id)
                              .map((task) => (
                                <SortableTask key={task.id} id={task.id} title={task.title} />
                              ))}

                            {/* Empty state */}
                            {tasks.filter((t) => t.status === col.id).length === 0 && (
                              <div className="text-gray-400 text-sm italic text-center py-8">
                                No tasks
                              </div>
                            )}
                          </div>
                        </SortableContext>


                      </div>
                    ))}
                  </div>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}