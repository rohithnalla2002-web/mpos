import { useState, useEffect, useCallback } from 'react';

type Route = 'landing' | 'registration' | 'login' | 'dashboard';

class Router {
  private listeners: Set<() => void> = new Set();
  private currentRoute: Route = 'landing';
  private initialized: boolean = false;

  constructor() {
    // Don't initialize in constructor to avoid issues
  }

  private initialize() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    // Listen to browser navigation (back/forward buttons)
    window.addEventListener('popstate', this.handlePopState.bind(this));
    // Initialize route from URL
    this.updateRouteFromURL();
  }

  private handlePopState = () => {
    this.updateRouteFromURL();
    this.notifyListeners();
  };

  private updateRouteFromURL() {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path === '/registration' || path === '/registration/') {
      this.currentRoute = 'registration';
    } else if (path === '/login' || path === '/login/') {
      this.currentRoute = 'login';
    } else if (path === '/dashboard' || path === '/dashboard/') {
      this.currentRoute = 'dashboard';
    } else if (path === '/menu' || path === '/menu/') {
      // QR menu route - keep as landing so it doesn't require auth
      this.currentRoute = 'landing';
    } else {
      this.currentRoute = 'landing';
    }
  }

  getCurrentRoute(): Route {
    this.initialize();
    return this.currentRoute;
  }

  navigate(route: Route, replace: boolean = false) {
    this.initialize();
    this.currentRoute = route;
    
    let path = '/';
    if (route === 'registration') path = '/registration';
    else if (route === 'login') path = '/login';
    else if (route === 'dashboard') path = '/dashboard';
    
    if (replace) {
      window.history.replaceState({ route }, '', path);
    } else {
      window.history.pushState({ route }, '', path);
    }
    
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.initialize();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const router = new Router();

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window !== 'undefined') {
      return router.getCurrentRoute();
    }
    return 'landing';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const unsubscribe = router.subscribe(() => {
      setRoute(router.getCurrentRoute());
    });
    
    // Initialize route on mount
    setRoute(router.getCurrentRoute());
    
    return unsubscribe;
  }, []);

  const navigate = useCallback((route: Route, replace?: boolean) => {
    router.navigate(route, replace);
  }, []);

  return {
    currentRoute: route,
    navigate,
  };
}

