import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Category, CartItem, OrderStatus, User, Order } from '../types';
import { API, API_BASE_URL } from '../services/api';
import { Button, LoadingSpinner, FadeIn } from '../components/ui';
import { ShoppingCart, Plus, Minus, ChefHat, CreditCard, CheckCircle2, XCircle, Star, AlertTriangle, Package } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { useRouter } from '../utils/router';

interface QRMenuViewProps {
  restaurantId: string;
  tableId: string;
}

const STORAGE_KEY = 'pos_user';

export const QRMenuView: React.FC<QRMenuViewProps> = ({ restaurantId, tableId }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ id: string; totalAmount: number; items: any[] } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { navigate } = useRouter();

  // Load user from localStorage to show TopBar if logged in
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    // Stay on menu page after logout
  };

  useEffect(() => {
    const fetchMenu = async () => {
      // Clean and validate IDs before using them
      const cleanRestaurantId = restaurantId?.toString().trim().replace(/[^0-9]/g, '');
      const cleanTableId = tableId?.toString().trim().replace(/[^0-9]/g, '');
      
      if (!cleanRestaurantId || !cleanTableId) {
        console.error('❌ Missing or invalid restaurantId or tableId:', { 
          restaurantId, 
          tableId,
          cleanRestaurantId,
          cleanTableId
        });
        setLoading(false);
        return;
      }

      console.log('🔵 QRMenuView: Starting menu fetch', { 
        originalRestaurantId: restaurantId,
        originalTableId: tableId,
        cleanRestaurantId, 
        cleanTableId, 
        API_BASE_URL 
      });

      try {
        const url = `${API_BASE_URL}/qr/menu?restaurant=${cleanRestaurantId}&table=${cleanTableId}`;
        console.log('🔵 Fetching QR menu from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔵 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to fetch menu:', response.status, errorText);
          
          // Try to parse error as JSON
          let errorMessage = `Failed to fetch menu: ${response.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch (e) {
            // Not JSON, use the text
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('✅ QR Menu data received:', data);
        console.log('🔵 Restaurant ID requested:', restaurantId);
        console.log('🔵 Restaurant received:', data.restaurant);
        console.log('🔵 Menu items received:', data.menu?.length || 0);
        
        if (data.menu && data.menu.length > 0) {
          console.log('🔵 Menu items details:', data.menu.slice(0, 5).map((item: any) => ({ 
            id: item.id, 
            name: item.name, 
            category: item.category,
            price: item.price 
          })));
        }
        
        setRestaurant(data.restaurant);
        
        // Ensure menu items are set correctly
        if (data.menu && Array.isArray(data.menu)) {
          setMenuItems(data.menu);
          console.log(`✅ Successfully set ${data.menu.length} menu items`);
        } else {
          console.warn('⚠️ Menu data is not an array:', data.menu);
          setMenuItems([]);
        }
        
        // Update page title with restaurant name
        if (data.restaurant?.name) {
          document.title = `${data.restaurant.name} - Menu | DineFlow`;
        } else {
          document.title = 'Menu | DineFlow';
        }
        
        // Log if menu is empty
        if (!data.menu || data.menu.length === 0) {
          console.warn('⚠️ No menu items received for restaurant:', restaurantId);
          console.warn('⚠️ Response data:', data);
        }
      } catch (error: any) {
        console.error('❌ Error fetching menu:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          restaurantId,
          tableId,
          cleanRestaurantId: restaurantId?.toString().trim().replace(/[^0-9]/g, ''),
          cleanTableId: tableId?.toString().trim().replace(/[^0-9]/g, ''),
          API_BASE_URL
        });
        
        // Show user-friendly error message
        const errorMsg = error.message || 'Failed to load menu. Please check your connection and try again.';
        alert(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId, tableId]);

  const addToCart = (item: MenuItem) => {
    setCart([...cart, { ...item, cartId: Math.random().toString(36) }]);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    const item = cart.find(i => i.cartId === cartId);
    if (!item) return;
    
    if (delta === -1) {
      removeFromCart(cartId);
    } else {
      addToCart(item);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    try {
      const items = cart.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        quantity: 1
      }));

      const response = await fetch(`${API_BASE_URL}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          adminId: restaurantId,
          items,
          customerName: cookingInstructions || undefined // Using customerName field to store cooking instructions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const order = await response.json();
      setOrderId(order.id);
      setPendingOrder({
        id: order.id,
        totalAmount: order.totalAmount,
        items: items
      });
      setCart([]);
      setShowCartModal(false);
      // Show payment modal instead of order placed screen
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handlePayNow = async () => {
    if (!pendingOrder || !restaurantId) return;
    
    setIsProcessingPayment(true);
    try {
      // Update order status to PAID
      const response = await fetch(`${API_BASE_URL}/orders/${pendingOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: OrderStatus.PAID,
          adminId: restaurantId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      // Payment successful
      setIsOrderPlaced(true);
      setShowPaymentModal(false);
      setPendingOrder(null);
      
      // Orders will be refreshed when user navigates to orders page
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Filter menu items by category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') {
      return menuItems;
    }
    return menuItems.filter(item => {
      // Match category exactly or handle case-insensitive matching
      const itemCategory = item.category?.trim();
      const activeCat = activeCategory.toString().trim();
      const matches = itemCategory === activeCat || itemCategory?.toLowerCase() === activeCat.toLowerCase();
      return matches;
    });
  }, [menuItems, activeCategory]);

  // Get unique categories from menu items, plus 'All'
  const categories = useMemo(() => {
    const menuCategories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
    return ['All', ...menuCategories.sort()];
  }, [menuItems]);
  
  // Debug logging
  useEffect(() => {
    console.log('📋 Menu Display Debug:');
    console.log('  - Total menu items:', menuItems.length);
    console.log('  - Active category:', activeCategory);
    console.log('  - Filtered items:', filteredItems.length);
    console.log('  - Available categories:', categories);
    if (menuItems.length > 0) {
      console.log('  - Sample items:', menuItems.slice(0, 3).map(item => ({
        name: item.name,
        category: item.category,
        price: item.price
      })));
    }
  }, [menuItems, activeCategory, filteredItems, categories]);

  // Auto-redirect to My Orders page after showing success screen
  useEffect(() => {
    if (isOrderPlaced && orderId) {
      const timer = setTimeout(() => {
        const cleanRestaurantId = restaurantId?.toString().trim().replace(/[^0-9]/g, '');
        const cleanTableId = tableId?.toString().trim().replace(/[^0-9]/g, '');
        if (cleanRestaurantId && cleanTableId) {
          // Use window.location.href to ensure proper navigation to orders page
          window.location.href = `/orders?restaurant=${cleanRestaurantId}&table=${cleanTableId}`;
        }
      }, 2500); // Show success for 2.5 seconds before redirecting

      return () => clearTimeout(timer);
    }
  }, [isOrderPlaced, orderId, restaurantId, tableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <LoadingSpinner size="lg" color="emerald" />
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center relative z-10 animate-scale-in">
          {/* Success checkmark animation */}
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce-in">
              <CheckCircle2 className="w-14 h-14 text-white animate-scale-check" />
            </div>
            {/* Ripple effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-emerald-400 rounded-full opacity-20 animate-ripple" />
              <div className="w-24 h-24 bg-emerald-400 rounded-full opacity-10 animate-ripple-delayed" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-3 animate-fade-in-up">Order Placed!</h1>
          <p className="text-slate-600 mb-6 text-lg animate-fade-in-up-delayed">Your order has been received and will be prepared shortly.</p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6 animate-fade-in-up-delayed-2">
            <p className="text-sm font-semibold text-slate-700 mb-1">Order ID</p>
            <p className="text-base text-slate-900 font-mono">{orderId?.slice(-8) || orderId}</p>
            <p className="text-sm text-slate-500 mt-2">Table {tableId?.toString().replace(/[^0-9]/g, '') || tableId || 'N/A'}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 animate-fade-in-up-delayed-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Redirecting to My Orders...</span>
          </div>
        </div>

        <style>{`
          @keyframes scale-in {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes bounce-in {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes scale-check {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes ripple {
            0% {
              transform: scale(1);
              opacity: 0.3;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-scale-in {
            animation: scale-in 0.4s ease-out;
          }

          .animate-bounce-in {
            animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          .animate-scale-check {
            animation: scale-check 0.5s ease-out 0.2s both;
          }

          .animate-ripple {
            animation: ripple 2s ease-out infinite;
          }

          .animate-ripple-delayed {
            animation: ripple 2s ease-out 0.5s infinite;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out 0.3s both;
          }

          .animate-fade-in-up-delayed {
            animation: fade-in-up 0.5s ease-out 0.4s both;
          }

          .animate-fade-in-up-delayed-2 {
            animation: fade-in-up 0.5s ease-out 0.5s both;
          }

          .animate-fade-in-up-delayed-3 {
            animation: fade-in-up 0.5s ease-out 0.6s both;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col">
      {/* Top Bar - Same as dashboard */}
      {currentUser ? (
        <TopBar user={currentUser} onLogout={handleLogout} />
      ) : (
        <div className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-800">DineFlow</div>
                    <div className="text-xs text-slate-500">Digital Menu</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800">{restaurant?.name || 'Restaurant'}</div>
                  <div className="text-xs text-slate-500">Table {tableId?.toString().replace(/[^0-9]/g, '') || tableId || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1">

      {/* Header with Highlighted Restaurant Name - Reduced Size */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {restaurant?.name || 'Restaurant'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-50 mt-0.5">
                Table {tableId?.toString().replace(/[^0-9]/g, '') || tableId || 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  const cleanRestaurantId = restaurantId?.toString().trim().replace(/[^0-9]/g, '');
                  const cleanTableId = tableId?.toString().trim().replace(/[^0-9]/g, '');
                  if (cleanRestaurantId && cleanTableId) {
                    window.location.href = `/orders?restaurant=${cleanRestaurantId}&table=${cleanTableId}`;
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all touch-manipulation active:scale-95 border border-white/30 text-xs sm:text-sm font-medium"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">My Orders</span>
                <span className="sm:hidden">Orders</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 touch-pan-x no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as Category | 'All')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${cart.length > 0 ? 'pb-24 sm:pb-28' : 'pb-8'}`}>
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2 font-semibold">No menu items available</p>
            <p className="text-slate-500 text-sm mb-4">This restaurant hasn't added any menu items yet.</p>
            <p className="text-slate-400 text-xs">
              Restaurant ID: {restaurantId?.toString().replace(/[^0-9]/g, '') || restaurantId} | 
              Table: {tableId?.toString().replace(/[^0-9]/g, '') || tableId}
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg mb-4">No items in this category</p>
            <button
              onClick={() => setActiveCategory('All')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              View all items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {filteredItems.map((item, index) => {
              // Calculate original price (assuming 50% discount for demo, or use actual data if available)
              const originalPrice = item.price * 2;
              const rating = item.rating || 0;
              const reviewCount = item.reviewCount || 0;
              
              return (
                <FadeIn key={item.id} delay={index * 50}>
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col max-w-[240px] mx-auto">
                    {/* Image Section */}
                    <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-slate-100">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                      />
                      {!item.isVegetarian && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-orange-500 rounded-sm flex items-center justify-center">
                          <AlertTriangle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 line-clamp-1">{item.name}</h3>
                      
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-slate-400 line-through text-xs">₹{originalPrice.toFixed(0)}</span>
                        <span className="text-slate-900 font-bold text-sm sm:text-base">₹{item.price.toFixed(0)}</span>
                      </div>
                      
                      {rating > 0 && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-slate-700">{rating.toFixed(1)}</span>
                          {reviewCount > 0 && (
                            <span className="text-xs text-slate-500">({reviewCount})</span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2 flex-1">{item.description}</p>
                      
                      {/* ADD Button */}
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-white border-2 border-emerald-600 text-emerald-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-emerald-50 transition-all touch-manipulation active:scale-95 text-xs sm:text-sm"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Bottom Bar - Green Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-emerald-600 shadow-2xl z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="font-semibold text-base sm:text-lg">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} added
                </span>
              </div>
              <button
                onClick={() => {
                  // Show cart modal or navigate to cart view
                  setShowCartModal(true);
                }}
                className="flex items-center gap-2 bg-white text-emerald-600 font-semibold px-6 py-2.5 rounded-lg hover:bg-emerald-50 transition-all touch-manipulation active:scale-95 shadow-md"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>VIEW CART</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCartModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-xl text-slate-900">Cart ({cart.length} items)</h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.cartId} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-emerald-600 font-bold">₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateCartQuantity(item.cartId, -1)}
                      className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold w-8 text-center">{cart.filter(i => i.id === item.id).length}</span>
                    <button
                      onClick={() => updateCartQuantity(item.cartId, 1)}
                      className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg ml-2"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-slate-900">Total:</span>
                <span className="text-2xl font-bold text-emerald-600">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cooking Instructions (Optional)</label>
                <textarea
                  value={cookingInstructions}
                  onChange={(e) => setCookingInstructions(e.target.value)}
                  placeholder="e.g., No onions, extra spicy, well done, etc."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm resize-none"
                  rows={3}
                />
              </div>
              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 text-base font-bold shadow-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Place Order
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Payment Modal */}
      {showPaymentModal && pendingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => {}}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment</h2>
              <p className="text-slate-600 text-sm">Complete your payment to confirm the order</p>
            </div>
            
            <div className="p-6">
              {/* Order Summary */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-slate-900 mb-3">Order Summary</h3>
                <div className="space-y-2 mb-3">
                  {pendingOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.quantity || 1}x {item.name}
                      </span>
                      <span className="text-slate-700 font-medium">
                        ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Amount:</span>
                  <span className="font-bold text-xl text-emerald-600">₹{pendingOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method (for testing) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Test Payment</p>
                      <p className="text-xs text-slate-500">For testing purposes only</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPendingOrder(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayNow}
                  disabled={isProcessingPayment}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

