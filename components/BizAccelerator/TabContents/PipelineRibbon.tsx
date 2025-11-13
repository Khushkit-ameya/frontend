"use client";

import React, { useState, useEffect } from "react";

interface StageMetadata {
  [key: string]: string | number | boolean | null | undefined;
}
interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  isActive: boolean;
  probability?: number | null;
  metadata: Record<string, unknown>;
}

interface PipelineRibbonProps {
  leadId?: string;
  currentStatus?: string;
  onStatusChange?: (statusId: string) => void;
  initialStep?: number;
  onStepChange?: (index: number, statusId: string) => void;
  stages: Stage[];
}

export const PipelineRibbon: React.FC<PipelineRibbonProps> = ({
  leadId,
  currentStatus,
  onStatusChange,
  initialStep = 0,
  onStepChange,
  stages, // <-- No more API call
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [leadStatus, setLeadStatus] = useState<"won" | "paused" | "reopen" | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Set current step based on current status
  useEffect(() => {
    if (stages.length > 0 && currentStatus) {
      const statusIndex = stages.findIndex((stage) => stage.id === currentStatus);
      if (statusIndex !== -1) {
        setCurrentStep(statusIndex);
      }
    }
  }, [stages, currentStatus]);

  useEffect(() => {
    if (currentStep === stages.length - 1 && !leadStatus) {
      setIsCompleted(true);
    } else if (currentStep < stages.length - 1 && isCompleted) {
      setIsCompleted(false);
    }
  }, [currentStep, stages.length, leadStatus, isCompleted]);

  const handleClick = (index: number) => {
    if (leadStatus === "won" || leadStatus === "paused") return;

    const newStep = index;
    setCurrentStep(newStep);

    const statusId = stages[newStep]?.id;
    if (statusId) {
      onStepChange?.(newStep, statusId);
      onStatusChange?.(statusId);
    }
  };

  const handleStatusChange = (status: "won" | "paused") => {
    setLeadStatus(status);
    setIsCompleted(false);
    setCurrentStep(stages.length - 1);
    console.log(`Lead ${leadId} marked as ${status}`);
  };

  const handleReopen = () => {
    setLeadStatus(null);
    setIsCompleted(false);
    setCurrentStep(0);
    const firstStageId = stages[0]?.id;
    if (firstStageId) {
      onStatusChange?.(firstStageId);
    }
  };

  const leadData = {
    company: "Microsoft",
    title: "COO",
    email: "robert@apple.com",
  };

  const activeStages = stages
    .filter((stage) => stage.isActive)
    .sort((a, b) => a.order - b.order);

  if (activeStages.length === 0) {
    return (
      <div className="flex flex-col gap-4 w-full border border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 py-4">No pipeline stages available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full border border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {/* <span className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {leadData.company}
          </span>
          <span className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {leadData.title}
          </span>
          <span className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {leadData.email}
          </span> */}
        </div>

        <div className="flex gap-3 self-end">
          {leadStatus === "won" || leadStatus === "paused" || isCompleted ? (
            <button
              onClick={handleReopen}
              className="px-4 py-2 rounded-md font-medium bg-gray-500 text-white hover:opacity-90"
            >
              Reopen
            </button>
          ) : (
            <>
              <button
                onClick={() => handleStatusChange("won")}
                className="px-4 py-2 rounded-md font-medium bg-[#00854D] text-white hover:opacity-90"
              >
                Won
              </button>
              <button
                onClick={() => handleStatusChange("paused")}
                className="px-4 py-2 rounded-md font-medium bg-[#ffba08] text-white hover:opacity-90"
              >
                Paused
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full overflow-hidden">
        {activeStages.map((stage, index) => {
          const isActive = index <= currentStep;
          const stageColor = stage.color || "#d1d5db";
          const isWon = leadStatus === "won";
          const isLost = leadStatus === "paused";

          const borderColor = isWon ? "#00854D" : isLost ? "#ffba08" : stageColor;
          const fillColor = isWon
            ? "#00854D"
            : isLost
            ? "#ffba08"
            : isActive
            ? stageColor
            : "#fff";
          const textColor = isActive || isWon || isLost ? "#fff" : "#111827";

          let shape = "";
          if (index === 0) {
            shape = "polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)";
          } else if (index === activeStages.length - 1) {
            shape = "polygon(0 0, 100% 0, 100% 100%, 0 100%, 15px 50%)";
          } else {
            shape = "polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)";
          }

          return (
            <div key={stage.id} className="relative flex-1">
              <div
                style={{
                  backgroundColor: borderColor,
                  clipPath: shape,
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
              <div
                onClick={() => handleClick(index)}
                className="relative flex items-center justify-center px-6 py-4 text-sm font-medium cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: fillColor,
                  color: textColor,
                  clipPath: shape,
                  margin: "2px",
                }}
                title={stage.name}
              >
                {stage.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};