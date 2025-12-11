import React, { useEffect, useState } from 'react';
import { API } from '../services/api';
import { Order, OrderStatus, User } from '../types';
import { Card, Badge, Button, FadeIn, LoadingSpinner } from '../components/ui';
import { BellRing, CheckCheck, RefreshCcw, UtensilsCrossed, User as UserIcon } from 'lucide-react';
import { TABLES } from '../constants';

export const StaffPOS = ({ user }: { user: User }) => {
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
      setOrders(all);
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

  const handleServed = async (orderId: string) => {
    if (!user.adminId) return;
    try {
      await API.updateOrderStatus(orderId, OrderStatus.SERVED, user.adminId);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getActiveOrderForTable = (tableId: string) => {
    return orders
      .filter(o => o.tableId === tableId && o.status !== OrderStatus.SERVED && o.status !== OrderStatus.CANCELLED)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-7xl mx-auto pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">DineFlow POS</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Floor Management & Order Fulfillment</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="shadow-sm w-full sm:w-auto touch-manipulation"><RefreshCcw className="w-4 h-4 mr-2"/> Sync</Button>
      </header>

      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Quick Action: Ready Orders */}
        <section>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
               <BellRing className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Ready to Serve</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).map((order, i) => (
              <FadeIn key={order.id} delay={i * 100}>
                <div className="bg-white rounded-xl p-5 border-l-4 border-indigo-500 shadow-md hover:shadow-lg transition-shadow flex justify-between items-center group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xl text-slate-800">Table {order.tableId}</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">PICKUP</span>
                    </div>
                    <div className="text-sm text-slate-400 font-mono">#{order.id.slice(-4)} • {order.items.length} Items</div>
                  </div>
                  <Button onClick={() => handleServed(order.id)} className="bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200 shadow-lg">
                    Serve <CheckCheck className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </FadeIn>
            ))}
            {orders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).length === 0 && (
              <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                <p className="text-slate-400 font-medium">No orders waiting for pickup</p>
              </div>
            )}
          </div>
        </section>

        {/* Table Grid Status */}
        <section>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
               <UtensilsCrossed className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Floor Overview</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {TABLES.map((tableId, i) => {
              const activeOrder = getActiveOrderForTable(tableId);
              return (
                <FadeIn key={tableId} delay={i * 50}>
                  <div className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 h-32 sm:h-36 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-md touch-manipulation ${
                    activeOrder 
                      ? 'bg-white border-slate-200' 
                      : 'bg-slate-50 border-slate-100 opacity-70 hover:opacity-100'
                  }`}>
                    {activeOrder && (
                       <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-colors ${
                          activeOrder.status === OrderStatus.PENDING_PAYMENT ? 'bg-slate-500' :
                          activeOrder.status === OrderStatus.IN_PROGRESS ? 'bg-amber-500' :
                          'bg-emerald-500'
                       }`}></div>
                    )}
                    
                    <div className="flex justify-between items-start relative z-10">
                      <span className={`font-bold text-lg ${activeOrder ? 'text-slate-800' : 'text-slate-400'}`}>Table {tableId}</span>
                      {activeOrder && (
                        <Badge className={
                          activeOrder.status === OrderStatus.PENDING_PAYMENT ? 'bg-slate-100 text-slate-600' :
                          activeOrder.status === OrderStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }>
                          {activeOrder.status === OrderStatus.PENDING_PAYMENT ? 'Ordering' : 
                           activeOrder.status === OrderStatus.IN_PROGRESS ? 'Cooking' : 'Ready'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="relative z-10">
                      {activeOrder ? (
                        <>
                          <div className="text-2xl font-bold text-slate-900 tracking-tight">${activeOrder.totalAmount.toFixed(2)}</div>
                          <div className="text-xs text-slate-500 font-medium">{activeOrder.items.length} items ordered</div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                          Available
                        </div>
                      )}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};