'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store';
import Image from "next/image";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={<div className="w-full h-full min-h-[500px] flex items-center justify-center">
        <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
      </div>} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
