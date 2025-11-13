import { useSelector_ } from './index';
import { useEffect } from 'react';
import { useGetCurrentUserQuery } from './api_query/auth.api';
import { useGetCompanyByIdQuery } from './api_query/company.api';
import { useDispatch_ } from './index';
import { setUser, setCompany } from './api_query/global';

// Custom hooks for commonly accessed state
export const useAuth = () => {
  const user = useSelector_((state) => state.globalState.user);
  const isAuthenticated = !!user;

  return {
    user,
    isAuthenticated,
  };
};

export const useCompany = () => {
  const company = useSelector_((state) => state.globalState.company) as { id?: string; themeColor?: string } | undefined;
  const hasCompany = !!company;

  return {
    company,
    hasCompany,
    companyId: company?.id,
  };
};

export const useTheme = () => {
  const theme = useSelector_((state) => state.globalState.theme);
  const companyThemeColor = useSelector_((state) => state.globalState.companyThemeColor);
  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    isLight: !isDark,
    companyThemeColor,
    // Theme colors based on mode
    colors: {
      // Dark mode colors
      dark: {
        sidebar: '#212121',
        text: '#ffffff',
        lightBg: '#292929',
        lightText: '#e2e2e2',
        company: companyThemeColor,
        contentBg: '#1a1a1a', // Added missing property
        border: '#404040', // Added missing property
        card: '#2d2d2d', // Added missing property
        textLight: '#a0a0a0' // Added missing property
      },
      // Light mode colors  
      light: {
        sidebar: companyThemeColor,
        text: '#707070',
        lightBg: '#faf9f9',
        lightText: '#707070',
        background: '#ffffff',
        company: companyThemeColor,
        contentBg: '#ffffff', // Added missing property
        border: '#e5e7eb', // Added missing property
        card: '#ffffff', // Added missing property
        textLight: '#6b7280' // Added missing property
      }
    }
  };
};

export const useGlobalLoading = () => {
  const loading = useSelector_((state) => state.globalState.loading);

  return loading;
};

// Hook to automatically fetch and set company theme from backend
export const useCompanyTheme = () => {
  const dispatch = useDispatch_();
  const user = useSelector_((state) => state.globalState.user) as { company?: string } | undefined;
  const company = useSelector_((state) => state.globalState.company);
  const { isAuthenticated } = useAuth();

  const { data: currentUser, isSuccess: userSuccess, isLoading: userLoading } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated || !!user,
  }) as { data: { company?: string } | undefined; isSuccess: boolean; isLoading: boolean };

  const userCompanyId = user?.company || currentUser?.company;
  const { data: companyData, isSuccess: companySuccess, isLoading: companyLoading } = useGetCompanyByIdQuery(userCompanyId, {
    skip: !isAuthenticated || !userCompanyId || !!company,
  });

  useEffect(() => {
    if (userSuccess && currentUser && !user) {
      dispatch(setUser(currentUser));
    }
  }, [userSuccess, currentUser, user, dispatch]);

  useEffect(() => {
    if (companySuccess && companyData && !company) {
      dispatch(setCompany(companyData));
    }
  }, [companySuccess, companyData, company, dispatch]);

  const activeCompany = company || companyData;
  const companyThemeColor = activeCompany?.themeColor || '#007bff'; // default fallback

  return {
    user: user || currentUser,
    company: activeCompany,
    companyThemeColor,
    isLoading: isAuthenticated && (userLoading || (!!userCompanyId && companyLoading)),
  };
};

