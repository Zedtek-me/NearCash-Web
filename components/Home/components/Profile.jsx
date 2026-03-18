import React, { useState, useEffect } from 'react';
import { Mail, Phone, Edit2, Save, X, Camera, CheckCircle, User } from 'lucide-react';
import { UpdateUserMutation } from '../../Auths/mutations/userMutations';
import useAuth from '../../../hooks/useAuth';
import { useMutation } from '@apollo/client';
import Navbar from '../Navs/Headers';
import toast from 'react-hot-toast';
import { cloudinaryName, cloudinaryPreset } from '../../../configs/environs';

// ── Reusable field ─────────────────────────────────────────────────────────────

function Field({ label, name, value, isEditing, onChange, placeholder, type = 'text', icon, disabled = false }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
        {icon}
        {label}
      </label>
      {isEditing && !disabled ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 text-sm transition-all outline-none"
        />
      ) : (
        <div className={`px-4 py-3 rounded-xl border text-sm ${
          disabled
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-50 border-gray-100 text-gray-700'
        }`}>
          {value || '—'}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { userData, updateUser } = useAuth();
  const [updateUserInfo, { loading }] = useMutation(UpdateUserMutation);

  const [isEditing, setIsEditing]     = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading]   = useState(false);

  const [formData, setFormData] = useState({
    firstName:   '',
    lastName:    '',
    username:    '',
    phoneNumber: '',
    picture:     '',
  });

  const CLOUDINARY_UPLOAD_PRESET = cloudinaryPreset;
  const CLOUDINARY_CLOUD_NAME    = cloudinaryName;

  useEffect(() => {
    if (!userData) return;
    let parsedMeta = {};
    if (typeof userData.meta === 'string') {
      try { parsedMeta = JSON.parse(userData.meta); } catch {}
    } else if (typeof userData.meta === 'object' && userData.meta !== null) {
      parsedMeta = userData.meta;
    }
    setFormData({
      firstName:   userData.firstName   || '',
      lastName:    userData.lastName    || '',
      username:    userData.username    || '',
      phoneNumber: userData.phoneNumber || '',
      picture:     parsedMeta.picture   || '',
    });
    if (parsedMeta.picture) setProfileImage(parsedMeta.picture);
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024)   { toast.error('Image size should be less than 5MB'); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    fd.append('folder', 'profile_pictures');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: fd }
    );
    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      let imageUrl = formData.picture;
      if (selectedFile) {
        toast.loading('Uploading image…', { id: 'upload' });
        imageUrl = await uploadToCloudinary(selectedFile);
        toast.success('Image uploaded!', { id: 'upload' });
      }
      await updateUserInfo({
        variables: {
          data: {
            firstName:   formData.firstName,
            lastName:    formData.lastName,
            username:    formData.username,
            phoneNumber: formData.phoneNumber,
            picture:     imageUrl,
          },
        },
      }).then(({ data }) => {
        const { message, user: updatedUser } = data?.updateUser || {};
        toast.success(message || 'Profile updated successfully!');
        setFormData(prev => ({ ...prev, picture: imageUrl }));
        setSelectedFile(null);
        if (updatedUser) updateUser(updatedUser);
      }).catch((err) => {
        toast.error(err?.message || 'Failed to update profile');
      });
      setIsEditing(false);
    } catch {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName:   userData.firstName   || '',
      lastName:    userData.lastName    || '',
      username:    userData.username    || '',
      phoneNumber: userData.phoneNumber || '',
      picture:     userData.picture     || '',
    });
    setProfileImage(userData.picture || null);
    setSelectedFile(null);
    setIsEditing(false);
  };

  const getInitials = () => {
    const first = formData.firstName?.[0] || userData?.email?.[0] || '';
    const last  = formData.lastName?.[0]  || '';
    return (first + last).toUpperCase() || 'U';
  };

  const isLoading    = loading || isUploading;
  const displayName  = formData.firstName && formData.lastName
    ? `${formData.firstName} ${formData.lastName}`
    : formData.firstName || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userData} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">

        {/* ── Hero card ── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-700 text-white text-2xl sm:text-3xl font-bold flex items-center justify-center overflow-hidden ring-4 ring-white/20">
                {profileImage
                  ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  : getInitials()
                }
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
                    className={`absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-slate-900 shadow-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Camera size={14} />
                  </label>
                </>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{displayName}</h2>
              <p className="text-slate-400 text-sm mt-0.5">@{formData.username || 'username'}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-white/10 text-slate-200 text-xs font-medium rounded-full border border-white/20">
                  {userData?.userType}
                </span>
                {selectedFile && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle size={12} /> New image selected
                  </span>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex-shrink-0">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
                >
                  <Edit2 size={15} /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-white/30 text-slate-200 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <X size={15} /> Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        {isUploading ? 'Uploading…' : 'Saving…'}
                      </>
                    ) : (
                      <><Save size={15} /> Save</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Personal information ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="First Name" name="firstName" value={formData.firstName}
              isEditing={isEditing} onChange={handleInputChange} placeholder="Enter your first name"
            />
            <Field
              label="Last Name" name="lastName" value={formData.lastName}
              isEditing={isEditing} onChange={handleInputChange} placeholder="Enter your last name"
            />
            <Field
              label="Username" name="username" value={formData.username}
              isEditing={isEditing} onChange={handleInputChange} placeholder="Enter your username"
            />
          </div>
        </div>

        {/* ── Contact information ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                <Mail size={13} className="text-gray-400" /> Email Address
              </label>
              <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed">
                {userData?.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <Field
              label="Phone Number" name="phoneNumber" value={formData.phoneNumber}
              isEditing={isEditing} onChange={handleInputChange}
              placeholder="Enter your phone number" type="tel"
              icon={<Phone size={13} className="text-gray-400" />}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
