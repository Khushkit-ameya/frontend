"use client";

import React, { useState, useEffect } from "react";
import { useGetFieldStagesQuery } from '@/store/api_query/BizAcceleratorLead.api';

interface Stage {
    id: string;
    name: string;
    order: number;
    color: string;
    isActive: boolean;
    probability?: number | null;
    metadata: Record<string, string>;
}

interface PipelineRibbonProps {
    leadId?: string;
    currentStatus?: string;
    onStatusChange?: (statusId: string) => void;
    fieldId?: string;
    initialStep?: number;
    onStepChange?: (index: number, statusId: string) => void;
}

export const PipelineRibbon: React.FC<PipelineRibbonProps> = ({
    leadId,
    currentStatus,
    onStatusChange,
    fieldId = "cmg6gyh1a00yjsmy8bumk23dh", // Default status field ID
    initialStep = 0,
    onStepChange,
}) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [leadStatus, setLeadStatus] = useState<"won" | "lost" | "reopen" | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    // Use RTK Query hook to fetch stages
    const { data: stagesData, isLoading: stagesLoading, error } = useGetFieldStagesQuery({
        fieldId,
        includeInactive: false
    }) as { data: { data?: { stages?: Stage[] } } | undefined; isLoading: boolean; error: unknown };

    const stages = stagesData?.data?.stages || [];

    // Set current step based on current status when stages load
    useEffect(() => {
        if (stages.length > 0 && currentStatus) {
            const statusIndex = stages.findIndex((stage: Stage) => stage.id === currentStatus);
            if (statusIndex !== -1) {
                setCurrentStep(statusIndex);
            }
        }
    }, [stages, currentStatus]);

    useEffect(() => {
        // automatically mark as completed when reaching last step manually
        if (currentStep === stages.length - 1 && !leadStatus) {
            setIsCompleted(true);
        } else if (currentStep < stages.length - 1 && isCompleted) {
            setIsCompleted(false);
        }
    }, [currentStep, stages.length, leadStatus, isCompleted]);

    const handleClick = (index: number) => {
        // prevent clicking when won/lost
        if (leadStatus === "won" || leadStatus === "lost") return;

        const newStep = index;
        setCurrentStep(newStep);

        // Get the status ID for the clicked step
        const statusId = stages[newStep]?.id;
        if (statusId) {
            onStepChange?.(newStep, statusId);
            onStatusChange?.(statusId);
        }
    };

    const handleStatusChange = (status: "won" | "lost") => {
        setLeadStatus(status);
        setIsCompleted(false);
        setCurrentStep(stages.length - 1);

        // You might want to call an API here to update the lead status to won/lost
        console.log(`Lead ${leadId} marked as ${status}`);
    };

    const handleReopen = () => {
        setLeadStatus(null);
        setIsCompleted(false);
        setCurrentStep(0);

        // Reset to first stage when reopened
        const firstStageId = stages[0]?.id;
        if (firstStageId) {
            onStatusChange?.(firstStageId);
        }
    };

    // Get lead data from props or context (you'll need to pass this)
    const leadData = {
        company: "Microsoft",
        title: "COO",
        email: "robert@apple.com",
    };

    if (stagesLoading) {
        return (
            <div className="flex flex-col gap-4 w-full border border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded flex-1"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4 w-full border border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="text-center text-red-500 py-4">
                    Failed to load pipeline stages
                </div>
            </div>
        );
    }

    if (stages.length === 0) {
        return (
            <div className="flex flex-col gap-4 w-full border border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="text-center text-gray-500 py-4">
                    No pipeline stages available
                </div>
            </div>
        );
    }

    // Get active stages sorted by order
    const activeStages = stages
        .filter((stage: Stage) => stage.isActive)
        .sort((a: Stage, b: Stage) => a.order - b.order);

    return (
        <div className="flex flex-col gap-4 w-full border border-gray-300 rounded-lg p-4 bg-white dark:bg-gray-900">
            {/* Lead Info Tags */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {leadData.company}
                    </span>
                    <span className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {leadData.title}
                    </span>
                    <span className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {leadData.email}
                    </span>
                </div>

                {/* Buttons Logic */}
                <div className="flex gap-3 self-end">
                    {leadStatus === "won" || leadStatus === "lost" || isCompleted ? (
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
                                className="px-4 py-2 rounded-md font-medium bg-green-600 text-white hover:opacity-90"
                            >
                                Won
                            </button>
                            <button
                                onClick={() => handleStatusChange("lost")}
                                className="px-4 py-2 rounded-md font-medium bg-red-600 text-white hover:opacity-90"
                            >
                                Lost
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Pipeline Ribbon */}
         <div className="flex w-full overflow-hidden">
  {activeStages.map((stage: Stage, index: number) => {
    const isActive = index <= currentStep;
    const stageColor = stage.color || "#d1d5db";
    const isWon = leadStatus === "won";
    const isLost = leadStatus === "lost";

    // Colors
    const borderColor = isWon ? "#00854D" : isLost ? "#dc2626" : stageColor;
    const fillColor = isWon
      ? "#00854D"
      : isLost
      ? "#dc2626"
      : isActive
      ? stageColor
      : "#fff";
    const textColor = isActive || isWon || isLost ? "#fff" : "#111827";

    // Arrow shape
    let shape = "";
    if (index === 0) {
      shape =
        "polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)";
    } else if (index === activeStages.length - 1) {
      shape =
        "polygon(0 0, 100% 0, 100% 100%, 0 100%, 15px 50%)";
    } else {
      shape =
        "polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)";
    }

    return (
      <div key={stage.id} className="relative flex-1">
        {/* Border layer */}
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

        {/* Inner filled layer */}
        <div
          onClick={() => handleClick(index)}
          className="relative flex items-center justify-center px-6 py-4 text-sm font-medium cursor-pointer transition-all duration-200"
          style={{
            backgroundColor: fillColor,
            color: textColor,
            clipPath: shape,
            margin: "2px", // this creates the “border thickness”
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