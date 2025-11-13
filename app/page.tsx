'use client';

import Link from 'next/link';
import { useAuth } from '../store/hooks';

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-4xl font-bold text-center">
            Welcome to Company
          </h1>

          <p className="text-xl text-gray-600 text-center max-w-2xl">
            Your comprehensive business management solution. Please login to access your dashboard.
          </p>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Link
              href="/login"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            >
              Login to Dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center hover:bg-gray-50 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col items-center justify-center gap-4 row-start-2">
        <h2 className="text-2xl font-semibold">Welcome back!</h2>
        <p className="text-gray-600">You are logged in. Go to your dashboard to continue.</p>
        <Link
          href="/dashboard"
          className="rounded-full bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </Link>
      </main>
    </div>
  );
}
