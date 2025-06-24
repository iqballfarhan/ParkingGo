import React from 'react';
import { UserIcon, CameraIcon } from '@heroicons/react/24/outline';

const ProfileCard = ({ user, onEditProfile, onEditAvatar, loading = false }) => {
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onEditAvatar(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-6">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          {/* Upload Avatar Button */}
          <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
            <CameraIcon className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Loading...'}</h2>
          <p className="text-gray-600">{user?.email}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user?.role}
            </span>
            {user?.is_email_verified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Email Verified
              </span>
            )}
          </div>
          
          {/* Saldo */}
          <div className="mt-4">
            <span className="text-sm text-gray-600">Saldo: </span>
            <span className="text-lg font-semibold text-green-600">
              Rp {user?.saldo?.toLocaleString('id-ID') || '0'}
            </span>
          </div>
        </div>

        {/* Edit Button */}
        <div>
          <button
            onClick={onEditProfile}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Edit Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
