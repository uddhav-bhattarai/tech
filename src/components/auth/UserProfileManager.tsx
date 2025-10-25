/**
 * User Profile Management Component
 * Comprehensive user profile with settings, preferences, and security
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  UserIcon, 
  CogIcon, 
  ShieldCheckIcon, 
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  HeartIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'

interface ProfileFormData {
  name: string
  username: string
  bio: string
  website: string
  location: string
  social: {
    twitter: string
    linkedin: string
    github: string
  }
}

interface PreferencesFormData {
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  language: string
  timezone: string
  newsletter: boolean
  publicProfile: boolean
}

export default function UserProfileManager() {
  const { data: session, update } = useSession()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'stats'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    username: '',
    bio: '',
    website: '',
    location: '',
    social: {
      twitter: '',
      linkedin: '',
      github: ''
    }
  })

  const [preferencesData, setPreferencesData] = useState<PreferencesFormData>({
    theme: 'light',
    notifications: true,
    language: 'en',
    timezone: 'UTC',
    newsletter: false,
    publicProfile: true
  })

  const [userStats, setUserStats] = useState({
    articlesPublished: 0,
    devicesReviewed: 0,
    commentsPosted: 0,
    favoriteDevices: 0,
    totalViews: 0
  })

  useEffect(() => {
    if (session?.user) {
      // Initialize form data with current user data
      setProfileData({
        name: session.user.name || '',
        username: session.user.username || '',
        bio: '',
        website: '',
        location: '',
        social: {
          twitter: '',
          linkedin: '',
          github: ''
        }
      })
    }
  }, [session])

  const handleProfileSave = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileData.name,
          username: profileData.username,
          bio: profileData.bio,
          website: profileData.website,
          location: profileData.location,
          social: profileData.social
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      // Update session
      await update({
        name: profileData.name
      })

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesSave = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: preferencesData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update preferences')
      }

      setSuccess('Preferences updated successfully!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update preferences')
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (roleName?: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      ADMIN: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      MODERATOR: { color: 'bg-purple-100 text-purple-800', label: 'Moderator' },
      EDITOR: { color: 'bg-blue-100 text-blue-800', label: 'Editor' },
      REVIEWER: { color: 'bg-green-100 text-green-800', label: 'Reviewer' },
      USER: { color: 'bg-gray-100 text-gray-800', label: 'User' }
    }

    const config = roleConfig[roleName || 'USER'] || roleConfig.USER

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Not Signed In</h3>
          <p className="text-gray-500">Please sign in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                {session.user.image ? (
                  <Image 
                    src={session.user.image} 
                    alt="Profile" 
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.user.name || 'User'}</h1>
                <p className="text-gray-500">{session.user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {getRoleBadge(session.user.role?.name)}
                  {session.user.verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'profile', label: 'Profile', icon: UserIcon },
                { id: 'preferences', label: 'Preferences', icon: CogIcon },
                { id: 'security', label: 'Security', icon: ShieldCheckIcon },
                { id: 'stats', label: 'Statistics', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'preferences' | 'security' | 'stats')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 rounded-md bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleProfileSave}
                        disabled={loading}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CheckIcon className="h-4 w-4" />
                        <span>{loading ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setError('')
                          setSuccess('')
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.name || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.username || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.bio || 'No bio provided'}</p>
                    )}
                  </div>

                  {/* Location & Website */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="City, Country"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.location || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      {isEditing ? (
                        <input
                          type="url"
                          value={profileData.website}
                          onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profileData.website ? (
                            <a 
                              href={profileData.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {profileData.website}
                            </a>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Account Preferences</h3>
                  <button
                    onClick={handlePreferencesSave}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme Preference
                    </label>
                    <select
                      value={preferencesData.theme}
                      onChange={(e) => setPreferencesData(prev => ({ 
                        ...prev, 
                        theme: e.target.value as 'light' | 'dark' | 'auto' 
                      }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (system)</option>
                    </select>
                  </div>

                  {/* Boolean Preferences */}
                  <div className="space-y-4">
                    {[
                      { key: 'notifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                      { key: 'newsletter', label: 'Newsletter', description: 'Subscribe to our weekly newsletter' },
                      { key: 'publicProfile', label: 'Public Profile', description: 'Make your profile visible to other users' }
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{pref.label}</h4>
                          <p className="text-sm text-gray-500">{pref.description}</p>
                        </div>
                        <button
                          type="button"
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            preferencesData[pref.key as keyof typeof preferencesData] 
                              ? 'bg-blue-600' 
                              : 'bg-gray-200'
                          }`}
                          onClick={() => setPreferencesData(prev => ({
                            ...prev,
                            [pref.key]: !prev[pref.key as keyof typeof prev]
                          }))}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferencesData[pref.key as keyof typeof preferencesData] 
                                ? 'translate-x-6' 
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center space-x-3">
                      <KeyIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Password</h4>
                        <p className="text-sm text-gray-500">Last changed: Never</p>
                      </div>
                    </div>
                    <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                      Change Password
                    </button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center space-x-3">
                      <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Not enabled</p>
                      </div>
                    </div>
                    <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Your Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <PencilIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Articles Published</p>
                        <p className="text-2xl font-bold text-blue-900">{userStats.articlesPublished}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <EyeIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Devices Reviewed</p>
                        <p className="text-2xl font-bold text-green-900">{userStats.devicesReviewed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <HeartIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Comments Posted</p>
                        <p className="text-2xl font-bold text-purple-900">{userStats.commentsPosted}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <HeartIcon className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600">Favorite Devices</p>
                        <p className="text-2xl font-bold text-yellow-900">{userStats.favoriteDevices}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-600">Total Views</p>
                        <p className="text-2xl font-bold text-indigo-900">{userStats.totalViews.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <UserIcon className="h-8 w-8 text-gray-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Member Since</p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}