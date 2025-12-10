import { User, UserRole } from '../types';

// Get API base URL from environment variable
// If VITE_API_URL is set, use it (should include /api at the end)
// Otherwise, use localhost fallback
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    let url = envUrl.trim();
    
    // If URL doesn't start with http:// or https://, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    // Ensure it ends with /api
    if (!url.endsWith('/api')) {
      url = url.endsWith('/') ? `${url}api` : `${url}/api`;
    }
    
    return url;
  }
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export const API = {
  // Login with email and password
  login: async (email: string, password: string): Promise<User | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const user = await response.json();
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (email: string, name: string, password: string, role: UserRole): Promise<User> => {
    try {
      const url = `${API_BASE_URL}/auth/register`;
      console.log('🔵 Registering user at:', url);
      console.log('🔵 API_BASE_URL:', API_BASE_URL);
      console.log('🔵 VITE_API_URL env:', import.meta.env.VITE_API_URL);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password, role }),
      });

      console.log('🔵 Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('❌ Registration failed:', errorMessage, 'URL:', url);
        throw new Error(errorMessage);
      }

      const user = await response.json();
      return user;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('❌ API_BASE_URL was:', API_BASE_URL);
      throw error;
    }
  },

  // Register restaurant
  registerRestaurant: async (formData: FormData): Promise<any> => {
    try {
      const url = `${API_BASE_URL}/restaurant/register`;
      console.log('🔵 Registering restaurant at:', url);
      console.log('🔵 API_BASE_URL:', API_BASE_URL);
      console.log('🔵 VITE_API_URL env:', import.meta.env.VITE_API_URL);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('🔵 Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('❌ Restaurant registration failed:', errorMessage, 'URL:', url);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('❌ Restaurant registration error:', error);
      console.error('❌ API_BASE_URL was:', API_BASE_URL);
      throw error;
    }
  },

  // Get admin details (including restaurant name)
  getAdminDetails: async (adminId: string): Promise<User> => {
    try {
      console.log('API.getAdminDetails - Fetching for ID:', adminId);
      const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch admin details';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('API.getAdminDetails - Error response:', errorMessage);
        throw new Error(errorMessage);
      }

      const admin = await response.json();
      console.log('API.getAdminDetails - Response received:', admin);
      return admin;
    } catch (error: any) {
      console.error('API.getAdminDetails - Error:', error);
      throw error;
    }
  },

  // Add staff/kitchen member
  addStaffMember: async (name: string, email: string, password: string, role: UserRole, adminId: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, adminId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to add staff member';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const member = await response.json();
      return member;
    } catch (error: any) {
      console.error('Error adding staff member:', error);
      throw error;
    }
  },

  // Get staff members for an admin
  getStaffMembers: async (adminId: string): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${adminId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch staff members';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const members = await response.json();
      return members;
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
      throw error;
    }
  },

  // Menu Items API
  getMenuItems: async (adminId: string): Promise<MenuItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${adminId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch menu items';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const items = await response.json();
      return items;
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  },

  addMenuItem: async (item: Omit<MenuItem, 'id'>, adminId: string): Promise<MenuItem> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...item, adminId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to add menu item';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const newItem = await response.json();
      return newItem;
    } catch (error: any) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  },

  updateMenuItem: async (itemId: string, item: Partial<MenuItem>, adminId: string): Promise<MenuItem> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...item, adminId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update menu item';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const updatedItem = await response.json();
      return updatedItem;
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  },

  toggleMenuItemStock: async (itemId: string, isOutOfStock: boolean, adminId: string): Promise<{ id: string; isOutOfStock: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${itemId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOutOfStock, adminId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update stock status';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Error updating stock status:', error);
      throw error;
    }
  },

  deleteMenuItem: async (itemId: string, adminId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${itemId}?adminId=${adminId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete menu item';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  },

  // Orders API
  getOrders: async (adminId: string, status?: string): Promise<Order[]> => {
    try {
      let url = `${API_BASE_URL}/orders/${adminId}`;
      if (status) {
        url += `?status=${status}`;
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch orders';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const orders = await response.json();
      return orders;
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, adminId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update order status';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Get orders for a specific user
  getUserOrders: async (userId: string, status?: string): Promise<Order[]> => {
    try {
      let url = `${API_BASE_URL}/orders/user/${userId}`;
      if (status) {
        url += `?status=${status}`;
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch orders';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const orders = await response.json();
      return orders;
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Submit ratings for order items
  submitRatings: async (orderId: string, ratings: Array<{ menuItemId: string; rating: number; review?: string }>, userId: string, adminId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          ratings,
          userId,
          adminId
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to submit ratings';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error submitting ratings:', error);
      throw error;
    }
  },

  // Get ratings for an order
  getOrderRatings: async (orderId: string): Promise<Record<string, { rating: number; review?: string }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/order/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch ratings';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.ratings || {};
    } catch (error: any) {
      console.error('Error fetching order ratings:', error);
      throw error;
    }
  },
};

