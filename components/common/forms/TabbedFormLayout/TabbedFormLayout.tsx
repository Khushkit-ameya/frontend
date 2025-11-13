"use client";

import React from "react";
import { FormTabs } from "../FormTabs";
import { StaticImageData } from "next/image";
// Update the import path to match the actual location and filename of FormActionsBar
import { FormActionsBar } from "../FormActionsBar/FormActionsBar";

export interface TabConfig {
  key: string;
  label: string;
  icon: string | StaticImageData;
  component: React.ComponentType<unknown>;
  componentProps?: Record<string, unknown>;
}

interface TabbedFormLayoutProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  companyThemeColor?: string;
  actionBarProps?: {
    showEmailButton?: boolean;
    showActivityDropdown?: boolean;
    showFilters?: boolean;
    showSearch?: boolean;
    showSettings?: boolean;
    onEmailClick?: () => void;
    onActivityClick?: () => void;
    onFilterClick?: () => void;
    onSettingsClick?: () => void;
  };
  className?: string;
}

export const TabbedFormLayout: React.FC<TabbedFormLayoutProps> = ({
  tabs,
  activeTab,
  onTabChange,
  companyThemeColor,
  className = "",
}) => {
  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component;
  const activeTabConfig = tabs.find(tab => tab.key === activeTab);
  const customColor = "#C81C1F"
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tabs Navigation */}
      <FormTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-auto">
        {ActiveComponent && activeTabConfig && (
          <ActiveComponent {...activeTabConfig.componentProps} />
        )}
      </div>
    </div>
  );
};