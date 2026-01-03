"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const { user, loading, isAuthenticated, updateUser } = useAuth() as any;
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
  });
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [user, loading, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist locally via updateUser (also writes to localStorage)
    if (updateUser) {
      updateUser({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        username: form.username,
      });
      toast.success('Profile updated locally');
      router.push('/profile');
    } else {
      toast.error('Unable to update profile');
    }
  };

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
          <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">First name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label">Last name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label">Username</label>
              <input name="username" value={form.username} onChange={handleChange} className="input input-bordered w-full" />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-warning" type="submit">Save</button>
              <button className="btn btn-ghost" type="button" onClick={() => router.push('/profile')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
