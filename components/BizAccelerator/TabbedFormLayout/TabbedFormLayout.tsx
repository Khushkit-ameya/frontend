"use client";

import React from 'react';
import type { StaticImageData } from 'next/image';
import { FormTabs } from './FormTabs';

interface TabConfig {
  key: string;
  label: string;
  icon?: string | StaticImageData;
  component: React.ComponentType<any>;
  componentProps?: Record<string, unknown>;
  disabled?: boolean;
}

interface TabbedFormLayoutProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
}

export const TabbedFormLayout = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: TabbedFormLayoutProps) => {
  const activeTabConfig = tabs.find(tab => tab.key === activeTab);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <FormTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className="flex-1 p-4 overflow-auto">
        {activeTabConfig && (
          <activeTabConfig.component {...(activeTabConfig.componentProps || {})} />
        )}
      </div>
    </div>
  );
};
