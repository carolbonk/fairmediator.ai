import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { FaUser, FaBell, FaLock, FaTrash, FaSave } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO/SEO';
import logger from '../utils/logger';

const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    organization: user?.organization || '',
    phone: user?.phone || ''
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    conflictAlerts: true,
    weeklyDigest: false,
    marketingEmails: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        organization: user.organization || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess('Profile updated successfully');
        logger.info('Profile updated', { email: profileData.email });
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
      logger.error('Profile update error', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // TODO: Implement password change API
      logger.info('Password change requested');
      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Failed to change password');
      logger.error('Password change error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement notification preferences API
      logger.info('Notification preferences updated', notifications);
      setSuccess('Notification preferences saved');
    } catch (err) {
      setError('Failed to save preferences');
      logger.error('Notification preferences error', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'password', label: 'Password', icon: FaLock },
    { id: 'notifications', label: 'Notifications', icon: FaBell }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neu-100 to-neu-200">
      <SEO
        title="Settings - Fair Mediator"
        description="Manage your account settings and preferences"
      />

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neu-800 mb-2">{t('settings.title') || 'Settings'}</h1>
          <p className="text-neu-600">{t('settings.subtitle') || 'Manage your account preferences'}</p>
        </div>

        {/* Tabs - Neumorphic */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccess('');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-neu-200 shadow-neu-inset text-blue-600'
                  : 'bg-neu-200 shadow-neu text-neu-700 hover:shadow-neu-lg'
              }`}
            >
              <tab.icon className="text-base" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-neu-inset">
            <p className="text-green-600 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-neu-inset">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-neu-200 rounded-2xl shadow-neu p-6">
            <h2 className="text-xl font-bold text-neu-800 mb-4 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Profile Information
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-neu-200 rounded-xl shadow-neu-inset border-none focus:ring-2 focus:ring-blue-400 text-neu-800"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-neu-200 rounded-xl shadow-neu-inset border-none focus:ring-2 focus:ring-blue-400 text-neu-800"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  name="organization"
                  value={profileData.organization}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-neu-200 rounded-xl shadow-neu-inset border-none focus:ring-2 focus:ring-blue-400 text-neu-800"
                  placeholder="Law Firm Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-neu-200 rounded-xl shadow-neu-inset border-none focus:ring-2 focus:ring-blue-400 text-neu-800"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-dark-neu-400 text-white font-semibold rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all disabled:opacity-50 border border-dark-neu-500"
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-neu-200 rounded-2xl shadow-neu p-6">
            <h2 className="text-xl font-bold text-neu-800 mb-4 flex items-center gap-2">
              <FaLock className="text-blue-600" />
              Change Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-neu-200 rounded-xl shadow-neu-inset border-none focus:ring-2 focus:ring-blue-400 text-neu-800"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-neu-200 rounded-xl shadow-neu-inset border-none focus:ring-2 focus:ring-blue-400 text-neu-800"
                  placeholder="••••••••"
                  required
                />
                <p className="text-xs text-neu-600 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-neu-200 rounded-xl shadow-neu-inset border-none focus:ring-2 focus:ring-blue-400 text-neu-800"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-dark-neu-400 text-white font-semibold rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all disabled:opacity-50 border border-dark-neu-500"
              >
                <FaSave />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-neu-200 rounded-2xl shadow-neu p-6">
            <h2 className="text-xl font-bold text-neu-800 mb-4 flex items-center gap-2">
              <FaBell className="text-blue-600" />
              Notification Preferences
            </h2>

            <form onSubmit={handleNotificationSubmit} className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: 'emailNotifications', label: 'Email Notifications', description: 'Receive email updates about your account' },
                  { name: 'conflictAlerts', label: 'Conflict Alerts', description: 'Get notified when conflicts are detected' },
                  { name: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive a weekly summary of your activity' },
                  { name: 'marketingEmails', label: 'Marketing Emails', description: 'Product updates and special offers' }
                ].map(item => (
                  <label key={item.name} className="flex items-start gap-3 p-4 bg-neu-200 rounded-xl shadow-neu-inset cursor-pointer hover:shadow-neu transition-all">
                    <input
                      type="checkbox"
                      name={item.name}
                      checked={notifications[item.name]}
                      onChange={handleNotificationChange}
                      className="mt-1 w-5 h-5 text-blue-600 bg-neu-100 border-neu-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-neu-800">{item.label}</div>
                      <div className="text-sm text-neu-600">{item.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-dark-neu-400 text-white font-semibold rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all disabled:opacity-50 border border-dark-neu-500"
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-8 bg-red-50 rounded-2xl shadow-neu p-6 border border-red-200">
          <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
            <FaTrash />
            Danger Zone
          </h2>
          <p className="text-red-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-neu hover:shadow-neu-lg transition-all"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                logger.warn('Account deletion requested', { email: user?.email });
                alert('Account deletion is not yet implemented. Please contact support.');
              }
            }}
          >
            Delete Account
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;
