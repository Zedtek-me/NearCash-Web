import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  MapPin, 
  Search, 
  ShoppingBag, 
  User, 
  Bell, 
  Heart,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router';
import useAuth from "../../../Hooks/Auths";

const Navbar = ({ 
  onNavigate = () => {}, 
  currentPage = 'home',
  user = null,
  notifications = 0 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate()
  const { userType } = (user || {});

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.menu-button')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const navigation = [
    { name: 'Home', href: 'home', icon: Home },
    { name: 'Stores', href: 'stores', icon: MapPin },
    { name: 'Search', href: 'search', icon: Search },
    { name: 'Orders', href: 'orders', icon: ShoppingBag },
  ];

  const userMenuItems = [
    { name: 'Category', href: '/category', icon: Heart },
    { name: 'Profile', href: 'profile', icon: User },
    { name: 'Transaction Policy', href: '/policy', icon: User },
    { name: 'Settings', href: 'settings', icon: Settings },
    { name: 'Logout', href: 'logout', icon: LogOut },
  ];

  const sampleNotifications = [
    { id: 1, message: 'Your order from Fresh Market is ready!', time: '2 min ago' },
    { id: 2, message: 'New store opened near you', time: '1 hour ago' },
    { id: 3, message: 'Price drop on your favorite items', time: '3 hours ago' },
  ];

  const handleNavigation = (href) => {
    if (href === 'logout') {
      localStorage.removeItem('nearcash_token');
      return  navigate('/auth/login');
    }
    navigate(href);
    setIsOpen(false);
  };

  const NavItem = ({ item, isMobile = false }) => {
    const isActive = currentPage === item.href;
    const Icon = item.icon;
    
    return (
      <button
        onClick={() => handleNavigation(item.href)}
        className={`
          relative flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200
          ${isMobile 
            ? 'w-full justify-start text-left hover:bg-gray-100 text-gray-700' 
            : 'text-sm hover:bg-gray-100'
          }
          ${isActive 
            ? isMobile 
              ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
              : 'text-blue-600 bg-blue-50'
            : 'text-gray-700 hover:text-gray-900'
          }
        `}
      >
        <Icon size={18} />
        <span>{item.name}</span>
        {isActive && !isMobile && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
        )}
      </button>
    );
  };

  const NotificationDropdown = () => (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform opacity-100 scale-100 transition-all duration-200">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {sampleNotifications.map((notification) => (
          <div key={notification.id} className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
            <p className="text-sm text-gray-800 mb-1">{notification.message}</p>
            <p className="text-xs text-gray-500">{notification.time}</p>
          </div>
        ))}
      </div>
      <div className="p-3 text-center border-t border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All Notifications
        </button>
      </div>
    </div>
  );

  const UserDropdown = () => (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform opacity-100 scale-100 transition-all duration-200">
      <div className="px-4 pt-4 border-b border-gray-100 flex-wrap text-wrap">
        <p className="font-semibold text-gray-800 w-fit">{user?.fullName || 'John Doe'}</p>
        <p className="text-sm text-gray-500 w-fit">{user?.email || 'john@example.com'}</p>
      </div>
      <div className="py-2">
        {
        (userType?.toLowerCase() === "client" ? userMenuItems.filter((item) => ["profile", "settings", "logout"]
        .includes(item.name.toLowerCase())) : userMenuItems)
        .map((item) => {
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
    <nav className={`
      fixed top-0 left-0 right-0 z-40 transition-all duration-300
      ${isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg' 
        : 'bg-white shadow-sm'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-900 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">NearCash</span>
            </div>
          </div>
{/* 
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div> */}

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <Bell size={20} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
              {showNotifications && <NotificationDropdown />}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <ChevronDown size={16} className={`transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              {showUserMenu && <UserDropdown />}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="menu-button p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className={`
        md:hidden mobile-menu transition-all duration-300 ease-in-out
        ${isOpen 
          ? 'max-h-screen opacity-100 visible' 
          : 'max-h-0 opacity-0 invisible'
        }
      `}>
        <div className="px-4 pt-2 pb-6 space-y-1 bg-white border-t border-gray-200">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} isMobile />
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-3 py-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name || 'John Doe'}</p>
                <p className="text-sm text-gray-500">{user?.email || 'john@example.com'}</p>
              </div>
            </div>
            
            {userMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              {notifications > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </div>
            {sampleNotifications.slice(0, 2).map((notification) => (
              <div key={notification.id} className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-800 mb-1">{notification.message}</p>
                <p className="text-xs text-gray-500">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </nav>
  );
};



export default Navbar;