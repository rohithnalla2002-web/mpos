import React, { useState, useEffect } from 'react';
import { MenuItem, Category, CartItem, OrderStatus } from '../types';
import { API, API_BASE_URL } from '../services/api';
import { Button, LoadingSpinner, FadeIn } from '../components/ui';
import { ShoppingCart, Plus, Minus, ChefHat, CreditCard, CheckCircle2, XCircle } from 'lucide-react';

interface QRMenuViewProps {
  restaurantId: string;
  tableId: string;
}

export const QRMenuView: React.FC<QRMenuViewProps> = ({ restaurantId, tableId }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      if (!restaurantId || !tableId) {
        console.error('Missing restaurantId or tableId:', { restaurantId, tableId });
        setLoading(false);
        return;
      }

      try {
        const url = `${API_BASE_URL}/qr/menu?restaurant=${restaurantId}&table=${tableId}`;
        console.log('Fetching QR menu from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch menu:', response.status, errorText);
          throw new Error(`Failed to fetch menu: ${response.status}`);
        }
        const data = await response.json();
        console.log('QR Menu data received:', data);
        console.log('Restaurant ID requested:', restaurantId);
        console.log('Restaurant received:', data.restaurant);
        console.log('Menu items received:', data.menu?.length || 0);
        console.log('Menu items details:', data.menu?.map((item: any) => ({ id: item.id, name: item.name, category: item.category })));
        
        setRestaurant(data.restaurant);
        setMenuItems(data.menu || []);
        
        // Log if menu is empty
        if (!data.menu || data.menu.length === 0) {
          console.warn('⚠️ No menu items received for restaurant:', restaurantId);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
        alert('Failed to load menu. Please try again.');
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
          customerName: customerName || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const order = await response.json();
      setOrderId(order.id);
      setIsOrderPlaced(true);
      setCart([]);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const categories = ['All', ...Object.values(Category)];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <LoadingSpinner size="lg" color="emerald" />
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Placed!</h1>
          <p className="text-slate-600 mb-6">Your order has been received and will be prepared shortly.</p>
          <p className="text-sm text-slate-500">Order ID: {orderId}</p>
          <p className="text-sm text-slate-500 mt-2">Table: {tableId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header with Highlighted Restaurant Name */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white truncate drop-shadow-lg">
                {restaurant?.name || 'Restaurant'}
              </h1>
              <p className="text-sm sm:text-base text-emerald-50 mt-1 font-medium">Table {tableId}</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="relative">
                <button
                  onClick={() => setCart(cart.length > 0 ? [] : cart)}
                  className="relative p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all touch-manipulation active:scale-95 border border-white/30 shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs shadow-lg">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item, index) => (
            <FadeIn key={item.id} delay={index * 50}>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-lg">{item.name}</h3>
                    <span className="text-emerald-600 font-bold">₹{item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{item.description}</p>
                  <Button
                    onClick={() => addToCart(item)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white touch-manipulation active:scale-95 text-sm sm:text-base py-2.5 sm:py-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 sm:p-6 z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Cart ({cart.length} items)</h3>
              <button
                onClick={() => setCart([])}
                className="text-rose-600 hover:text-rose-700 text-sm font-semibold touch-manipulation active:scale-95"
              >
                Clear
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
              {cart.map((item) => (
                <div key={item.cartId} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                    <p className="text-emerald-600 font-bold">₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.cartId, -1)}
                      className="p-1 bg-slate-200 rounded hover:bg-slate-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold w-8 text-center">{cart.filter(i => i.id === item.id).length}</span>
                    <button
                      onClick={() => updateCartQuantity(item.cartId, 1)}
                      className="p-1 bg-slate-200 rounded hover:bg-slate-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded ml-2"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-slate-900">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full border border-slate-300 rounded-xl p-3 text-sm"
              />
            </div>
            <Button
              onClick={handlePlaceOrder}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 sm:py-4 text-base sm:text-lg font-bold shadow-lg touch-manipulation active:scale-95"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Place Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

