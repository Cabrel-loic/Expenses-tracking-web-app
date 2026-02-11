"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  AtSign,
  Lock,
  Save,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
} from "lucide-react";

const AVATAR_MAX_SIZE_MB = 5;
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

type ProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
};

type FieldErrors = Partial<Record<keyof ProfileForm | keyof PasswordForm, string[]>>;

const INITIAL_PROFILE: ProfileForm = {
  first_name: "",
  last_name: "",
  email: "",
  username: "",
};

const INITIAL_PASSWORD: PasswordForm = {
  current_password: "",
  new_password: "",
  new_password_confirm: "",
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 150;
const MAX_NAME_LENGTH = 150;

function getProfileErrors(form: ProfileForm): FieldErrors {
  const err: FieldErrors = {};
  if (!form.email.trim()) err.email = ["Email is required"];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = ["Enter a valid email address"];
  if (!form.username.trim()) err.username = ["Username is required"];
  else if (form.username.length < MIN_USERNAME_LENGTH) err.username = [`At least ${MIN_USERNAME_LENGTH} characters`];
  else if (form.username.length > MAX_USERNAME_LENGTH) err.username = [`At most ${MAX_USERNAME_LENGTH} characters`];
  else if (!USERNAME_REGEX.test(form.username)) err.username = ["Letters, numbers, and underscores only"];
  if (form.first_name.length > MAX_NAME_LENGTH) err.first_name = [`At most ${MAX_NAME_LENGTH} characters`];
  if (form.last_name.length > MAX_NAME_LENGTH) err.last_name = [`At most ${MAX_NAME_LENGTH} characters`];
  return err;
}

function getPasswordErrors(form: PasswordForm): FieldErrors {
  const err: FieldErrors = {};
  if (!form.current_password) err.current_password = ["Current password is required"];
  if (!form.new_password) err.new_password = ["New password is required"];
  else if (form.new_password.length < 8) err.new_password = ["At least 8 characters"];
  if (form.new_password !== form.new_password_confirm && form.new_password_confirm)
    err.new_password_confirm = ["Passwords do not match"];
  return err;
}

export default function EditProfilePage() {
  const { user, loading: authLoading, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileForm>(INITIAL_PROFILE);
  const [password, setPassword] = useState<PasswordForm>(INITIAL_PASSWORD);
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [profileFetched, setProfileFetched] = useState(false);
  const [dateJoined, setDateJoined] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewAvatarOpen, setViewAvatarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewAvatarDialogRef = useRef<HTMLDialogElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get<ProfileForm & { id: number; date_joined?: string; avatar?: string | null }>("auth/me/");
      const data = res.data;
      setProfile({
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        email: data.email ?? "",
        username: data.username ?? "",
      });
      if (data.date_joined) setDateJoined(data.date_joined);
      updateUser?.({ avatar: data.avatar ?? null });
    } catch (err) {
      console.error("Fetch profile error", err);
      if (user) {
        setProfile({
          first_name: user.first_name ?? "",
          last_name: user.last_name ?? "",
          email: user.email ?? "",
          username: user.username ?? "",
        });
      }
    } finally {
      setProfileFetched(true);
    }
  }, [user, updateUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated && !profileFetched) fetchProfile();
  }, [authLoading, isAuthenticated, router, profileFetched, fetchProfile]);

  useEffect(() => {
    if (viewAvatarOpen) viewAvatarDialogRef.current?.showModal();
    else viewAvatarDialogRef.current?.close();
  }, [viewAvatarOpen]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name as keyof ProfileForm]) {
      setProfileErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassword((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name as keyof PasswordForm]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = getProfileErrors(profile);
    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      toast.error("Please fix the errors below.");
      return;
    }
    setProfileErrors({});
    setSavingProfile(true);
    try {
      const res = await api.patch<ProfileForm & { id: number; date_joined?: string }>("auth/me/update/", profile);
      updateUser?.({
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        email: res.data.email,
        username: res.data.username,
      });
      toast.success("Profile updated successfully.");
      router.push("/profile");
    } catch (err: unknown) {
      const res = (err as { response?: { data?: FieldErrors } })?.response?.data;
      if (res && typeof res === "object") {
        const next: FieldErrors = {};
        Object.entries(res).forEach(([k, v]) => {
          next[k as keyof FieldErrors] = Array.isArray(v) ? v : [String(v)];
        });
        setProfileErrors(next);
        toast.error("Please fix the errors below.");
      } else {
        toast.error("Failed to update profile. Try again.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = getPasswordErrors(password);
    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      toast.error("Please fix the errors below.");
      return;
    }
    setPasswordErrors({});
    setSavingPassword(true);
    try {
      await api.post("auth/me/password/", {
        current_password: password.current_password,
        new_password: password.new_password,
        new_password_confirm: password.new_password_confirm,
      });
      toast.success("Password changed successfully.");
      setPassword(INITIAL_PASSWORD);
      setPasswordErrors({});
    } catch (err: unknown) {
      const res = (err as { response?: { data?: FieldErrors } })?.response?.data;
      if (res && typeof res === "object") {
        const next: FieldErrors = {};
        Object.entries(res).forEach(([k, v]) => {
          next[k as keyof FieldErrors] = Array.isArray(v) ? v : [String(v)];
        });
        setPasswordErrors(next);
        toast.error("Please fix the errors below.");
      } else {
        toast.error("Failed to change password. Try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleShowPassword = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > AVATAR_MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${AVATAR_MAX_SIZE_MB} MB`);
      return;
    }
    if (!AVATAR_ACCEPT.split(",").some((t) => file.type === t.trim())) {
      toast.error("Use JPEG, PNG, or WebP");
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post<{ avatar?: string | null } & ProfileForm>("auth/me/avatar/", formData);
      updateUser?.({ avatar: res.data.avatar ?? null });
      toast.success("Profile picture updated");
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { avatar?: string[] } } })?.response?.data;
      const msg = data?.avatar?.[0] ?? "Failed to upload. Try again.";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-warning" />
      </div>
    );
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username || "User";
  const initial = (profile.first_name?.[0] || profile.username?.[0] || "U").toUpperCase();

  return (
    <div className="w-full max-w-2xl mx-auto px-2 pb-8">
      {/* Breadcrumb / back */}
      <div className="mb-6">
        <Link
          href="/profile"
          className="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-warning"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>
      </div>

      {/* Facebook-style header: big avatar (click to view) + small camera (click to update) + name */}
      <div className="card bg-base-200/50 border border-base-300 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-6">
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            {/* Left: large profile picture circle — click to view */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => user?.avatar && setViewAvatarOpen(true)}
                className={`relative block rounded-full w-32 h-32 overflow-hidden bg-warning/20 flex items-center justify-center ring-2 ring-base-300 focus:outline-none focus:ring-2 focus:ring-warning ${user?.avatar ? "cursor-pointer hover:ring-warning/50 transition-shadow" : "cursor-default"}`}
                aria-label={user?.avatar ? "View profile picture" : "No profile picture"}
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Profile"
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized={user.avatar.startsWith("http://localhost") || user.avatar.startsWith("http://127.0.0.1")}
                  />
                ) : (
                  <span className="text-4xl font-bold text-warning">{initial}</span>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-base-content/50 flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-warning" />
                  </div>
                )}
              </button>
              {/* Small camera circle — click to update profile picture */}
              <button
                type="button"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-base-300 border-2 border-base-200 shadow flex items-center justify-center hover:bg-warning hover:text-warning-content focus:outline-none focus:ring-2 focus:ring-warning disabled:opacity-50 transition-colors"
                aria-label="Update profile picture"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            {/* Name: first + last, prominent */}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">
                {displayName}
              </h1>
              <p className="text-sm text-base-content/60 mt-1">Edit your personal information and security settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: view profile picture full size */}
      <dialog ref={viewAvatarDialogRef} className="modal modal-bottom sm:modal-middle" onClose={() => setViewAvatarOpen(false)}>
        <div className="modal-box relative p-0 overflow-hidden bg-transparent shadow-none max-w-none w-auto max-h-[90vh] flex items-center justify-center">
          {user?.avatar && (
            <>
              <div className="relative w-full h-full min-w-[200px] min-h-[200px] max-w-[90vw] max-h-[85vh] rounded-lg overflow-hidden bg-base-300">
                <Image
                  src={user.avatar}
                  alt="Profile picture"
                  fill
                  className="object-contain"
                  sizes="(max-width: 90vw) 90vw, 512px"
                  unoptimized={user.avatar.startsWith("http://localhost") || user.avatar.startsWith("http://127.0.0.1")}
                />
              </div>
              <button
                type="button"
                onClick={() => setViewAvatarOpen(false)}
                className="btn btn-circle btn-sm absolute right-2 top-2 z-10 bg-black/50 text-white hover:bg-black/70 border-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop bg-black/70" onClick={() => setViewAvatarOpen(false)}>
          <button type="button" className="cursor-default" aria-label="Close">close</button>
        </form>
      </dialog>

      {/* Personal information */}
      <div className="card bg-base-200/50 border border-base-300 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title gap-2 text-lg mb-4">
            <User className="w-5 h-5 text-warning" />
            Personal information
          </h2>
          {!profileFetched ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md text-warning" />
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label" htmlFor="first_name">
                    <span className="label-text font-medium">First name</span>
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="First name"
                    className={`input input-bordered w-full ${profileErrors.first_name ? "input-error" : ""}`}
                    value={profile.first_name}
                    onChange={handleProfileChange}
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="given-name"
                  />
                  {profileErrors.first_name && (
                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {profileErrors.first_name[0]}
                    </p>
                  )}
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="last_name">
                    <span className="label-text font-medium">Last name</span>
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Last name"
                    className={`input input-bordered w-full ${profileErrors.last_name ? "input-error" : ""}`}
                    value={profile.last_name}
                    onChange={handleProfileChange}
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="family-name"
                  />
                  {profileErrors.last_name && (
                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {profileErrors.last_name[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email address
                  </span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`input input-bordered w-full ${profileErrors.email ? "input-error" : ""}`}
                  value={profile.email}
                  onChange={handleProfileChange}
                  autoComplete="email"
                />
                {profileErrors.email && (
                  <p className="text-error text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {profileErrors.email[0]}
                  </p>
                )}
              </div>

              <div className="form-control">
                <label className="label" htmlFor="username">
                  <span className="label-text font-medium flex items-center gap-2">
                    <AtSign className="w-4 h-4" />
                    Username
                  </span>
                  <span className="label-text-alt">Letters, numbers, underscores. 3–150 characters.</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  className={`input input-bordered w-full ${profileErrors.username ? "input-error" : ""}`}
                  value={profile.username}
                  onChange={handleProfileChange}
                  minLength={MIN_USERNAME_LENGTH}
                  maxLength={MAX_USERNAME_LENGTH}
                  autoComplete="username"
                />
                {profileErrors.username && (
                  <p className="text-error text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {profileErrors.username[0]}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  className="btn btn-warning gap-2"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save changes
                </button>
                <Link href="/profile" className="btn btn-ghost">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="card bg-base-200/50 border border-base-300 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title gap-2 text-lg mb-4">
            <Shield className="w-5 h-5 text-warning" />
            Security — change password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label" htmlFor="current_password">
                <span className="label-text font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Current password
                </span>
              </label>
              <div className="relative">
                <input
                  id="current_password"
                  name="current_password"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${passwordErrors.current_password ? "input-error" : ""}`}
                  value={password.current_password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                  onClick={() => toggleShowPassword("current")}
                  aria-label={showPasswords.current ? "Hide password" : "Show password"}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.current_password && (
                <p className="text-error text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {passwordErrors.current_password[0]}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="new_password">
                <span className="label-text font-medium">New password</span>
                <span className="label-text-alt">At least 8 characters, not too common.</span>
              </label>
              <div className="relative">
                <input
                  id="new_password"
                  name="new_password"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${passwordErrors.new_password ? "input-error" : ""}`}
                  value={password.new_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                  onClick={() => toggleShowPassword("new")}
                  aria-label={showPasswords.new ? "Hide password" : "Show password"}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.new_password && (
                <p className="text-error text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {passwordErrors.new_password[0]}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="new_password_confirm">
                <span className="label-text font-medium">Confirm new password</span>
              </label>
              <div className="relative">
                <input
                  id="new_password_confirm"
                  name="new_password_confirm"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${passwordErrors.new_password_confirm ? "input-error" : ""}`}
                  value={password.new_password_confirm}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                  onClick={() => toggleShowPassword("confirm")}
                  aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.new_password_confirm && (
                <p className="text-error text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {passwordErrors.new_password_confirm[0]}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-warning gap-2"
              disabled={savingPassword || !password.current_password || !password.new_password || !password.new_password_confirm}
            >
              {savingPassword ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Update password
            </button>
          </form>
        </div>
      </div>

      {/* Account info (read-only) */}
      <div className="card bg-base-200/30 border border-base-300 shadow mb-6">
        <div className="card-body py-4 space-y-2">
          {dateJoined && (
            <p className="flex items-center gap-2 text-sm text-base-content/60">
              <Calendar className="w-4 h-4 shrink-0" />
              Member since {new Date(dateJoined).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          )}
          <p className="flex items-center gap-2 text-sm text-base-content/60">
            <Shield className="w-4 h-4 shrink-0" />
            Account details are saved securely. After changing your password, use the new one to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
