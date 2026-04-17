import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Users } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        const fetchedUser = response.data?.user || null;
        setProfile(fetchedUser);
        setUsername(fetchedUser?.username || '');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedUsername = username.trim();
    const usernameChanged = trimmedUsername && trimmedUsername !== (profile?.username || '');
    const passwordChanged = Boolean(newPassword);

    if (!usernameChanged && !passwordChanged) {
      toast.error('No changes to save');
      return;
    }

    if (passwordChanged) {
      if (!currentPassword) {
        toast.error('Current password is required');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New password and confirm password must match');
        return;
      }
    }

    const payload = {};
    if (usernameChanged) {
      payload.username = trimmedUsername;
    }
    if (passwordChanged) {
      payload.currentPassword = currentPassword;
      payload.password = newPassword;
    }

    try {
      setIsSubmitting(true);
      const response = await api.put('/auth/profile', payload);
      const updatedUser = response.data?.user;
      setProfile(updatedUser);
      setUsername(updatedUser?.username || '');
      updateUser({
        ...user,
        ...updatedUser
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(response.data?.message || 'Profile updated');
    } catch (error) {
      const data = error.response?.data;
      if (Array.isArray(data?.errors) && data.errors[0]?.msg) {
        toast.error(data.errors[0].msg);
      } else {
        toast.error(data?.error || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="h-1 bg-cyber-green w-12 rounded-full"></div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Profile
          </h1>
        </div>

        {loading ? (
          <div className="cyber-card p-8 text-center">
            <p className="text-white/60 font-mono">Loading profile...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="cyber-card p-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-cyber-blue mb-6">Profile Info</h2>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50 inline-flex items-center gap-2"><User className="h-4 w-4" />Username</span>
                  <span className="text-white font-bold">{profile?.username || '-'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50 inline-flex items-center gap-2"><Mail className="h-4 w-4" />Email</span>
                  <span className="text-white font-bold">{profile?.email || '-'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50 inline-flex items-center gap-2"><Users className="h-4 w-4" />Team</span>
                  <span className="text-white font-bold">{profile?.teamName || 'No team yet'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Joined</span>
                  <span className="text-white font-bold">{profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : '-'}</span>
                </div>
              </div>
            </div>

            <div className="cyber-card p-6">
              <h2 className="text-xl font-black uppercase tracking-widest text-cyber-green mb-6">Update Profile</h2>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">
                    Username
                  </label>
                  <input
                    type="text"
                    className="cyber-input w-full font-mono text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="cyber-input w-full font-mono text-sm"
                    placeholder="Required only to change password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="cyber-input w-full font-mono text-sm"
                    placeholder="Leave blank to keep current password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="cyber-input w-full font-mono text-sm"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cyber-button w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Profile;
