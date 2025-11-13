"use client";
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme, useCompanyTheme, useAuth } from '../store/hooks';
import Image from "next/image";
interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { isDark, companyThemeColor: globalCompanyThemeColor } = useTheme();

  // Check if current page is public (login/signup/landing)
  const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/' || !isAuthenticated;

  // Only fetch company theme for authenticated users on private pages
  const { isLoading, company } = useCompanyTheme();
  // Determine active theme color precedence:
  // 1. If private page and company.themeColor exists use it
  // 2. Else if private page and global companyThemeColor (from login user.themeColor) use it
  // 3. Else default
  const resolvedThemeColor = !isPublicPage
    ? (company?.themeColor || globalCompanyThemeColor || '#004aad')
    : '#004aad';

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;

    if (isDark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    // For public pages, always use default theme color
    const themeColor = resolvedThemeColor;

    // Set theme color CSS variable
    root.style.setProperty('--company-theme-color', themeColor);

    // Update sidebar colors based on theme
    if (isDark) {
      root.style.setProperty('--sidebar-bg', '#212121');
      root.style.setProperty('--sidebar-text', '#ffffff');
      root.style.setProperty('--light-bg', '#292929');
      root.style.setProperty('--light-text', '#e2e2e2');
    } else {
      root.style.setProperty('--sidebar-bg', themeColor);
      root.style.setProperty('--sidebar-text', '#ffffff');
      root.style.setProperty('--light-bg', '#faf9f9');
      root.style.setProperty('--light-text', '#707070');
    }
  }, [isDark, resolvedThemeColor, isPublicPage]);

  // Show loading only for authenticated users on private pages
  if (!isPublicPage && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          {/* <p className="text-gray-600">Loading theme...</p> */}
          <div className="w-full h-full min-h-[300px] flex items-center justify-center">
            <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ThemeProvider;
