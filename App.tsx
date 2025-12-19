import React, { useState, useEffect } from 'react';
import { CustomerApp } from './views/CustomerApp';
import { KitchenDisplay } from './views/KitchenDisplay';
import { StaffPOS } from './views/StaffPOS';
import { AdminDashboard } from './views/AdminDashboard';
import { Auth } from './views/Auth';
import { LandingPage } from './views/LandingPage';
import { RestaurantRegistration, RestaurantFormData } from './views/RestaurantRegistration';
import { QRMenuView } from './views/QRMenuView';
import { MyOrdersPage } from './views/MyOrdersPage';
import { User, UserRole } from './types';
import { TopBar } from './components/TopBar';
import { useRouter } from './utils/router';

const STORAGE_KEY = 'pos_user';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentRoute, navigate } = useRouter();

  // Public QR Menu view (accessible via URL parameters)
  // Check if we're on the menu route (from QR code) - must be defined early
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  const [isMenuRoute, setIsMenuRoute] = useState(false);

  // Update URL params and route detection whenever location changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUrlParams(params);
      const pathname = window.location.pathname;
      const isMenu = pathname === '/menu' || pathname === '/menu/' || pathname.startsWith('/menu');
      setIsMenuRoute(isMenu);
      
      // Log for debugging
      if (isMenu) {
        console.log('🔵 Menu route detected in useEffect:', {
          pathname,
          search: window.location.search,
          restaurant: params.get('restaurant'),
          table: params.get('table')
        });
      }
    }
  }, [typeof window !== 'undefined' ? window.location.search + window.location.pathname : '']);
  
  // Also listen to popstate events to catch browser navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      setUrlParams(params);
      const pathname = window.location.pathname;
      const isMenu = pathname === '/menu' || pathname === '/menu/' || pathname.startsWith('/menu');
      setIsMenuRoute(isMenu);
      
      if (isMenu) {
        console.log('🔵 Menu route detected via popstate:', {
          pathname,
          search: window.location.search,
          restaurant: params.get('restaurant'),
          table: params.get('table')
        });
      }
    };
    
    window.addEventListener('popstate', handleLocationChange);
    // Also check on initial load
    handleLocationChange();
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  // Extract and validate restaurant and table IDs from URL params
  // Read directly from window.location as fallback if urlParams state is stale
  const currentSearchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const rawRestaurantId = urlParams?.get('restaurant') || currentSearchParams?.get('restaurant') || null;
  const rawTableId = urlParams?.get('table') || currentSearchParams?.get('table') || null;
  
  // Helper function to extract ID from a value that might contain a URL
  const extractId = (value: string | null, paramName: 'restaurant' | 'table'): string | null => {
    if (!value) return null;
    
    const trimmed = value.trim();
    
    // If it's a simple number, return it
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }
    
    // If it contains a URL, try to extract the ID from the URL
    if (trimmed.includes('http') || trimmed.includes('/menu') || trimmed.includes('?')) {
      // Try to parse as URL and extract parameters
      try {
        // If it's a full URL, parse it
        const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, 'https://example.com');
        const extracted = url.searchParams.get(paramName);
        if (extracted && /^\d+$/.test(extracted)) {
          return extracted;
        }
      } catch (e) {
        // URL parsing failed, try regex
      }
      
      // Try regex extraction - look for the specific parameter
      const paramMatch = trimmed.match(new RegExp(`[?&]${paramName}=([^&]+)`));
      if (paramMatch) {
        const id = paramMatch[1];
        // If the extracted ID is still a URL, recursively extract
        if (id.includes('http') || id.includes('/menu')) {
          return extractId(id, paramName);
        }
        // If it's a number, return it
        if (/^\d+$/.test(id)) {
          return id;
        }
      }
      
      // Last resort: extract the last number from the string (usually the actual ID)
      const numbers = trimmed.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        // Return the last number found (most likely the actual ID)
        return numbers[numbers.length - 1];
      }
    }
    
    // Return cleaned value (extract first number found)
    const numberMatch = trimmed.match(/\d+/);
    return numberMatch ? numberMatch[0] : null;
  };
  
  // Clean and validate the IDs
  const restaurantId = extractId(rawRestaurantId, 'restaurant');
  const tableId = extractId(rawTableId, 'table');
  
  // Log for debugging
  useEffect(() => {
    if (rawRestaurantId || rawTableId) {
      console.log('🔵 URL Parameter Extraction:', {
        rawRestaurantId,
        rawTableId,
        cleanedRestaurantId: restaurantId,
        cleanedTableId: tableId,
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
        fullUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
      });
    }
  }, [rawRestaurantId, rawTableId, restaurantId, tableId]);
  
  // Additional debug: Log whenever we're on menu path
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isMenu = pathname === '/menu' || pathname.startsWith('/menu/');
      if (isMenu) {
        const params = new URLSearchParams(window.location.search);
        console.log('🔵 Menu path detected - Current state:', {
          pathname,
          search: window.location.search,
          urlParamsState: urlParams ? { restaurant: urlParams.get('restaurant'), table: urlParams.get('table') } : 'null',
          currentSearchParams: { restaurant: params.get('restaurant'), table: params.get('table') },
          rawRestaurantId,
          rawTableId,
          restaurantId,
          tableId,
          isMenuRoute
        });
      }
    }
  }, [urlParams, rawRestaurantId, rawTableId, restaurantId, tableId, isMenuRoute]);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        // Only redirect to dashboard if user is logged in and on landing page
        // BUT: Never redirect if we're on the menu or orders route
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isOnMenuRoute = pathname === '/menu' || pathname.startsWith('/menu/');
        const isOnOrdersRoute = pathname === '/orders' || pathname.startsWith('/orders/');
        if (currentRoute === 'landing' && !isOnMenuRoute && !isOnOrdersRoute) {
          navigate('dashboard', true);
        }
      } else {
        // If no user and on dashboard, redirect to landing
        // BUT: Never redirect if we're on the menu or orders route
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isOnMenuRoute = pathname === '/menu' || pathname.startsWith('/menu/');
        const isOnOrdersRoute = pathname === '/orders' || pathname.startsWith('/orders/');
        if (currentRoute === 'dashboard' && !isOnMenuRoute && !isOnOrdersRoute) {
          navigate('landing', true);
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isOnMenuRoute = pathname === '/menu' || pathname.startsWith('/menu/');
      const isOnOrdersRoute = pathname === '/orders' || pathname.startsWith('/orders/');
      if (currentRoute === 'dashboard' && !isOnMenuRoute && !isOnOrdersRoute) {
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
    
    // CRITICAL: Check if we're on the menu or orders route FIRST - if so, skip ALL authentication checks
    // This ensures QR code scanning always works, even for logged-in users
    // Check URL directly, not just state, to catch it immediately after navigation
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isOnMenuRoute = pathname === '/menu' || pathname.startsWith('/menu/');
    const isOnOrdersRoute = pathname === '/orders' || pathname.startsWith('/orders/');
    
    if (isOnMenuRoute || isOnOrdersRoute) {
      // Check URL params directly from window.location, not just state
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlRestaurant = urlParams?.get('restaurant');
      const urlTable = urlParams?.get('table');
      
      if (urlRestaurant && urlTable) {
        // We're on the menu/orders route with valid params - don't redirect, allow page to display
        console.log('🔵 Menu/Orders route detected, skipping ALL auth checks:', { 
          pathname, 
          urlRestaurant, 
          urlTable,
          stateRestaurantId: restaurantId,
          stateTableId: tableId
        });
        return; // Exit early - don't run any auth redirects
      } else {
        console.log('🔵 Menu/Orders route detected but missing params:', { pathname, urlRestaurant, urlTable });
      }
    }
    
    // If user is logged in and tries to access login/registration, redirect to dashboard
    // BUT: Never redirect if we're on the menu or orders route
    const pathnameCheck = typeof window !== 'undefined' ? window.location.pathname : '';
    const isOnMenuRouteCheck = pathnameCheck === '/menu' || pathnameCheck.startsWith('/menu/');
    const isOnOrdersRouteCheck = pathnameCheck === '/orders' || pathnameCheck.startsWith('/orders/');
    if (currentUser && (currentRoute === 'login' || currentRoute === 'registration') && !isOnMenuRouteCheck && !isOnOrdersRouteCheck) {
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
      // BUT: Never redirect if we're on the menu or orders route
      const pathnameCheck2 = typeof window !== 'undefined' ? window.location.pathname : '';
      const isOnMenuRouteCheck2 = pathnameCheck2 === '/menu' || pathnameCheck2.startsWith('/menu/');
      const isOnOrdersRouteCheck2 = pathnameCheck2 === '/orders' || pathnameCheck2.startsWith('/orders/');
      if (!isOnMenuRouteCheck2 && !isOnOrdersRouteCheck2) {
        navigate('login', true);
      }
    } else if (currentUser && currentRoute !== 'dashboard') {
      // User is logged in but on wrong page - check if we're on menu/orders route first
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isOnMenuRoute = pathname === '/menu' || pathname.startsWith('/menu/');
      const isOnOrdersRoute = pathname === '/orders' || pathname.startsWith('/orders/');
      
      if (!isOnMenuRoute && !isOnOrdersRoute) {
        // Only redirect if we're NOT on the menu/orders route
        console.log('🔵 User logged in, redirecting to dashboard (not on menu/orders route)');
        navigate('dashboard', true);
      } else {
        console.log('🔵 User logged in but on menu/orders route - allowing page to display');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute, currentUser, isLoading, restaurantId, tableId]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Save user to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // Only navigate to dashboard if not on menu route
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isOnMenuRoute = pathname === '/menu' || pathname.startsWith('/menu/');
    if (!isOnMenuRoute) {
      navigate('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Clear user from localStorage
    localStorage.removeItem(STORAGE_KEY);
    // Navigate back to landing page
    navigate('landing');
  };

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
  }, [restaurantId, tableId, setUrlParams, setIsMenuRoute]);

  // CRITICAL: Check menu and orders routes FIRST, even before loading check
  // This ensures menu/orders displays immediately after QR scan, before any redirects
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isOnMenuPath = pathname === '/menu' || pathname.startsWith('/menu/');
  const isOnOrdersPath = pathname === '/orders' || pathname.startsWith('/orders/');
  
  // Check for orders route
  if (isOnOrdersPath && typeof window !== 'undefined') {
    const directParams = new URLSearchParams(window.location.search);
    const directRestaurant = directParams.get('restaurant');
    const directTable = directParams.get('table');
    
    if (directRestaurant && directTable) {
      console.log('🔵 ✅ Orders route detected - rendering MyOrdersPage:', {
        pathname,
        directRestaurant,
        directTable
      });
      return <MyOrdersPage restaurantId={directRestaurant} tableId={directTable} />;
    }
  }
  
  // If on menu path, try to get params directly from URL (bypass state if needed)
  if (isOnMenuPath && typeof window !== 'undefined') {
    const directParams = new URLSearchParams(window.location.search);
    const directRestaurant = directParams.get('restaurant');
    const directTable = directParams.get('table');
    
    if (directRestaurant && directTable) {
      console.log('🔵 ✅ Menu route detected at render time - rendering immediately:', {
        pathname,
        directRestaurant,
        directTable,
        stateRestaurantId: restaurantId || rawRestaurantId,
        stateTableId: tableId || rawTableId
      });
      // Render menu immediately, don't wait for state updates
      return <QRMenuView restaurantId={directRestaurant} tableId={directTable} />;
    }
  }

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

  // Check if we're on the menu or orders route (from QR code) - render BEFORE any other route handling
  // This must be checked FIRST to ensure QR menu/orders always displays, even for logged-in users
  // Note: isOnOrdersPath is already declared above (line 326)
  
  // Use cleaned IDs if available, otherwise fall back to raw IDs
  const finalRestaurantId = restaurantId || rawRestaurantId;
  const finalTableId = tableId || rawTableId;
  
  // Debug: Log the rendering check
  console.log('🔵 Rendering check:', {
    isMenuRoute,
    isOnMenuPath,
    isOnOrdersPath,
    pathname,
    rawRestaurantId,
    rawTableId,
    restaurantId,
    tableId,
    finalRestaurantId,
    finalTableId,
    willRenderMenu: (isMenuRoute || isOnMenuPath) && finalRestaurantId && finalTableId,
    willRenderOrders: isOnOrdersPath && finalRestaurantId && finalTableId
  });
  
  // CRITICAL: If we're on /orders path, render orders page
  if (isOnOrdersPath) {
    if (finalRestaurantId && finalTableId) {
      console.log('🔵 ✅ Rendering MyOrdersPage with:', { 
        restaurantId: finalRestaurantId, 
        tableId: finalTableId, 
        pathname: pathname || 'N/A'
      });
      return <MyOrdersPage restaurantId={finalRestaurantId} tableId={finalTableId} />;
    } else {
      // Try to extract from URL directly
      if (typeof window !== 'undefined') {
        const directParams = new URLSearchParams(window.location.search);
        const directRestaurant = directParams.get('restaurant');
        const directTable = directParams.get('table');
        if (directRestaurant && directTable) {
          console.log('🔵 ✅ Found IDs via direct extraction, rendering MyOrdersPage');
          return <MyOrdersPage restaurantId={directRestaurant} tableId={directTable} />;
        }
      }
      console.error('❌ Orders path detected but no restaurant/table IDs found');
    }
  }
  
  // CRITICAL: If we're on /menu path, ALWAYS try to render menu, even if IDs are missing
  // This ensures menu displays even if URL parsing has issues
  if (isMenuRoute || isOnMenuPath) {
    if (finalRestaurantId && finalTableId) {
      console.log('🔵 ✅ Rendering QRMenuView with:', { 
        restaurantId: finalRestaurantId, 
        tableId: finalTableId, 
        isMenuRoute, 
        isOnMenuPath,
        pathname: pathname || 'N/A',
        urlParams: { restaurant: rawRestaurantId, table: rawTableId }
      });
      return <QRMenuView restaurantId={finalRestaurantId} tableId={finalTableId} />;
    } else {
      // Even if IDs are missing, if we're on /menu path, try to extract from URL directly
      console.warn('⚠️ Menu path detected but IDs missing, trying direct URL extraction');
      if (typeof window !== 'undefined') {
        const directParams = new URLSearchParams(window.location.search);
        const directRestaurant = directParams.get('restaurant');
        const directTable = directParams.get('table');
        if (directRestaurant && directTable) {
          console.log('🔵 ✅ Found IDs via direct extraction, rendering QRMenuView');
          return <QRMenuView restaurantId={directRestaurant} tableId={directTable} />;
        }
      }
      console.error('❌ Menu path detected but no restaurant/table IDs found');
    }
  }
  
  // Also check for restaurant/table params on root path (fallback for direct QR scan)
  if (finalRestaurantId && finalTableId && typeof window !== 'undefined' && window.location.pathname === '/') {
    console.log('🔵 Root path with QR params, redirecting to menu route');
    // Redirect to /menu route instead of rendering directly
    const menuUrl = `/menu?restaurant=${finalRestaurantId}&table=${finalTableId}`;
    window.history.replaceState({}, '', menuUrl);
    // Update state to trigger re-render
    const params = new URLSearchParams(window.location.search);
    setUrlParams(params);
    setIsMenuRoute(true);
    return <QRMenuView restaurantId={finalRestaurantId} tableId={finalTableId} />;
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