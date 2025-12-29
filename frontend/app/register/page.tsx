"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password2) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);
    const success = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.password2,
      formData.firstName,
      formData.lastName
    );
    
    if (success) {
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="card bg-base-100 shadow-xl border-2 border-warning/10 border-dashed">
        <div className="card-body">
          <div className="flex flex-col items-center mb-6">
            <div className="avatar placeholder mb-4">
              <div className="bg-warning/20 text-warning rounded-full w-20">
                <UserPlus className="w-10 h-10" />
              </div>
            </div>
            <h2 className="card-title text-2xl">Create Account</h2>
            <p className="text-base-content/60">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    First Name
                  </span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  className="input input-bordered w-full"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Last Name
                  </span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  className="input input-bordered w-full"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username *
                </span>
              </label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                className="input input-bordered w-full"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="input input-bordered w-full"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password *
                </span>
              </label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                className="input input-bordered w-full"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password *
                </span>
              </label>
              <input
                type="password"
                name="password2"
                placeholder="Confirm your password"
                className="input input-bordered w-full"
                value={formData.password2}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={8}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Sign Up
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="divider">OR</div>

          <div className="text-center">
            <p className="text-sm text-base-content/60">
              Already have an account?{' '}
              <Link href="/login" className="link link-warning font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

