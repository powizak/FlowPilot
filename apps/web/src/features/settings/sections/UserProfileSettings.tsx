import React, { useState, useEffect } from 'react';
import { ApiResponse } from '@flowpilot/shared';
import { api } from '../../../lib/api';
import { useToast } from './GeneralSettings';
import { useAuthStore } from '../../../stores/auth';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function UserProfileSettings() {
  const { showToast, ToastComponent } = useToast();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || '',
  });

  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [userSettings, setUserSettings] = useState({
    locale: 'en',
    timezone: 'UTC',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { data: profile },
        } = await api.get<ApiResponse<UserProfile>>('/users/me');
        setProfile({
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl || '',
        });
      } catch {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { data: updated },
      } = await api.put<ApiResponse<UserProfile>>('/users/me', {
        name: profile.name,
        avatarUrl: profile.avatarUrl ? profile.avatarUrl : null,
      });
      setProfile({
        name: updated.name,
        email: updated.email,
        avatarUrl: updated.avatarUrl || '',
      });
      useAuthStore.setState((state) =>
        state.user
          ? {
              user: {
                ...state.user,
                name: updated.name,
                avatarUrl: updated.avatarUrl ?? null,
              },
            }
          : state,
      );
      showToast('Profile updated');
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (password.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await api.put('/users/me', { password: password.newPassword });
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showToast('Password updated');
    } catch {
      showToast('Failed to update password', 'error');
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/users/me/settings', userSettings);
      showToast('User settings updated');
    } catch {
      showToast('Failed to update settings', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-medium text-gray-100">User Profile</h2>

      <section>
        <h3 className="text-lg font-medium text-gray-300 mb-4 border-b border-gray-700 pb-2">
          Profile Information
        </h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label
                  htmlFor="profile-avatar-url"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Avatar URL
                </label>
                <input
                  id="profile-avatar-url"
                  type="text"
                  value={profile.avatarUrl}
                  onChange={(e) =>
                    setProfile({ ...profile, avatarUrl: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              readOnly
              value={profile.email}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-500 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Update Profile
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-lg font-medium text-gray-300 mb-4 border-b border-gray-700 pb-2">
          Preferences
        </h3>
        <form onSubmit={handleSettingsSave} className="space-y-4">
          <div>
            <label
              htmlFor="profile-locale"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Personal Locale Override
            </label>
            <select
              id="profile-locale"
              value={userSettings.locale}
              onChange={(e) =>
                setUserSettings({ ...userSettings, locale: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="en">English (EN)</option>
              <option value="cs">Czech (CS)</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Save Preferences
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-lg font-medium text-gray-300 mb-4 border-b border-gray-700 pb-2">
          Security
        </h3>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label
              htmlFor="profile-current-password"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Current Password
            </label>
            <input
              id="profile-current-password"
              type="password"
              value={password.currentPassword}
              onChange={(e) =>
                setPassword({ ...password, currentPassword: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="profile-new-password"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              New Password
            </label>
            <input
              id="profile-new-password"
              type="password"
              value={password.newPassword}
              onChange={(e) =>
                setPassword({ ...password, newPassword: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="profile-confirm-password"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="profile-confirm-password"
              type="password"
              value={password.confirmPassword}
              onChange={(e) =>
                setPassword({ ...password, confirmPassword: e.target.value })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Change Password
          </button>
        </form>
      </section>

      {ToastComponent}
    </div>
  );
}
