import React, { useState, useEffect } from 'react';
import {
  MapPin,
  User,
  Bell,
  Heart,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useQuery } from '@apollo/client';
import { GET_ALL_NOTIFICATION } from '../../Auths/queries/userQueries';
import { UPDATE_NOTIFICATION } from '../../Auths/mutations/userMutations';
import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { useWebSocket } from '../../Notification/WebSocketProvider';
import { PUSH_NOTIF_MSG_TYPES } from '../../Notification/web-socket';
import useAuth from '../../../hooks/useAuth';
import { getPrimaryNavItems } from './navItems';

const Navbar = ({ currentPage = 'home' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useWebSocket();
  const { userData: user } = useAuth();
  const { userType, id } = (user || {});
  const buzId = localStorage.getItem("selected_business");

  // Desktop top-nav icon links (FX Rate / Cross Border) — Home is skipped
  // here since the logo already serves that role on larger screens.
  const basePath = `/dashboard/${userType?.toLowerCase() || 'client'}`;
  const desktopNavItems = getPrimaryNavItems(basePath).filter((item) => item.key !== 'home');

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

  const notifPagination = notifData?.notificationPagination
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
      return navigate('/auth/login');
    }
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
    <div className="absolute -right-12 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 md:-right-16">
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
          <span className="mt-1 w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <p className={`mb-1 break-words text-sm ${isUnread ? "font-medium text-gray-700" : "font-bold text-gray-900"}`}>
            {notification?.title}
          </p>

          <p className="break-words text-xs text-gray-500">
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
        <button className="text-sm text-slate-700 hover:text-slate-900 font-medium">
          View All Notifications
        </button>
      </div>
    </div>
  );

  const UserDropdown = () => (
    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
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

  return (
    <>
      <nav className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200'
          : 'bg-white border-b border-slate-200/80'
        }
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate("/")}>
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2.5 text-lg font-semibold tracking-tight text-slate-900">NearCash</span>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {desktopNavItems.map(({ key, label, tooltip, icon: Icon, path }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => navigate(path)}
                    title={tooltip}
                    className={`group relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                    <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-50">
                      {tooltip}
                    </span>
                  </button>
                );
              })}

              <div className="w-px h-6 bg-gray-200 mx-2" />

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
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-semibold text-white">
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
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
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
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-semibold text-white">
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
                  className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                    {profilePicture
                      ? <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      : <User size={16} className="text-white" />
                    }
                  </div>
                </button>
                {showUserMenu && <UserDropdown />}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
