import { start } from "repl";
import { FieldType } from "./types";

// Base configuration for field types
export const fieldTypeDefaults: Record<FieldType, {
  icon: string;
  tooltip: string;
}> = {
  TEXT: {
    icon: "/icons/project/Vector.svg",
    tooltip: "Text input field"
  },
  EMAIL: {
    icon: "/icons/emailsss.svg",
    tooltip: "Email address field"
  },
  PHONE: {
    icon: "/icons/emailsss.svg", // Using SMS icon for phone
    tooltip: "Phone number field"
  },
  URL: {
    icon: "/icons/project/link-choosing-asset.svg",
    tooltip: "Website URL field"
  },
  TEXTAREA: {
    icon: "/icons/project/Descritpion.svg",
    tooltip: "Multi-line text area"
  },
  NUMBER: {
    icon: "/icons/project/Vector-1.svg", // Using number icon
    tooltip: "Numeric input field"
  },
  CURRENCY: {
    icon: "/icons/project/Vector-1.svg", // Using number icon for currency
    tooltip: "Currency amount field"
  },
  DATE: {
    icon: "/icons/project/tags.svg",
    tooltip: "Date selection field"
  },
  DATE_TIME: {
    icon: "/icons/project/tags.svg",
    tooltip: "Date and time selection"
  },
  DATE_RANGE: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Date range selection"
  },
  DATE_TIME_RANGE: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Date and time range selection"
  },
  TIME: {
    icon: "/icons/time.svg",
    tooltip: "Time selection field"
  },
  TIME_RANGE: {
    icon: "/icons/time.svg",
    tooltip: "Time range selection"
  },
  CHECKBOX: {
    icon: "/icons/todo.png", // Using todo icon for checkbox
    tooltip: "Checkbox option"
  },
  RADIO: {
    icon: "/icons/project/Vector.svg", // Using text icon as fallback
    tooltip: "Radio button selection"
  },
  DROPDOWN: {
    icon: "/icons/project/status.svg", // Using status dropdown icon
    tooltip: "Dropdown selection"
  },
  CREATABLE_DROPDOWN: {
    icon: "/icons/project/tags.svg", // Using tags icon for creatable
    tooltip: "Dropdown with custom options"
  },
  MULTISELECT: {
    icon: "/icons/project/Manager.svg", // Using manager/team icon
    tooltip: "Multiple selection dropdown"
  },
  INPUT_WITH_BUTTON: {
    icon: "/icons/project/Vector.svg", // Using text icon as fallback
    tooltip: "Input field with action button"
  },
  BUTTON: {
    icon: "/icons/project/Vector.svg", // Using text icon as fallback
    tooltip: "Action button"
  },
  FILE_UPLOAD: {
    icon: "/icons/project/document-_1_.svg",
    tooltip: "File upload field"
  },
  MULTI_SELECT: {
    icon: "/icons/project/Manager.svg",
    tooltip: "Multiple selection field"
  },
  USER_DROPDOWN: {
    icon: "/icons/project/Manager.svg",
    tooltip: "User selection dropdown"
  },
  JSON: {
    icon: "/icons/project/Vector.svg",
    tooltip: "JSON data field"
  },
  DATETIME: {
    icon: "/icons/project/tags.svg",
    tooltip: "Date and time field"
  },
  CUSTOM_DAILY: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Daily recurrence field"
  },
  CUSTOM_WEEKLY: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Weekly recurrence field"
  },
  CUSTOM_MONTHLY: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Monthly recurrence field"
  },
  CUSTOM_QUARTERLY: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Quarterly recurrence field"
  },
  SWITCH: {
    icon: "/icons/todo.png",
    tooltip: "Toggle switch field"
  },
  CUSTOM_ESTIMATE_TIME: {
    icon: "/icons/time.svg",
    tooltip: "Time estimation field"
  },
  CUSTOM_MONTHLY_VALIDATED: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Validated monthly field"
  },
  CUSTOM_QUARTERLY_VALIDATED: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Validated quarterly field"
  },
  CUSTOM_YEARLY: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Yearly recurrence field"
  }
};

