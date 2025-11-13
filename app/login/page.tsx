'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoginMutation, useGetCurrentUserQuery } from '../../store/api_query/auth.api';
import { useDispatch_ } from '../../store';
import { setUser } from '../../store/api_query/global';
import { useAuth } from '../../store/hooks';
import type { ApiError } from '../../types/api.types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch_();
  const { isAuthenticated } = useAuth();
  const { data: meUser } = useGetCurrentUserQuery();
  useEffect(() => {
    if (isAuthenticated || meUser) {
      router.replace('/');
    }
  }, [isAuthenticated, meUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login({
        email,
        password,
        rememberMe // backend currently ignores; kept for future session extension
      }).unwrap();

      // Store user data in global state
      dispatch(setUser(result.user));

      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // Implement Google OAuth here
    // You can redirect to your backend's Google OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image and Quote */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 relative">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <Image
          src="/model.webp"
          alt="Login background"
          fill
          className="object-cover"
          priority
        />

        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-900 rounded-sm"></div>
            </div>
            <span className="text-white text-xl font-semibold">Company</span>
          </div>
        </div>

        {/* Quote */}
        <div className="absolute bottom-16 left-8 right-8 z-10">
          <blockquote className="text-white text-2xl font-light leading-relaxed mb-6">
            &quot;Simply all the tools that my team and I need.&quot;
          </blockquote>

          <div className="text-white">
            <div className="font-medium">Business Owner</div>
            <div className="text-gray-300 text-sm">Director of Operations</div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-gray-900 text-xl font-semibold">Ameya Suite</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back to Company
            </h1>
            <p className="text-gray-600">
              Build your business operations effortlessly with our powerful management system.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.jordan@gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
              <div className="text-right mt-2">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                  Forgot password?
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember sign in details</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {(error as ApiError)?.data?.message || 'Login failed. Please try again.'}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
