// utils/fieldConfig.ts
// import { projectFieldConfig } from "@/components/common/forms/DynamicForm/dynamicFieldConfig";

// Define contact field config similar to projectFieldConfig
export const contactFieldConfig: Record<string, {
  icon: string,
  tooltip: string
}> = {
  name: {
    icon: "/icons/contact/name.svg",
    tooltip: "Full name of the contact",
  },
  email: {
    icon: "/icons/contact/email.svg",
    tooltip: "Email address of the contact",
  },
  phone: {
    icon: "/icons/contact/phone.svg",
    tooltip: "Phone number with country flag and WhatsApp option",
  },
  company: {
    icon: "/icons/contact/company.svg",
    tooltip: "Company name associated with the contact",
  },
  // Add more contact fields as needed
};

export const getFieldConfig = (companyType: string, fieldKey: string) => {
  // if (companyType === 'project') {
  //   return projectFieldConfig[fieldKey];
  // } else 
  if (companyType === 'biz-accelerator') {
    return contactFieldConfig[fieldKey];
  }
  return null;
};