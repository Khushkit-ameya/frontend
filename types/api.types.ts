// Type definitions for better error handling

export interface ApiError {
  data?: {
    message?: string;
    error?: string;
    statusCode?: number;
  };
  status?: number;
  message?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  themeColor?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
 
export interface User {
  companyUserId: string | number | null; // Replaced 'any' with specific types
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: Company;
  // Optional themeColor returned directly on user (e.g. from login payload)
  themeColor?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token?: string;
  refreshToken?: string;
  message?: string;
}

export interface RegisterRequest {
  name: string; // Full name; backend splits into firstName/lastName
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface CompanySignupRequest {
  // User data
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  
  // Company data
  companyName: string;
  themeColor?: string;
  phone?: string;
  companyEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface CompanySignupResponse {
  user: User;
  company: Company;
  success: boolean;
  message: string;
}