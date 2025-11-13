// Repeat Task Type Definitions - Matches Backend Schema & DTO

export enum RepeatTaskType {
  FLEXIBLE = 'FLEXIBLE',
  IMPORTANT = 'IMPORTANT',
}

export enum RepeatFrequencyType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export interface FrequencyDaily {
  time?: string; // e.g., "4:00pm"
  days?: string[]; // e.g., ["monday", "tuesday"]
}

export interface FrequencyWeekly {
  time?: string; // e.g., "4:00pm"
  day?: string; // e.g., "monday"
}

export interface FrequencyMonthly {
  time?: string; // e.g., "4:00pm"
  day?: number; // <28 && > -28
}

export interface FrequencyQuarterly {
  time?: string; // e.g., "4:00pm"
  month?: number[]; // e.g., [1, 2, 3]
  day?: number; // <28 && > -28
}

export interface FrequencyYearly {
  time?: string; // e.g., "4:00pm"
  date?: string; // e.g., "1-06-2025"
}

// Complete RepeatTask data matching Prisma schema
export interface RepeatTaskData {
  id: string;
  repeattaskId: string;
  taskName: string;
  description: string;
  status: string;
  priority: string;
  estimateTime: string; // in seconds
  assignedToId: string[];
  jobBucket: string | null;
  tags: string[];
  projectId: string;
  documents: string[];
  createdById: string;
  companyId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Frequency configuration
  frequenceType: RepeatTaskType; // FLEXIBLE or IMPORTANT
  frequence: RepeatFrequencyType; // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  day: FrequencyDaily | Record<string, any>;
  week: FrequencyWeekly | Record<string, any>;
  month: FrequencyMonthly | Record<string, any>;
  quartly: FrequencyQuarterly | Record<string, any>;
  yearly: FrequencyYearly | Record<string, any>;
  
  // Scheduling
  whenToStart: Date | string;
  untilDate: string | null; // DateTime || "infinity"
  isEnabled: boolean;
  timeZone: string | null;
  nextTime?: Date | string | null;
  
  // Populated relations (from backend includes)
  project?: {
    id: string;
    projectName: string;
    [key: string]: any;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    [key: string]: any;
  };
  assignedTo?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  }>;
}

export interface RepeatTaskQueryParams {
  // Backend filters
  projectId?: string;
  status?: string;
  isEnabled?: boolean;
  frequenceType?: RepeatTaskType;
  
  // Pagination (backend uses skip/take)
  skip?: number;
  take?: number;
  
  // Not used by backend, keeping for frontend compatibility
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RepeatTaskCreateDto {
  taskName: string;
  description?: string;
  priority: string;
  estimateTime: string; // in seconds
  assignedToId: string[];
  jobBucket?: string; // will be null if "company other"
  tags?: string[];
  projectId: string;
  documents?: string[];
  
  // Frequency
  frequenceType: RepeatTaskType; // FLEXIBLE or IMPORTANT
  frequence: RepeatFrequencyType; // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  day?: FrequencyDaily;
  week?: FrequencyWeekly;
  month?: FrequencyMonthly;
  quartly?: FrequencyQuarterly;
  yearly?: FrequencyYearly;
  
  // Scheduling
  whenToStart: string; // ISO date string
  untilDate?: string; // DateTime || "infinity"
  isEnabled?: boolean;
}

export interface RepeatTaskUpdateDto {
  taskName?: string;
  description?: string;
  status?: string;
  priority?: string;
  estimateTime?: string;
  assignedToId?: string[];
  jobBucket?: string;
  tags?: string[];
  projectId?: string;
  documents?: string[];
  
  // Frequency
  frequenceType?: RepeatTaskType;
  frequence?: RepeatFrequencyType;
  day?: FrequencyDaily;
  week?: FrequencyWeekly;
  month?: FrequencyMonthly;
  quartly?: FrequencyQuarterly;
  yearly?: FrequencyYearly;
  
  // Scheduling
  whenToStart?: string;
  untilDate?: string;
  isEnabled?: boolean;
}

export interface RepeatTaskResponse {
  message?: string;
  data: RepeatTaskData[];
  total: number;
}

export interface SingleRepeatTaskResponse {
  message?: string;
  data: RepeatTaskData;
}
