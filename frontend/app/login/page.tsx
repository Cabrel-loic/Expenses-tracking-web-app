"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(username, password);
    if (success) {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="card bg-base-100 shadow-xl border-2 border-warning/10 border-dashed">
        <div className="card-body">
          <div className="flex flex-col items-center mb-6">
            <div className="avatar placeholder mb-4">
              <div className="bg-warning/20 text-warning rounded-full w-20 flex items-center justify-center">
                <LogIn className="w-10 h-10" />
              </div>
            </div>
            <h2 className="card-title text-2xl">Welcome Back</h2>
            <p className="text-base-content/60">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </span>
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-warning w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="divider">OR</div>

          <div className="text-center">
            <p className="text-sm text-base-content/60">
              Don't have an account?{' '}
              <Link href="/register" className="link link-warning font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

