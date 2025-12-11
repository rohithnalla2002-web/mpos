import React, { useEffect, useState } from 'react';
import { API } from '../services/api';
import { Order, OrderStatus, User } from '../types';
import { Card, Badge, Button, FadeIn, LoadingSpinner } from '../components/ui';
import { Clock, Check, ChefHat, Flame, User as UserIcon, RefreshCw } from 'lucide-react';

export const KitchenDisplay = ({ user }: { user: User }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user.adminId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const all = await API.getOrders(user.adminId);
      setOrders(all.filter(o => 
        o.status === OrderStatus.PAID || 
        o.status === OrderStatus.IN_PROGRESS
      ));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [user.adminId]);

  const handleStartCooking = async (orderId: string) => {
    if (!user.adminId) return;
    try {
      await API.updateOrderStatus(orderId, OrderStatus.IN_PROGRESS, user.adminId);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    if (!user.adminId) return;
    try {
      await API.updateOrderStatus(orderId, OrderStatus.READY_FOR_PICKUP, user.adminId);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-mono">
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 sm:pb-6 pt-4 sm:pt-6">
        <div className="flex-1 min-w-0">
           <div className="flex items-center gap-3 sm:gap-4 mb-2">
             <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
               <ChefHat className="text-amber-500 w-6 h-6 sm:w-8 sm:h-8" />
             </div>
             <h1 className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent truncate">DineFlow KDS</h1>
           </div>
           <p className="text-slate-500 text-xs sm:text-sm ml-0 sm:ml-16">Live Kitchen Operations Feed • {orders.length} Active</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
           <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-emerald-500 text-xs sm:text-sm font-bold uppercase tracking-wider hidden sm:inline">System Online</span>
        </div>
      </header>

      {!user.adminId && (
        <div className="text-center py-12">
          <p className="text-slate-400">You are not linked to a restaurant. Please contact your administrator.</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="amber" />
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button
          onClick={fetchOrders}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {!loading && orders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-600 animate-fade-in">
            <ChefHat className="w-24 h-24 mb-4 opacity-20" />
            <p className="text-xl font-bold uppercase tracking-widest">All Clear</p>
            <p className="text-sm">Waiting for new orders...</p>
          </div>
        )}
        
        {orders.map((order, index) => (
          <FadeIn key={order.id} delay={index * 100}>
            <div className={`relative h-full flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-300 ${
               order.status === OrderStatus.IN_PROGRESS 
                 ? 'bg-slate-900 border-amber-500/50 shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]' 
                 : 'bg-slate-900 border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]'
            }`}>
              
              {/* Header */}
              <div className={`p-4 flex justify-between items-center ${
                order.status === OrderStatus.IN_PROGRESS ? 'bg-amber-900/20' : 'bg-emerald-900/20'
              }`}>
                <div>
                  <span className="text-2xl font-black tracking-tight">#{order.id.slice(-4)}</span>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Table {order.tableId}</div>
                </div>
                <div className={`px-3 py-1 rounded border ${
                   order.status === OrderStatus.IN_PROGRESS 
                    ? 'border-amber-500 text-amber-500 bg-amber-500/10' 
                    : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                }`}>
                   <span className="text-xs font-bold flex items-center gap-2">
                     {order.status === OrderStatus.IN_PROGRESS ? <Flame className="w-3 h-3 animate-pulse" /> : <Clock className="w-3 h-3" />}
                     {order.status === OrderStatus.IN_PROGRESS ? 'COOKING' : 'NEW'}
                   </span>
                </div>
              </div>
              
              {/* Items List */}
              <div className="p-5 flex-1 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                       <span className="font-bold text-lg text-slate-200">1x {item.name}</span>
                    </div>
                    {item.notes && (
                      <div className="mt-1 text-xs text-amber-300 bg-amber-900/30 p-2 rounded border border-amber-900/50">
                        ⚠️ {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-800/50 border-t border-slate-800 mt-auto">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {(Date.now() - order.createdAt) / 1000 / 60 | 0} MIN</span>
                  <span>{order.items.length} items</span>
                </div>
                
                {order.status === OrderStatus.PAID ? (
                  <button 
                    onClick={() => handleStartCooking(order.id)}
                    className="w-full py-3 sm:py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-amber-900/50 flex items-center justify-center gap-2 group touch-manipulation text-sm sm:text-base"
                  >
                    <Flame className="w-4 h-4 group-hover:scale-110 transition-transform" /> Start Cooking
                  </button>
                ) : (
                  <button 
                    onClick={() => handleMarkReady(order.id)}
                    className="w-full py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 group touch-manipulation text-sm sm:text-base"
                  >
                    <Check className="w-5 h-5 group-hover:scale-110 transition-transform" /> Mark Ready
                  </button>
                )}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};