'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store/hooks';
import { useGetCurrentUserQuery } from '../store/api_query/auth.api';
import { useDispatch_ } from '../store';
import { clearUser, setUser } from '../store/api_query/global';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch_();
  const { data, isLoading, isError } = useGetCurrentUserQuery(undefined, { 
    // Always refetch to validate session cookie
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (data) {
      dispatch(setUser(data));
    } else if (!isLoading && isError) {
      dispatch(clearUser());
      router.push('/login');
    }
  }, [data, isError, isLoading, dispatch, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !data) return null;
  return <>{children}</>;
}
