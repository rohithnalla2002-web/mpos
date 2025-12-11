import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, ChefHat, CreditCard, ArrowRight, Clock, CheckCircle2, XCircle, ScanLine, Star, ChevronLeft, ChevronRight, Package, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';
import { MenuItem, CartItem, Order, OrderStatus, Category, User } from '../types';
import { MockAPI, subscribe } from '../services/mockBackend';
import { API, API_BASE_URL } from '../services/api';
import { Button, Card, Badge, LoadingSpinner, FadeIn } from '../components/ui';
import { QRScanner } from '../components/QRScanner';

interface CustomerAppProps {
  initialTableId?: string;
  user: User;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ initialTableId, user }) => {
  const [scannedTable, setScannedTable] = useState<string | null>(initialTableId || null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'veg' | 'nonveg' | 'bestseller'>('all');
  const topPicksRef = React.useRef<HTMLDivElement>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ratingOrders, setRatingOrders] = useState<Record<string, Record<string, { rating: number; review?: string }>>>({});
  const [submittingRatings, setSubmittingRatings] = useState<Record<string, boolean>>({});

  // Fetch menu from database based on restaurant ID
  const fetchMenuFromDatabase = async (restId: string, tableId: string) => {
    if (!restId || !tableId) return;
    
    setMenuLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/qr/menu?restaurant=${restId}&table=${tableId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu');
      }
      const data = await response.json();
      console.log('Fetched menu from database:', data);
      setRestaurantName(data.restaurant?.name || null);
      setMenuItems(data.menu || []);
    } catch (error) {
      console.error('Error fetching menu from database:', error);
      // Fallback to mock menu if API fails
      setMenuItems(MockAPI.getMenu());
    } finally {
      setMenuLoading(false);
    }
  };

  // Only use mock menu if no restaurant ID is set (initial state)
  useEffect(() => {
    if (!restaurantId) {
      setMenuItems(MockAPI.getMenu());
      const unsub = subscribe(() => {
        setMenuItems(MockAPI.getMenu());
      });
      return unsub;
    }
  }, [restaurantId]);

  useEffect(() => {
    const unsub = subscribe(() => {
      if (currentOrderId) {
        const updatedOrder = MockAPI.getOrder(currentOrderId);
        if (updatedOrder) {
          setOrderStatus(updatedOrder.status);
        }
      }
    });
    return unsub;
  }, [currentOrderId]);

  // Fetch user orders from database
  const fetchUserOrders = async () => {
    if (!user.id) return;
    try {
      setOrdersLoading(true);
      const orders = await API.getUserOrders(user.id);
      setUserOrders(orders);
      // Update current order status if we have a current order
      if (currentOrderId) {
        const currentOrder = orders.find(o => o.id === currentOrderId);
        if (currentOrder) {
          setOrderStatus(currentOrder.status);
        }
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Poll for order updates when showing order status
  useEffect(() => {
    if (showOrderStatus) {
      fetchUserOrders();
      const interval = setInterval(fetchUserOrders, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [showOrderStatus, user.id]);



  const handleQRScan = async (data: string) => {
    try {
      // Try to parse QR code data as JSON (from our QR generator)
      let parsed: any = null;
      let tableId: string | null = null;
      let restId: string | null = null;
      let restName: string | null = null;

      try {
        parsed = JSON.parse(data);
        // QR code from our system contains restaurantId, tableId, etc.
        if (parsed.restaurantId) {
          restId = parsed.restaurantId;
        }
        if (parsed.tableId) {
          tableId = parsed.tableId;
        }
        if (parsed.restaurantName) {
          restName = parsed.restaurantName;
        }
        // If QR contains menu data directly, use it
        if (parsed.menu && Array.isArray(parsed.menu)) {
          setMenuItems(parsed.menu);
          setRestaurantName(restName);
        }
      } catch (e) {
        // If not JSON, treat as simple table ID
        tableId = data.trim();
      }

      // If we have restaurant ID, fetch menu from database
      if (restId && tableId) {
        setRestaurantId(restId);
        setScannedTable(tableId);
        await fetchMenuFromDatabase(restId, tableId);
        setShowScanner(false);
        setScanError(null);
      } else if (tableId) {
        // Fallback: just table ID, use mock menu
        const valid = await MockAPI.validateTable(tableId);
        if (valid) {
          setScannedTable(tableId);
          setShowScanner(false);
          setScanError(null);
        } else {
          setShowScanner(false);
          setScanError(`Invalid QR Code: ${tableId}`);
        }
      } else {
        setShowScanner(false);
        setScanError('Invalid QR Code: Missing restaurant or table information');
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setShowScanner(false);
      setScanError('Failed to process QR code. Please try again.');
    }
  };

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
      // Add another instance
      addToCart(item);
    }
  };

  const updateCartItemNotes = (cartId: string, notes: string) => {
    setCart(cart.map(item => 
      item.cartId === cartId ? { ...item, notes } : item
    ));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0 || !scannedTable) return;
    
    // If we have restaurant ID, create order via API
    if (restaurantId) {
      try {
        const items = cart.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          quantity: 1,
          notes: item.notes || undefined
        }));

        const response = await fetch(`${API_BASE_URL}/orders/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableId: scannedTable,
            adminId: restaurantId,
            userId: user.id,
            items,
            customerName: user.name || undefined
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Order creation failed:', response.status, errorText);
          throw new Error('Failed to create order');
        }

        const order = await response.json();
        setCurrentOrderId(order.id);
        setOrderStatus(OrderStatus.PENDING_PAYMENT);
        setIsPayModalOpen(true);
      } catch (error) {
        console.error('Error creating order:', error);
        alert('Failed to create order. Please try again.');
      }
    } else {
      // Fallback to mock API
      const order = await MockAPI.createOrder(scannedTable, cart);
      setCurrentOrderId(order.id);
      setOrderStatus(OrderStatus.PENDING_PAYMENT);
      setIsPayModalOpen(true);
    }
  };

  const processPayment = async () => {
    if (!currentOrderId) return;
    setIsProcessingPayment(true);
    setPaymentError(false);
    
    try {
      // If we have restaurant ID, update order status via API
      if (restaurantId) {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update order status to PAID in database
        const response = await fetch(`${API_BASE_URL}/orders/${currentOrderId}/status`, {
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
          throw new Error('Failed to update order status');
        }

        setOrderStatus(OrderStatus.PAID);
        setCart([]);
        setIsPayModalOpen(false);
        
        // Refresh user orders to show the updated order
        if (showOrderStatus) {
          await fetchUserOrders();
        }
      } else {
        // Fallback to mock API
        const session = await MockAPI.initiatePayment(currentOrderId, cartTotal);
        const success = await MockAPI.processPayment(session.sessionId);

        if (success) {
          await MockAPI.confirmPayment(currentOrderId);
          setOrderStatus(OrderStatus.PAID);
          setCart([]);
          setIsPayModalOpen(false);
        } else {
          setPaymentError(true);
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(true);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    let items = menuItems;
    
    // Category filter
    if (activeCategory !== 'All') {
      items = items.filter(item => item.category === activeCategory);
    }
    
    // Type filter
    if (filterType === 'veg') {
      items = items.filter(item => item.isVegetarian);
    } else if (filterType === 'nonveg') {
      items = items.filter(item => !item.isVegetarian);
    } else if (filterType === 'bestseller') {
      items = items.filter(item => item.isBestseller);
    }
    
    return items;
  }, [menuItems, activeCategory, filterType]);

  const topPicks = useMemo(() => menuItems.filter(item => item.isTopPick), [menuItems]);
  const recommendedItems = useMemo(() => filteredItems.filter(item => !item.isTopPick), [filteredItems]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    recommendedItems.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }, [recommendedItems]);

  // Get all unique categories
  const categories = useMemo(() => {
    return Object.keys(itemsByCategory).sort();
  }, [itemsByCategory]);

  // Component for Order Rating Card
  const OrderRatingCard = ({ order, orderRatings, onRatingSubmit, submitting }: { 
    order: Order; 
    orderRatings: Record<string, { rating: number; review?: string }>;
    onRatingSubmit: (orderId: string, ratings: Array<{ menuItemId: string; rating: number; review?: string }>) => Promise<void>;
    submitting: boolean;
  }) => {
    const isServed = order.status === OrderStatus.SERVED;
    const [itemRatings, setItemRatings] = useState<Record<string, { rating: number; review?: string }>>({});
    const [showRatingForm, setShowRatingForm] = useState(false);

    useEffect(() => {
      if (isServed && Array.isArray(order.items)) {
        const initialRatings: Record<string, { rating: number; review?: string }> = {};
        order.items.forEach((item: any) => {
          const existingRating = orderRatings[item.id];
          initialRatings[item.id] = existingRating || { rating: 0 };
        });
        setItemRatings(initialRatings);
      }
    }, [order.id, isServed, orderRatings]);

    const handleItemRatingChange = (itemId: string, rating: number) => {
      setItemRatings(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], rating }
      }));
    };

    const handleItemReviewChange = (itemId: string, review: string) => {
      setItemRatings(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], review }
      }));
    };

    const handleSubmitRatings = async () => {
      const ratingsToSubmit = Object.entries(itemRatings)
        .filter(([_, rating]) => rating.rating > 0)
        .map(([itemId, rating]) => ({
          menuItemId: itemId,
          rating: rating.rating,
          review: rating.review
        }));

      if (ratingsToSubmit.length === 0) {
        alert('Please rate at least one item');
        return;
      }

      await onRatingSubmit(order.id, ratingsToSubmit);
      setShowRatingForm(false);
    };

    const allRated = isServed && Array.isArray(order.items) && 
      order.items.every((item: any) => orderRatings[item.id]?.rating > 0);

    const getStatusInfo = (status: OrderStatus) => {
      switch (status) {
        case OrderStatus.PENDING_PAYMENT:
          return { msg: 'Pending Payment', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
        case OrderStatus.PAID:
          return { msg: 'Payment Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        case OrderStatus.IN_PROGRESS:
          return { msg: 'Cooking in Progress', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
        case OrderStatus.READY_FOR_PICKUP:
          return { msg: 'Ready for Pickup!', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
        case OrderStatus.SERVED:
          return { msg: 'Order Served', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        case OrderStatus.CANCELLED:
          return { msg: 'Cancelled', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
        default:
          return { msg: 'Processing', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
      }
    };

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString();
    };

    const statusInfo = getStatusInfo(order.status);

    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900">Order #{order.id}</span>
              <Badge className={`${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border} text-xs`}>
                {statusInfo.msg}
              </Badge>
              {isServed && allRated && (
                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs">
                  Rated
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">Table #{order.tableId} • {formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">${order.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Items List */}
        {Array.isArray(order.items) && order.items.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">Items:</p>
            <div className="space-y-1">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="text-xs text-slate-600">
                  {item.quantity || 1}x {item.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating Section for Served Orders */}
        {isServed && (
          <div className="border-t border-slate-200 pt-3 mt-3">
            {!showRatingForm && !allRated && (
              <Button
                onClick={() => setShowRatingForm(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm"
              >
                <Star className="w-4 h-4 mr-2" />
                Rate Your Order
              </Button>
            )}

            {showRatingForm && !allRated && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Rate Your Experience</h4>
                {Array.isArray(order.items) && order.items.map((item: any, idx: number) => {
                  const currentRating = itemRatings[item.id]?.rating || 0;
                  const currentReview = itemRatings[item.id]?.review || '';
                  const existingRating = orderRatings[item.id];

                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                        {existingRating && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Rated</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleItemRatingChange(item.id, star)}
                            className={`transition-all ${
                              star <= (existingRating?.rating || currentRating)
                                ? 'text-amber-400 scale-110'
                                : 'text-slate-300 hover:text-amber-300'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${star <= (existingRating?.rating || currentRating) ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                        <span className="text-xs text-slate-500 ml-2">
                          {existingRating?.rating || currentRating || 'Not rated'}
                        </span>
                      </div>
                      {!existingRating && (
                        <textarea
                          value={currentReview}
                          onChange={(e) => handleItemReviewChange(item.id, e.target.value)}
                          placeholder="Add a review (optional)..."
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                          rows={2}
                        />
                      )}
                    </div>
                  );
                })}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitRatings}
                    disabled={submitting}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Submit Ratings
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowRatingForm(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {allRated && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you for your feedback!</span>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  if (showScanner) {
    return <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />;
  }

  // View: Order Status
  if (showOrderStatus) {
    const activeOrders = userOrders.filter(o => o.status !== OrderStatus.SERVED && o.status !== OrderStatus.CANCELLED);
    const pastOrders = userOrders.filter(o => o.status === OrderStatus.SERVED || o.status === OrderStatus.CANCELLED);

    const getStatusInfo = (status: OrderStatus) => {
      switch (status) {
        case OrderStatus.PENDING_PAYMENT:
          return { msg: 'Pending Payment', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
        case OrderStatus.PAID:
          return { msg: 'Payment Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        case OrderStatus.IN_PROGRESS:
          return { msg: 'Cooking in Progress', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
        case OrderStatus.READY_FOR_PICKUP:
          return { msg: 'Ready for Pickup!', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
        case OrderStatus.SERVED:
          return { msg: 'Order Served', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        case OrderStatus.CANCELLED:
          return { msg: 'Cancelled', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
        default:
          return { msg: 'Processing', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
      }
    };

    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString();
    };

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowOrderStatus(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
                <p className="text-xs text-slate-500">Track your order status</p>
              </div>
            </div>
            <Button
              onClick={fetchUserOrders}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={ordersLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" color="emerald" />
            </div>
          ) : (
            <>
              {activeOrders.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Active Orders</h2>
                  <div className="space-y-4">
                    {activeOrders.map((order) => {
                      const statusInfo = getStatusInfo(order.status);
                      return (
                        <Card key={order.id} className={`p-6 border-2 ${statusInfo.border} ${statusInfo.bg}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-slate-900">Order #{order.id}</h3>
                                <Badge className={`${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
                                  {statusInfo.msg}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">Table #{order.tableId} • {formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-600">${order.totalAmount.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 pt-4 mt-4">
                            <p className="text-sm font-semibold text-slate-700 mb-2">Items:</p>
                            <div className="space-y-1">
                              {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm text-slate-600">
                                  <span>{item.quantity || 1}x {item.name}</span>
                                  <span className="font-semibold">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-1000"
                                style={{
                                  width:
                                    order.status === OrderStatus.PAID ? '25%' :
                                    order.status === OrderStatus.IN_PROGRESS ? '50%' :
                                    order.status === OrderStatus.READY_FOR_PICKUP ? '75%' :
                                    order.status === OrderStatus.SERVED ? '100%' : '10%'
                                }}
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              {pastOrders.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Past Orders</h2>
                  <div className="space-y-4">
                    {pastOrders.map((order) => (
                      <OrderRatingCard
                        key={order.id}
                        order={order}
                        orderRatings={ratingOrders[order.id] || {}}
                        onRatingSubmit={handleRatingSubmit}
                        submitting={submittingRatings[order.id] || false}
                      />
                    ))}
                  </div>
                </div>
              )}
              {activeOrders.length === 0 && pastOrders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No orders yet</p>
                  <p className="text-sm text-slate-500">Place an order to see it here</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // View: Landing / Table Selection
  if (!scannedTable) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>

        <div className="w-full max-w-md text-center space-y-8 relative z-10 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">DineFlow</h1>
            <p className="text-slate-300 text-lg">Experience the future of dining</p>
          </div>
          
          <div className="relative aspect-square max-w-xs mx-auto flex flex-col items-center justify-center">
             <Button 
                onClick={() => setShowScanner(true)}
                className="w-48 h-48 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all flex flex-col items-center justify-center group shadow-2xl"
             >
                <div className="p-4 bg-emerald-500 rounded-full mb-4 shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                   <ScanLine className="w-8 h-8 text-white" />
                </div>
                <span className="text-lg font-bold">Scan QR Code</span>
             </Button>
          </div>

          {scanError && (
             <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl text-sm animate-slide-up">
               {scanError}
             </div>
          )}
        </div>
      </div>
    );
  }

  // View: Order Status (After Payment)
  if (orderStatus && orderStatus !== OrderStatus.PENDING_PAYMENT && orderStatus !== OrderStatus.PAID) {
    const getStatusInfo = (status: OrderStatus) => {
      switch (status) {
        case OrderStatus.IN_PROGRESS:
          return { msg: 'Cooking in Progress', sub: 'Your order is being prepared', icon: ChefHat, color: 'text-amber-500', bg: 'bg-amber-50' };
        case OrderStatus.READY_FOR_PICKUP:
          return { msg: 'Ready for Pickup!', sub: 'Your order is ready', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
        case OrderStatus.SERVED:
          return { msg: 'Order Served', sub: 'Enjoy your meal!', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
        case OrderStatus.CANCELLED:
          return { msg: 'Order Cancelled', sub: 'Your order has been cancelled', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' };
        default:
          return { msg: 'Processing', sub: 'Please wait', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' };
      }
    };

    const info = getStatusInfo(orderStatus);

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-emerald-600 rounded-b-[3rem] shadow-lg"></div>
        
        <Card className="w-full max-w-md p-8 text-center space-y-8 relative z-10 shadow-2xl animate-scale-in mt-10">
          <div className={`w-24 h-24 ${info.bg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner relative`}>
             <div className="absolute inset-0 rounded-full border-4 border-white/50"></div>
            {orderStatus === OrderStatus.IN_PROGRESS ? (
              <ChefHat className={`w-12 h-12 ${info.color} animate-bounce`} />
            ) : orderStatus === OrderStatus.READY_FOR_PICKUP ? (
              <CheckCircle2 className={`w-12 h-12 ${info.color} animate-pulse`} />
            ) : (
              <Clock className={`w-12 h-12 ${info.color}`} />
            )}
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{info.msg}</h2>
            <p className="text-slate-500">{info.sub}</p>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: 
                orderStatus === OrderStatus.PAID ? '25%' :
                orderStatus === OrderStatus.IN_PROGRESS ? '55%' :
                orderStatus === OrderStatus.READY_FOR_PICKUP ? '85%' : '100%'
              }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[pulse_2s_infinite]"></div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Order ID: {currentOrderId}</p>
            <Button onClick={() => {
              setCurrentOrderId(null);
              setOrderStatus(null);
              setCart([]);
            }} variant="outline" className="w-full">
              Place New Order
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main Menu View - Swiggy Style
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <div onClick={() => setScannedTable(null)} className="cursor-pointer group flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 group-hover:opacity-80 transition-opacity truncate">
              {restaurantName || 'DineFlow'}
            </h1>
            <p className="text-xs text-slate-500">Table {scannedTable}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Button
              onClick={() => {
                setShowOrderStatus(true);
                fetchUserOrders();
              }}
              className="bg-green-500 hover:bg-green-600 text-white border border-green-600 text-xs sm:text-sm px-3 sm:px-4 py-2 touch-manipulation"
            >
              <Package className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">My Orders</span>
              {userOrders.filter(o => o.status !== OrderStatus.SERVED && o.status !== OrderStatus.CANCELLED).length > 0 && (
                <span className="ml-1 sm:ml-2 bg-emerald-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                  {userOrders.filter(o => o.status !== OrderStatus.SERVED && o.status !== OrderStatus.CANCELLED).length}
                </span>
              )}
            </Button>
            <button
              onClick={() => setShowCartModal(true)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
            </button>
          </div>
        </div>
      </header>

      {/* Loading Indicator */}
      {menuLoading && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" color="emerald" />
            <span className="ml-3 text-slate-600">Loading menu...</span>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="sticky top-[76px] z-30 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto no-scrollbar touch-pan-x">
        <button
          onClick={() => setFilterType('veg')}
          className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 touch-manipulation active:scale-95 transition-transform ${
            filterType === 'veg' 
              ? 'bg-green-50 text-green-700 border-2 border-green-500' 
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          Vegetarian
        </button>
        <button
          onClick={() => setFilterType('nonveg')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
            filterType === 'nonveg' 
              ? 'bg-red-50 text-red-700 border-2 border-red-500' 
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          <div className="w-3 h-3 rounded-sm bg-red-500 transform rotate-45"></div>
          Non-Vegetarian
        </button>
        <button
          onClick={() => setFilterType('bestseller')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filterType === 'bestseller' 
              ? 'bg-orange-50 text-orange-700 border-2 border-orange-500' 
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Bestseller
        </button>
        {filterType !== 'all' && (
          <button
            onClick={() => setFilterType('all')}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-slate-100 text-slate-600"
          >
            Clear
          </button>
        )}
        </div>
      </div>

      {/* Top Picks Section */}
      {topPicks.length > 0 && (
        <div className="py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Top Picks</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (topPicksRef.current) {
                      topPicksRef.current.scrollBy({ left: -340, behavior: 'smooth' });
                    }
                  }}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (topPicksRef.current) {
                      topPicksRef.current.scrollBy({ left: 340, behavior: 'smooth' });
                    }
                  }}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div ref={topPicksRef} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar touch-pan-x pb-2" style={{ scrollBehavior: 'smooth' }}>
              {topPicks.map((item) => (
                <div key={item.id} className="min-w-[280px] sm:min-w-[300px] md:min-w-[320px] bg-slate-900 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                  <div className="relative h-52 md:h-56">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      {item.isVegetarian ? (
                        <div className="w-7 h-7 rounded bg-green-500 flex items-center justify-center shadow-md">
                          <div className="w-4 h-4 rounded-full bg-white"></div>
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-red-500 transform rotate-45 flex items-center justify-center shadow-md">
                          <div className="w-4 h-4 bg-white transform -rotate-45"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 text-white">
                    <h3 className="font-bold text-base mb-2 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">₹{item.price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-4 sm:px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors touch-manipulation active:scale-95"
                      >
                        ADD
                      </button>
                    </div>
                </div>
                </div>
              ))}
              </div>
           </div>
        </div>
      )}

      {/* Items by Category */}
      <div className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.map((category) => (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-slate-900">{category}</h2>
                <span className="text-sm text-slate-500">({itemsByCategory[category].length})</span>
              </div>
              <div className="space-y-4">
                {itemsByCategory[category].map((item) => {
              const itemInCart = cart.find(c => c.id === item.id);
              const quantity = cart.filter(c => c.id === item.id).length;
              
              return (
                <div key={item.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        {item.isVegetarian ? (
                          <div className="w-4 h-4 rounded border-2 border-green-500 flex items-center justify-center mt-0.5 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                        ) : (
                          <div className="w-4 h-4 border-2 border-red-500 transform rotate-45 flex items-center justify-center mt-0.5 shrink-0">
                            <div className="w-2 h-2 bg-red-500 transform -rotate-45"></div>
                          </div>
                        )}
                        <h3 className="font-semibold text-slate-900 text-base md:text-lg">{item.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-bold text-slate-900 text-base md:text-lg">₹{item.price}</span>
                        {item.rating && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{item.rating}</span>
                            <span className="text-slate-400">({item.reviewCount})</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2 pr-2">{item.description}</p>
                      <div className="flex items-center gap-3">
                        {itemInCart ? (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                            <button
                              onClick={() => updateCartQuantity(itemInCart.cartId, -1)}
                              className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors touch-manipulation active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                            </button>
                            <span className="font-semibold text-green-700 min-w-[24px] sm:min-w-[20px] text-center text-sm sm:text-base">{quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors touch-manipulation active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-4 py-2 sm:py-1.5 border border-green-500 text-green-600 hover:bg-green-50 text-sm font-semibold rounded-lg transition-colors touch-manipulation active:scale-95"
                          >
                            ADD
                          </button>
                        )}
                        <span className="text-xs text-slate-500">Customisable</span>
                      </div>
                    </div>
                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary - Bottom */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <p className="text-xs text-slate-500">{cart.length} items</p>
              <p className="text-lg font-bold text-slate-900">₹{cartTotal}</p>
            </div>
            <button
              onClick={() => setShowCartModal(true)}
              className="px-6 py-3 sm:py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors touch-manipulation active:scale-95 text-sm sm:text-base"
            >
              View Cart
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Your Cart</h2>
              <button onClick={() => setShowCartModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {cart.map((item) => {
                const itemCount = cart.filter(c => c.id === item.id).length;
                const firstItem = cart.findIndex(c => c.id === item.id) === cart.indexOf(item);
                
                if (!firstItem) return null;
                
                // Get notes for this item (use first instance's notes)
                const firstInstance = cart.find(c => c.id === item.id);
                const itemNotes = firstInstance?.notes || '';
                
                return (
                  <div key={item.id} className="border-b border-slate-200 pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-500">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                          <button
                            onClick={() => {
                              const itemToRemove = cart.find(c => c.id === item.id);
                              if (itemToRemove) removeFromCart(itemToRemove.cartId);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-semibold text-green-700 min-w-[20px] text-center">{itemCount}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-slate-900 w-20 text-right">₹{item.price * itemCount}</span>
                      </div>
                    </div>
                    
                    {/* Cooking Request Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Cooking Request (Optional)
                      </label>
                      <input
                        type="text"
                        value={itemNotes}
                        onChange={(e) => {
                          // Update notes for all instances of this item
                          cart.forEach(cartItem => {
                            if (cartItem.id === item.id) {
                              updateCartItemNotes(cartItem.cartId, e.target.value);
                            }
                          });
                        }}
                        placeholder="e.g., Well done, No onions, Extra spicy..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 pt-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-slate-700">Total</span>
                <span className="text-2xl font-bold text-slate-900">₹{cartTotal}</span>
              </div>
              <button
                onClick={() => {
                  setShowCartModal(false);
                  handleCheckout();
                }}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-sm p-6 space-y-5 animate-scale-in shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Review Order</h2>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><XCircle className="text-slate-400 w-6 h-6" /></button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item, i) => (
                <div key={item.cartId} className="flex justify-between text-sm items-center py-1">
                  <span className="text-slate-600 font-medium truncate pr-4">{item.name}</span>
                  <span className="text-slate-800 font-bold">₹{item.price}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between font-bold text-xl text-slate-900">
              <span>Total Amount</span>
              <span>₹{cartTotal}</span>
            </div>

            {paymentError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
                <XCircle className="w-4 h-4" /> Payment Failed. Please retry.
              </div>
            )}

            <Button 
              onClick={processPayment} 
              disabled={isProcessingPayment}
              className="w-full py-3.5 text-lg shadow-xl shadow-emerald-500/20"
            >
              {isProcessingPayment ? <LoadingSpinner /> : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" /> Pay Now
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest">Secure Payment Processing</p>
          </Card>
        </div>
      )}
    </div>
  );
};
