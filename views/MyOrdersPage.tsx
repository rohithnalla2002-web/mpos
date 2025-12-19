import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { API_BASE_URL } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { Package, Clock, CreditCard, ChefHat, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from '../utils/router';

interface MyOrdersPageProps {
  restaurantId: string;
  tableId: string;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ restaurantId, tableId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useRouter();

  // Fetch orders for this table
  const fetchTableOrders = async () => {
    if (!restaurantId || !tableId) return;
    
    setLoading(true);
    try {
      // Fetch all orders for the restaurant and filter by table
      const response = await fetch(`${API_BASE_URL}/orders/${restaurantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const allOrders = await response.json();
      
      // Filter orders by table ID
      const cleanTableId = tableId.toString().trim().replace(/[^0-9]/g, '');
      const tableOrders = allOrders.filter((order: Order) => 
        order.tableId && order.tableId.toString().trim().replace(/[^0-9]/g, '') === cleanTableId
      );
      
      // Sort by creation date (newest first)
      tableOrders.sort((a: Order, b: Order) => b.createdAt - a.createdAt);
      
      setOrders(tableOrders);
    } catch (error) {
      console.error('Error fetching table orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableOrders();
    // Poll for order updates every 5 seconds
    const interval = setInterval(fetchTableOrders, 5000);
    return () => clearInterval(interval);
  }, [restaurantId, tableId]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PAID:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.IN_PROGRESS:
        return 'bg-orange-100 text-orange-800';
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.SERVED:
        return 'bg-emerald-100 text-emerald-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return <Clock className="w-4 h-4" />;
      case OrderStatus.PAID:
        return <CreditCard className="w-4 h-4" />;
      case OrderStatus.IN_PROGRESS:
        return <ChefHat className="w-4 h-4" />;
      case OrderStatus.READY_FOR_PICKUP:
        return <Package className="w-4 h-4" />;
      case OrderStatus.SERVED:
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return 'Pending Payment';
      case OrderStatus.PAID:
        return 'Paid - Preparing';
      case OrderStatus.IN_PROGRESS:
        return 'Cooking';
      case OrderStatus.READY_FOR_PICKUP:
        return 'Ready for Pickup';
      case OrderStatus.SERVED:
        return 'Served';
      case OrderStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Get restaurant and table from URL params as fallback
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const finalRestaurantId = restaurantId || urlParams?.get('restaurant') || '';
  const finalTableId = tableId || urlParams?.get('table') || '';

  const handleBackToMenu = () => {
    if (finalRestaurantId && finalTableId) {
      window.location.href = `/menu?restaurant=${finalRestaurantId}&table=${finalTableId}`;
    } else {
      navigate('landing');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToMenu}
              className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">My Orders</h1>
              <p className="text-sm text-emerald-50">Table {finalTableId?.toString().replace(/[^0-9]/g, '') || finalTableId || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" color="emerald" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2 font-semibold">No orders yet</p>
            <p className="text-slate-500 text-sm mb-6">Your orders will appear here once you place them.</p>
            <button
              onClick={handleBackToMenu}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all"
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-4 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg text-slate-900">Order #{order.id.slice(-6)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-emerald-600">₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Items:</p>
                  <div className="space-y-2">
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                        <span className="text-slate-700">
                          {item.quantity || 1}x {item.name}
                        </span>
                        <span className="text-slate-900 font-semibold">
                          ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

