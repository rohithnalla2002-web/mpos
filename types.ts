export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID', // Pending Prep
  IN_PROGRESS = 'IN_PROGRESS', // Cooking
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED'
}

export enum Category {
  STARTERS = 'Starters',
  MAINS = 'Mains',
  DESSERTS = 'Desserts',
  DRINKS = 'Drinks'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isOutOfStock?: boolean;
  rating?: number;
  reviewCount?: number;
  isBestseller?: boolean;
  isTopPick?: boolean;
}

export interface CartItem extends MenuItem {
  cartId: string; // Unique ID for this instance in cart
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
  paymentId?: string;
  customerName?: string;
}

export interface PaymentSession {
  sessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  KITCHEN = 'KITCHEN',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantName?: string;
  numberOfTables?: number;
  adminId?: string; // For staff/kitchen users, links to their restaurant admin
}

export type ViewMode = 'AUTH' | 'CUSTOMER' | 'KITCHEN' | 'STAFF' | 'ADMIN';

// --- Analytics Types ---
export type TimeRange = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom';

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageRating: number;
  revenueTrend: { label: string; value: number }[]; // For charts
  revenueChange?: number; // Percentage change from previous period
  ordersChange?: number; // Percentage change from previous period
}