import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import useAuthStore from '../../store/authStore';

const GET_ME = gql`
  query Me {
    me {
      _id
      email
      name
      role
      saldo
      avatar
      is_email_verified
      created_at
    }
  }
`;

const Profile = () => {
  const { data, loading, error } = useQuery(GET_ME);
  const { updateProfile: updateAuthProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar: ''
  });

  React.useEffect(() => {
    if (data?.me) {
      setFormData({
        name: data.me.name || '',
        avatar: data.me.avatar || ''
      });
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await updateAuthProfile(formData.name);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-red-600 p-4">Error: {error.message}</div>;

  const user = data?.me;

  return (
    <div className="w-full py-6 px-2 sm:px-4">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#f16634]">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-2 bg-[#f16634] text-white rounded-full font-semibold shadow hover:bg-[#d45528] transition"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="flex items-center space-x-8 mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-[#f16634] shadow">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-600 font-bold">{user?.name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name}</h2>
            <p className="text-gray-600 mb-1">{user?.email}</p>
            <span className="inline-block px-3 py-1 bg-[#f16634]/10 text-[#f16634] text-sm rounded-full font-bold shadow">
              {user?.role}
            </span>
          </div>
        </div>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f16634] focus:border-[#f16634]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f16634] focus:border-[#f16634]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 border-2 border-[#f16634] text-[#f16634] rounded-full font-semibold hover:bg-[#f16634]/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#f16634] text-white rounded-full font-semibold shadow hover:bg-[#d45528] transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 font-semibold">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="text-gray-900 font-semibold capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="text-gray-900 font-semibold">
                  {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                <p className="text-gray-900 font-semibold">
                  {user?.is_email_verified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;