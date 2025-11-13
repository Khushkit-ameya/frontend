import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import { persistReducer, persistStore } from 'redux-persist';
import UserApi from './api_query/user.api';
import CompanyApi from './api_query/company.api';
import EmployeeApi from './api_query/employee.api';
import DashboardApi from './api_query/dashboard.api';
import AuthApi from './api_query/auth.api';
import GlobalStates from './api_query/global';
import ContactsApi from './api_query/contacts.api';
import { Api_Attendance } from './api_query/attendance.api';
import BizAcceleractorContact from './api_query/BizAcceleractorContact.api';
import ProjectApi from './api_query/LazyKill/project.api';
import LazyKillApi from './api_query/LazyKill/lazyKill.api';
import  BizAcceleratorLeadApi  from './api_query/BizAcceleratorLead.api';
import { activitiesApi } from './api_query/LazyKill/activities.api';
import { bizActivitiesApi } from './api_query/BizAccelerator/activities.api';
import { shiftApi } from './api_query/bizignite/shift.api';

import LeadsApi from './api_query/leads.api';
import FieldDefinitionsApi from './api_query/field_definitions.api';
import ActivitiesApi from './api_query/BizAcceleratorActivities.api';
import OpportunitiesApi from './api_query/opportunities.api';
import DealsApi from './api_query/deals.api';
import FiltersApi from './api_query/BizAccelerator/filter.api';
import CompanyOffApi from './api_query/companyOff.api';
import holidayApi from './api_query/holiday.api';
import AccountsApi from './api_query/BizAcceleratorAccounts.api';
import CustomersApi from './api_query/BizAcceleratorCustomers.api';
import PaymentsApi from './api_query/BizAcceleratorPayment.api';
import QuotationsApi from './api_query/BizAcceleratorQuotations.api';
import SalesOrdersApi from './api_query/BizAcceleratorSalesOrders.api';
import { LeaveApi } from './api';

// 1. Combine reducers
const rootReducer = combineReducers({
  globalState: GlobalStates,
  [UserApi.reducerPath]: UserApi.reducer,
  [CompanyApi.reducerPath]: CompanyApi.reducer,
  [EmployeeApi.reducerPath]: EmployeeApi.reducer,
  [DashboardApi.reducerPath]: DashboardApi.reducer,
  [AuthApi.reducerPath]: AuthApi.reducer,
  [Api_Attendance.reducerPath]: Api_Attendance.reducer,
  [ContactsApi.reducerPath]: ContactsApi.reducer,
  [BizAcceleractorContact.reducerPath]: BizAcceleractorContact.reducer,
  [ProjectApi.reducerPath]: ProjectApi.reducer,
  [LazyKillApi.reducerPath]: LazyKillApi.reducer,
  [activitiesApi.reducerPath]: activitiesApi.reducer,
  [LeadsApi.reducerPath]: LeadsApi.reducer,
  [CompanyOffApi.reducerPath]: CompanyOffApi.reducer, 
  [holidayApi.reducerPath]: holidayApi.reducer,
  [FieldDefinitionsApi.reducerPath]: FieldDefinitionsApi.reducer,
  [ActivitiesApi.reducerPath]: ActivitiesApi.reducer,
  [OpportunitiesApi.reducerPath]: OpportunitiesApi.reducer,
  [BizAcceleratorLeadApi.reducerPath]: BizAcceleratorLeadApi.reducer,
  [DealsApi.reducerPath]: DealsApi.reducer,
  [FiltersApi.reducerPath]: FiltersApi.reducer,
  [bizActivitiesApi.reducerPath]: bizActivitiesApi.reducer,
  [shiftApi.reducerPath]: shiftApi.reducer,
  [AccountsApi.reducerPath]: AccountsApi.reducer,
  [CustomersApi.reducerPath]: CustomersApi.reducer,
  [PaymentsApi.reducerPath]: PaymentsApi.reducer,
  [QuotationsApi.reducerPath]: QuotationsApi.reducer,
  [SalesOrdersApi.reducerPath]: SalesOrdersApi.reducer,
  [LeaveApi.reducerPath]: LeaveApi.reducer,
});

// 2. Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: [UserApi.reducerPath, 'globalState'], // persist only RTK Query slice
};

// 3. Wrap reducer with persistence
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for redux-persist
    }).concat(
      UserApi.middleware,
      CompanyApi.middleware,
      EmployeeApi.middleware,
      DashboardApi.middleware,
      AuthApi.middleware,
      Api_Attendance.middleware,
      ContactsApi.middleware,
      BizAcceleractorContact.middleware,
      ProjectApi.middleware,
      LazyKillApi.middleware,
      activitiesApi.middleware,
      LeadsApi.middleware,
      FieldDefinitionsApi.middleware,
      ActivitiesApi.middleware,
      OpportunitiesApi.middleware,
      BizAcceleratorLeadApi.middleware,
      DealsApi.middleware,
      FiltersApi.middleware,
      bizActivitiesApi.middleware,
      CompanyOffApi.middleware,
      holidayApi.middleware,
      shiftApi.middleware,
      AccountsApi.middleware,
      CustomersApi.middleware,
      PaymentsApi.middleware,
      QuotationsApi.middleware,
      SalesOrdersApi.middleware,
      LeaveApi.middleware
    ),
});

// 5. Create persistor for PersistGate
export const persistor = persistStore(store);

// 6. Typed hooks
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export const useDispatch_ = () => useDispatch<AppDispatch>();
export const useSelector_: TypedUseSelectorHook<RootState> = useSelector;

export default store;
