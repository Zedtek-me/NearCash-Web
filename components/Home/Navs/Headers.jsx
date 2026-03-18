import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  MapPin,
  User,
  Bell,
  Heart,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useQuery } from '@apollo/client';
import { GET_ALL_NOTIFICATION } from '../../Auths/queries/userQueries';
import { UPDATE_NOTIFICATION } from '../../Auths/mutations/userMutations';
import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { useWebSocket } from '../../Notification/WebSocketProvider';
import { PUSH_NOTIF_MSG_TYPES } from '../../Notification/web-socket';
import useAuth from '../../../hooks/useAuth';

const Navbar = ({ currentPage = 'home' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const socket = useWebSocket();
  const { userData: user } = useAuth();
  const { userType, id } = (user || {});
  const buzId = localStorage.getItem("selected_business");

  const profilePicture = (() => {
    try {
      const meta = typeof user?.meta === 'string' ? JSON.parse(user.meta) : (user?.meta || {});
      return meta?.picture || null;
    } catch { return null; }
  })();
  
  const notificationVariables = {
   businessId: buzId,
    userId: id,
  }

  if (userType === "VENDOR") delete notificationVariables.userId;
  else delete notificationVariables.businessId;

  const { data: notifData, refetch: notifRefetch } = useQuery(GET_ALL_NOTIFICATION, {
  variables: notificationVariables,
  fetchPolicy: "network-only",
  skip: !(id || buzId),
  });

  const [updateNotificationStatus] = useMutation(UPDATE_NOTIFICATION);


  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showNotifications]);


  useEffect(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const handleSocketMessage = (event) => {
      const data = JSON.parse(event.data);
      const { message_type } = (
        data instanceof Object && !Array.isArray(data) ? data : { message_type: data }
      );
      if(PUSH_NOTIF_MSG_TYPES.includes(message_type)) {
        notifRefetch();
      }
    };
    socket.addEventListener('message', handleSocketMessage);

    return () => {
      socket.removeEventListener('message', handleSocketMessage);
    };
  }, [socket]);

  const userMenuItems = [
    { name: 'Category', href: '/category', icon: Heart },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Transaction Policy', href: '/policy', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Logout', href: 'logout', icon: LogOut },
  ];

  const notifPagination = notifData?.pagination
  const notificationCount =  (
    notifPagination?.totalUnreadItems || 0
  );
  const notificationData = notifData?.notifications || [];

  const handleNavigation = (href) => {
    if (href === 'logout') {
      localStorage.removeItem('nearcash_token');
      localStorage.removeItem("userLocation");
      localStorage.removeItem("selected_business");
      localStorage.removeItem("auth_type");
      setIsOpen(false);
      return navigate('/auth/login');
    }
    setIsOpen(false);
    setShowUserMenu(false);
    navigate(href);
  };

  const handleViewNotification = async (item) => {

      try {
      await updateNotificationStatus({ variables: { notificationId: item.id, status: "READ" } });
      notifRefetch();
    } catch (err) {
      toast.error(err.message || "Failed to update notification status");
    }

    const parsedMeta = JSON.parse(item?.meta);
    const txnId = parsedMeta?.txn_info?.txn_id;
    setShowNotifications(!showNotifications);
    navigate(`/transaction-details/${txnId}`)
  }


  const NotificationDropdown = () => (
    <div className="absolute right-[-55px] md:right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
  {notificationData.map((notification) => {
    const isUnread = notification.status !== "READ";
    return (
      <div
        key={notification.id}
        onClick={() => handleViewNotification(notification)}
        className={`
          p-4 border-b border-gray-100 last:border-b-0 
          flex items-start gap-3 cursor-pointer
          hover:bg-gray-50
          ${isUnread ? "bg-gray-50" : "bg-white"}
        `}
      >
        {isUnread && (
          <span className="mt-1 w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
        )}

        <div className="flex-1">
          <p className={`text-sm mb-1 ${isUnread ? "font-medium text-gray-700" : "font-bold text-gray-900"}`}>
            {notification?.title}
          </p>

          <p className="text-xs text-gray-500">
            {notification?.message}
          </p>

          <p className="text-xs text-gray-400 text-right font-semibold mt-1">
            {new Date(notification.dateCreated).toLocaleString()}
          </p>
        </div>
      </div>
    );
  })}
</div>
      <div className="p-3 text-center border-t border-gray-100">
        <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          View All Notifications
        </button>
      </div>
    </div>
  );

  const UserDropdown = () => (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-800 truncate">{user?.fullName || 'John Doe'}</p>
        <p className="text-sm text-gray-500 truncate">{user?.email || 'john@example.com'}</p>
      </div>
      <div className="py-2">
        {
          (userType?.toLowerCase() === "client" 
            ? userMenuItems.filter((item) => ["profile", "settings", "logout"].includes(item.name.toLowerCase())) 
            : userMenuItems
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="w-full flex items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </button>
            );
          })
        }
      </div>
    </div>
  );

  // Get filtered menu items based on user type
  const getFilteredMenuItems = () => {
    if (userType?.toLowerCase() === "client") {
      return userMenuItems.filter((item) => 
        ["profile", "settings", "logout"].includes(item.name.toLowerCase())
      );
    }
    return userMenuItems;
  };

  return (
    <>
      <nav className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-emerald-100/50'
          : 'bg-white shadow-sm'
        }
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate("/")}>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">NearCash</span>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative notification-container">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </button>
                {showNotifications && <NotificationDropdown />}
              </div>

              <div className="relative user-menu-container">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center overflow-hidden">
                    {profilePicture
                      ? <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      : <User size={16} className="text-white" />
                    }
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                {showUserMenu && <UserDropdown />}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <div className="relative notification-container">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </button>
                {showNotifications && <NotificationDropdown />}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className="menu-button p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Simplified without complex transitions */}
      {isOpen && (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-30 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="relative bg-white h-full overflow-y-auto shadow-xl">
            <div className="px-4 py-4 space-y-2">
              
              {/* User Info Section */}
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profilePicture
                      ? <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      : <User size={24} className="text-white" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{user?.fullName || 'John Doe'}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.email || 'john@example.com'}</p>
                  </div>
                </div>
              </div>
              
              {/* User Menu Items */}
              <div className="space-y-1 py-2">
                {getFilteredMenuItems().map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150 active:bg-gray-200"
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      <span className="font-medium text-base">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;