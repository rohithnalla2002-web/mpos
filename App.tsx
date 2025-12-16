import React, { useState, useEffect } from 'react';
import { CustomerApp } from './views/CustomerApp';
import { KitchenDisplay } from './views/KitchenDisplay';
import { StaffPOS } from './views/StaffPOS';
import { AdminDashboard } from './views/AdminDashboard';
import { Auth } from './views/Auth';
import { LandingPage } from './views/LandingPage';
import { RestaurantRegistration, RestaurantFormData } from './views/RestaurantRegistration';
import { QRMenuView } from './views/QRMenuView';
import { User, UserRole } from './types';
import { TopBar } from './components/TopBar';
import { useRouter } from './utils/router';

const STORAGE_KEY = 'pos_user';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentRoute, navigate } = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        // Only redirect to dashboard if user is logged in and on landing page
        // Allow registration and login pages to be accessible
        if (currentRoute === 'landing') {
          navigate('dashboard', true);
        }
      } else {
        // If no user and on dashboard, redirect to landing
        if (currentRoute === 'dashboard') {
          navigate('landing', true);
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
      if (currentRoute === 'dashboard') {
        navigate('landing', true);
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle route changes for authentication
  useEffect(() => {
    if (isLoading) return;
    
    // Check if we're on the menu route - if so, skip authentication checks
    const isOnMenuRoute = typeof window !== 'undefined' && 
      (window.location.pathname === '/menu' || window.location.pathname.startsWith('/menu'));
    if (isOnMenuRoute && restaurantId && tableId) {
      // We're on the menu route with valid params - don't redirect
      return;
    }
    
    // If user is logged in and tries to access login/registration, redirect to dashboard
    if (currentUser && (currentRoute === 'login' || currentRoute === 'registration')) {
      navigate('dashboard', true);
      return;
    }
    
    // Allow registration and login pages without authentication (only if user is not logged in)
    if ((currentRoute === 'registration' || currentRoute === 'login' || currentRoute === 'landing') && !currentUser) {
      // Don't redirect if user is on these public pages and not logged in
      return;
    }
    
    if (currentUser && currentRoute === 'dashboard') {
      // User is logged in and on dashboard - allow it
      return;
    } else if (!currentUser && currentRoute === 'dashboard') {
      // User not logged in but trying to access dashboard - redirect to login
      navigate('login', true);
    } else if (currentUser && currentRoute !== 'dashboard' && !isOnMenuRoute) {
      // User is logged in but on wrong page (and not on menu route) - redirect to dashboard
      navigate('dashboard', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute, currentUser, isLoading, restaurantId, tableId]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Save user to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // Navigate to dashboard
    navigate('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Clear user from localStorage
    localStorage.removeItem(STORAGE_KEY);
    // Navigate back to landing page
    navigate('landing');
  };

  // Public QR Menu view (accessible via URL parameters)
  // Check if we're on the menu route (from QR code) - must be before conditional returns
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  const [isMenuRoute, setIsMenuRoute] = useState(false);

  // Update URL params and route detection whenever location changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUrlParams(params);
      const pathname = window.location.pathname;
      setIsMenuRoute(pathname === '/menu' || pathname === '/menu/' || pathname.startsWith('/menu'));
      
      // Log for debugging
      const restaurantId = params.get('restaurant');
      const tableId = params.get('table');
      if (restaurantId || tableId) {
        console.log('🔵 URL Params detected:', { restaurantId, tableId, pathname });
      }
    }
  }, [typeof window !== 'undefined' ? window.location.search + window.location.pathname : '']);
  
  const restaurantId = urlParams?.get('restaurant');
  const tableId = urlParams?.get('table');

  // Handle redirect from root path with QR params to /menu route
  useEffect(() => {
    if (restaurantId && tableId && typeof window !== 'undefined' && window.location.pathname === '/') {
      const newUrl = `/menu?restaurant=${restaurantId}&table=${tableId}`;
      console.log('🔵 Redirecting to menu route:', newUrl);
      window.history.replaceState({}, '', newUrl);
      // Update state after redirect
      const params = new URLSearchParams(window.location.search);
      setUrlParams(params);
      setIsMenuRoute(true);
    }
  }, [restaurantId, tableId]);

  // Show loading state while checking localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if we're on the menu route (from QR code) - render before other routes
  // This must be checked before any other route handling
  if ((isMenuRoute || (typeof window !== 'undefined' && window.location.pathname.startsWith('/menu'))) && restaurantId && tableId) {
    console.log('🔵 Rendering QRMenuView with:', { restaurantId, tableId, isMenuRoute, pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A' });
    return <QRMenuView restaurantId={restaurantId} tableId={tableId} />;
  }
  
  // Also check for restaurant/table params on root path (fallback for direct QR scan)
  if (restaurantId && tableId && typeof window !== 'undefined' && window.location.pathname === '/') {
    console.log('🔵 Root path with QR params, rendering QRMenuView');
    return <QRMenuView restaurantId={restaurantId} tableId={tableId} />;
  }

  // Route to appropriate page based on URL
  if (currentRoute === 'landing') {
    // If user is already logged in, redirect to dashboard
    if (currentUser) {
      navigate('dashboard', true);
      return null;
    }
    return <LandingPage 
      onGetStarted={() => navigate('registration')}
      onLogin={() => navigate('login')}
    />;
  }

  if (currentRoute === 'registration') {
    try {
      return (
        <RestaurantRegistration 
          onBack={() => navigate('landing')}
          onSubmit={(data: RestaurantFormData) => {
            console.log('Restaurant registration data:', data);
            // After successful registration, redirect to login
            navigate('login');
          }}
        />
      );
    } catch (error) {
      console.error('Error rendering RestaurantRegistration:', error);
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Error Loading Registration Form</h1>
            <p className="text-slate-600 mb-4">{String(error)}</p>
            <button
              onClick={() => navigate('landing')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500"
            >
              Go Back to Home
            </button>
          </div>
        </div>
      );
    }
  }

  if (currentRoute === 'login') {
    // If user is already logged in, redirect to dashboard
    if (currentUser) {
      navigate('dashboard', true);
      return null;
    }
    return <Auth 
      onLogin={handleLogin}
      onBack={() => navigate('landing')}
    />;
  }

  // Dashboard view (only accessible when logged in)
  if (currentRoute === 'dashboard') {
    if (!currentUser) {
      // Redirect to login if not authenticated
      navigate('login');
      return null;
    }

    // Wrapper to include TopBar with user info and logout
    const AuthorizedLayout = ({ children }: { children: React.ReactNode }) => (
      <div className="flex flex-col min-h-screen">
        <TopBar user={currentUser} onLogout={handleLogout} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    );

    switch (currentUser.role) {
      case UserRole.ADMIN:
        return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.KITCHEN:
        return <AuthorizedLayout><KitchenDisplay user={currentUser} /></AuthorizedLayout>;
      case UserRole.STAFF:
        return <AuthorizedLayout><StaffPOS user={currentUser} /></AuthorizedLayout>;
      case UserRole.CUSTOMER:
        return <AuthorizedLayout><CustomerApp user={currentUser} /></AuthorizedLayout>;
      default:
        return <div>Unknown Role</div>;
    }
  }

  return null;
}