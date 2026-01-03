"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="avatar placeholder">
              <div className="bg-warning/20 text-warning rounded-full w-24 h-24 flex items-center justify-center">
                <span className="text-2xl font-bold">{user?.first_name?.[0] ?? user?.username?.[0] ?? 'U'}</span>
              </div>
            </div>
            <h2 className="text-2xl font-semibold">
              {user?.first_name || user?.last_name ? `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() : user?.username}
            </h2>
            <p className="text-sm text-base-content/60">{user?.email}</p>
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/profile/edit" className="btn btn-warning">
              Edit Profile
            </Link>
            <Link href="/" className="btn btn-ghost">
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
