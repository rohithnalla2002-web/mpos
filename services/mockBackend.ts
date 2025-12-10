import { Order, OrderStatus, PaymentSession, MenuItem, CartItem, User, UserRole, AnalyticsData, TimeRange } from '../types';
import { MENU_ITEMS } from '../constants';

// Simple event emitter for real-time simulation
type Listener = () => void;
const listeners: Set<Listener> = new Set();
export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const notify = () => listeners.forEach(l => l());

// Mock Database State
let orders: Order[] = [];
let menu: MenuItem[] = [...MENU_ITEMS]; // Mutable menu
let users: User[] = [
  { id: '1', email: 'admin@dineflow.com', name: 'Admin User', role: UserRole.ADMIN },
  { id: '2', email: 'staff@dineflow.com', name: 'Wait Staff', role: UserRole.STAFF },
  { id: '3', email: 'chef@dineflow.com', name: 'Head Chef', role: UserRole.KITCHEN },
  { id: '4', email: 'user@gmail.com', name: 'John Doe', role: UserRole.CUSTOMER },
];

// Mock Analytics Generator
const generateAnalytics = (range: TimeRange): AnalyticsData => {
  // Determine multiplier based on range to simulate scale
  let multiplier = 1;
  let points = 7;
  let labels: string[] = [];

  switch (range) {
    case 'Today':
      multiplier = 1;
      points = 8; // Hours
      labels = ['10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
      break;
    case 'Week':
      multiplier = 7;
      points = 7;
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      break;
    case 'Month':
      multiplier = 30;
      points = 4;
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      break;
    case 'Year':
      multiplier = 365;
      points = 12;
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      break;
    default:
      multiplier = 1;
      labels = ['N/A'];
  }

  // Generate random trend data
  const revenueTrend = labels.map(label => ({
    label,
    value: Math.floor(Math.random() * 500 * (range === 'Year' ? 10 : 1)) + 100
  }));

  const totalRevenue = revenueTrend.reduce((sum, item) => sum + item.value, 0);
  
  return {
    totalRevenue,
    totalOrders: Math.floor(totalRevenue / 25), // Approx $25 per order
    averageRating: 4.2 + (Math.random() * 0.8), // Random 4.2 - 5.0
    revenueTrend
  };
};

// API Methods
export const MockAPI = {
  // --- Auth ---
  login: async (email: string): Promise<User | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return users.find(u => u.email === email);
  },

  register: async (email: string, name: string, role: UserRole): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role
    };
    users.push(newUser);
    return newUser;
  },

  getUsers: (): User[] => users,

  addUser: async (name: string, email: string, role: UserRole): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role
    };
    users.push(newUser);
    notify();
    return newUser;
  },

  // --- Menu ---
  getMenu: (): MenuItem[] => menu,

  addMenuItem: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    menu = [...menu, newItem];
    notify();
    return newItem;
  },

  // --- Analytics ---
  getAnalytics: async (range: TimeRange): Promise<AnalyticsData> => {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate calculation
    return generateAnalytics(range);
  },

  // --- Orders ---
  // 1. Validate Table
  validateTable: async (tableId: string): Promise<boolean> => {
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
  },

  // 2. Create Order (Initial Step)
  createOrder: async (tableId: string, items: CartItem[]): Promise<Order> => {
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      tableId,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.price, 0),
      status: OrderStatus.PENDING_PAYMENT,
      createdAt: Date.now(),
    };
    orders = [...orders, newOrder]; // Append
    notify();
    return newOrder;
  },

  // 3. Initiate Payment
  initiatePayment: async (orderId: string, amount: number): Promise<PaymentSession> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Network delay
    return {
      sessionId: `SESS-${Math.random().toString(36).substring(7)}`,
      amount,
      currency: 'USD',
      status: 'pending'
    };
  },

  // 4. Process Payment (Simulates Gateway Interaction)
  processPayment: async (sessionId: string, shouldFail: boolean = false): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Processing time
    return !shouldFail;
  },

  // 4b. Webhook / Callback Handler
  confirmPayment: async (orderId: string): Promise<void> => {
    orders = orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.PAID } : o);
    notify();
  },

  // 5. Kitchen Updates
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    orders = orders.map(o => o.id === orderId ? { ...o, status } : o);
    notify();
  },

  // Getters
  getOrders: (): Order[] => orders,
  
  getOrder: (orderId: string): Order | undefined => orders.find(o => o.id === orderId),
  
  getOrdersByTable: (tableId: string): Order[] => orders.filter(o => o.tableId === tableId),
};