// Smart field name mapping for common field names
export const commonFieldMappings: Record<string, {
  icon: string;
  tooltip: string;
}> = {
  // Customer fields
  customerEmail: {
   icon: "/icons/project/Customers Name.svg",
    tooltip: "Customer's email address"
  },
  customerPhone: {
    icon: "/icons/project/Customers Name.svg",
    tooltip: "Customer's phone number"
  },
  customerName: {
    icon: "/icons/project/Customers Name.svg",
    tooltip: "Customer's full name"
  },
  startDate: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Start date"
  },
  endDate: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "End date"
  },
  dueDate: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Due date"
  },

  // Project fields
  projectName: {
    icon: "/icons/project/Proejct Name.svg",
    tooltip: "Name of the project"
  },
  projectId: {
    icon: "/icons/project/Project Id.svg",
    tooltip: "Unique project identifier"
  },
  description: {
    icon: "/icons/project/Descritpion.svg",
    tooltip: "Project description"
  },
  timeline: {
    icon: "/icons/project/Timeline Calnedr.svg",
    tooltip: "Project timeline"
  },
  status: {
    icon: "/icons/project/status.svg",
    tooltip: "Current project status"
  },
  priority: {
    icon: "/icons/project/Priority.svg",
    tooltip: "Project priority level"
  },
  progress: {
    icon: "/icons/project/progress.svg",
    tooltip: "Project completion progress"
  },
  projectType: {
    icon: "/icons/project/Project Types.svg",
    tooltip: "Type of project"
  },
  owner: {
    icon: "/icons/project/Owner.svg",
    tooltip: "Project owner"
  },
  team: {
    icon: "/icons/project/Manager.svg",
    tooltip: "Project team members"
  },
  manager: {
    icon: "/icons/project/Manager.svg",
    tooltip: "Project manager"
  },
  createdBy: {
    icon: "/icons/project/Created by.svg",
    tooltip: "User who created the project"
  },
  tags: {
    icon: "/icons/project/tags.svg",
    tooltip: "Project tags"
  },
  milestones: {
    icon: "/icons/project/milestone.svg",
    tooltip: "Project milestones"
  },
  documents: {
    icon: "/icons/project/clipboard.svg",
    tooltip: "Project documents"
  },
  filesLink: {
    icon: "/icons/project/tags.svg",
    tooltip: "Project files and links"
  },
  updates: {
    icon: "/icons/project/Updates.svg",
    tooltip: "Project updates"
  },

  // Additional common fields
  email: {
    icon: "/icons/emailsss.svg",
    tooltip: "Email address"
  },
  phone: {
    icon: "/icons/emailsss.svg",
    tooltip: "Phone number"
  },
  name: {
    icon: "/icons/project/Customers Name.svg",
    tooltip: "Full name"
  },
  title: {
    icon: "/icons/project/Proejct Name.svg",
    tooltip: "Title or name"
  },
  address: {
    icon: "/icons/project/Vector.svg",
    tooltip: "Address information"
  },
  city: {
    icon: "/icons/project/Vector.svg",
    tooltip: "City name"
  },
  country: {
    icon: "/icons/project/Vector.svg",
    tooltip: "Country name"
  },
  zipcode: {
    icon: "/icons/project/Vector-1.svg",
    tooltip: "Postal/ZIP code"
  },
  website: {
    icon: "/icons/project/link-choosing-asset.svg",
    tooltip: "Website URL"
  },
  notes: {
    icon: "/icons/notes.png",
    tooltip: "Additional notes"
  },
  file: {
    icon: "/icons/project/tags.svg",
    tooltip: "File attachment"
  },
  link: {
    icon: "/icons/project/link-choosing-asset.svg",
    tooltip: "Web link"
  }
};

// Smart function to get field configuration
export const getDynamicFieldConfig = (fieldKey: string, fieldType: FieldType, displayName?: string) => {
  // First, try exact match in common field mappings
  if (commonFieldMappings[fieldKey]) {
    return commonFieldMappings[fieldKey];
  }

  // Try to find by display name (case insensitive)
  const displayNameKey = displayName?.toLowerCase().replace(/\s+/g, '');
  if (displayNameKey) {
    const matchedByDisplayName = Object.entries(commonFieldMappings).find(([key, config]) => {
      const keyLower = key.toLowerCase();
      return displayNameKey.includes(keyLower) || keyLower.includes(displayNameKey);
    });

    if (matchedByDisplayName) {
      return matchedByDisplayName[1];
    }

    // Try partial matching with common words
    const commonWords = ['email', 'phone', 'name', 'date', 'time', 'status', 'priority', 'progress', 'description'];
    const matchedWord = commonWords.find(word => displayNameKey.includes(word));
    if (matchedWord && commonFieldMappings[matchedWord]) {
      return commonFieldMappings[matchedWord];
    }
  }

  // Fall back to field type defaults
  return fieldTypeDefaults[fieldType] || fieldTypeDefaults.TEXT;
};