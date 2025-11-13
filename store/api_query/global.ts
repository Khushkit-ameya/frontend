import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GlobalState {
  theme: 'light' | 'dark';
  loading: boolean;
  user: unknown;
  company: unknown;
  selectedCompanyPermission: unknown;
  companyThemeColor: string;
  suiteApp: string | null; // Selected suite/application (LazyKill, Biz Accelator, Biz Desk)
}

const initialState: GlobalState = {
  theme: 'light',
  loading: false,
  user: null,
  company: null,
  selectedCompanyPermission: null,
  companyThemeColor: '#004aad',
  suiteApp: null,
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUser: (state, action: PayloadAction<unknown>) => {
      state.user = action.payload;
      // If backend sends themeColor directly on user (before company fetch), use it
      if (action.payload && typeof action.payload === 'object' && 'themeColor' in (action.payload as Record<string, unknown>)) {
        const t = (action.payload as { themeColor?: string }).themeColor;
        if (typeof t === 'string') state.companyThemeColor = t;
      }
    },
    setCompany: (state, action: PayloadAction<unknown>) => {
      state.company = action.payload;
      // Set theme color from company data
      if (action.payload && typeof action.payload === 'object' && 'themeColor' in (action.payload as Record<string, unknown>)) {
        const t = (action.payload as { themeColor?: string }).themeColor;
        if (typeof t === 'string') state.companyThemeColor = t;
      }
    },
    setCompanyThemeColor: (state, action: PayloadAction<string>) => {
      state.companyThemeColor = action.payload;
    },
    setSuiteApp: (state, action: PayloadAction<string>) => {
      state.suiteApp = action.payload;
    },
    setSelectedCompanyPermission: (state, action: PayloadAction<unknown>) => {
      state.selectedCompanyPermission = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    clearCompany: (state) => {
      state.company = null;
      state.selectedCompanyPermission = null;
      state.companyThemeColor = '#004aad'; // Reset to default
    },
    clearSuiteApp: (state) => {
      state.suiteApp = null;
    }
  },
});

export const {
  setTheme,
  setLoading,
  setUser,
  setCompany,
  setCompanyThemeColor,
  setSuiteApp,
  setSelectedCompanyPermission,
  clearUser,
  clearCompany,
  clearSuiteApp,
} = globalSlice.actions;


export default globalSlice.reducer;
