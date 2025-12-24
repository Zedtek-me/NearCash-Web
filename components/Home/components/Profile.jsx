import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Edit2, Save, X, Camera, CheckCircle } from 'lucide-react';
import { UpdateUserMutation } from '../../Auths/mutations/userMutations';
import useAuth from '../../../Hooks/Auths';
import { useMutation } from '@apollo/client';
import Navbar from '../Navs/Headers';
import toast from 'react-hot-toast';
import { cloudinaryName, cloudinaryPreset } from '../../../configs/environs';

export default function ProfilePage() {
  const { updateUser, clearUser, userData } = useAuth();
  const [updateUserInfo, { loading }] = useMutation(UpdateUserMutation);

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    picture: ''
  });

  const CLOUDINARY_UPLOAD_PRESET = cloudinaryPreset;
  const CLOUDINARY_CLOUD_NAME = cloudinaryName;

  useEffect(() => {
  if (!userData) return;

  let parsedMeta = {};

  if (typeof userData.meta === 'string') {
    try {
      parsedMeta = JSON.parse(userData.meta);
      console.log('Parsed meta:', parsedMeta);
      
    } catch (e) {
      parsedMeta = {};
    }
  } else if (typeof userData.meta === 'object' && userData.meta !== null) {
    parsedMeta = userData.meta;
      console.log('Parsed metattttt:', parsedMeta);

  }

  setFormData({
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    username: userData.username || '',
    phoneNumber: userData.phoneNumber || '',
    picture: parsedMeta.picture || '',
  });

  if (parsedMeta.picture) {
    setProfileImage(parsedMeta.picture);
  }
}, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'profile_pictures');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      let imageUrl = formData.picture;

      if (selectedFile) {
        toast.loading('Uploading image...', { id: 'upload' });
        imageUrl = await uploadToCloudinary(selectedFile);
        toast.success('Image uploaded successfully!', { id: 'upload' });
      }

      await updateUserInfo({
        variables: {
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            phoneNumber: formData.phoneNumber,
            picture: imageUrl
          }
        }
      }).then(({ data }) => {
        const { message, user } = data?.updateUser || {};
        toast.success(message || 'Profile updated successfully!');
        
        setFormData(prev => ({
          ...prev,
          picture: imageUrl
        }));
        
        setSelectedFile(null);
      }).catch((err) => {
        toast.error(err?.message || 'Failed to update profile');
      });

      setShowSuccess(true);
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      username: userData.username || '',
      phoneNumber: userData.phoneNumber || '',
      picture: userData.picture || ''
    });
    setProfileImage(userData.picture || null);
    setSelectedFile(null);
    setIsEditing(false);
  };

  const getInitials = () => {
    const first = formData.firstName?.[0] || userData.email?.[0] || '';
    const last = formData.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const isLoading = loading || isUploading;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={userData} />
      <div className="border-b border-gray-200 mt-14">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="md:flex items-center justify-between space-y-2">
            <div>
              <h1 className="text-3xl font-bold text-black">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account information</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isUploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white border-2 border-black rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-black mb-6">Profile Picture</h2>
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-black text-white text-4xl font-bold flex items-center justify-center overflow-hidden border-4 border-black">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              {isEditing && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="profile-image"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="profile-image"
                    className={`absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors border-2 border-white shadow-lg ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Camera size={18} />
                  </label>
                </>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-black mb-1">
                {formData.firstName && formData.lastName 
                  ? `${formData.firstName} ${formData.lastName}`
                  : formData.firstName || 'User'}
              </h3>
              <p className="text-gray-600 mb-2">@{formData.username || 'username'}</p>
              <span className="inline-block px-4 py-1 bg-black text-white text-sm font-medium rounded-full">
                {userData.userType}
              </span>
              {selectedFile && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle size={14} />
                  New image selected
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-black rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-black mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-gray-900">{formData.firstName || '—'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-gray-900">{formData.lastName || '—'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-gray-900">{formData.username || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold text-black mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-100 rounded-lg border-2 border-gray-300 cursor-not-allowed">
                <p className="text-gray-600">{userData.email}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 flex items-center gap-2">
                <Phone size={16} />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-gray-900">{formData.phoneNumber || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}