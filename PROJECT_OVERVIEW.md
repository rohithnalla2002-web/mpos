# DineFlow POS System - High-Level Overview

## Project Flow: From Restaurant Registration to Serving Food

This document provides a comprehensive overview of the complete flow in the DineFlow Point of Sale (POS) system, from restaurant registration to order fulfillment.

---

## 🏗️ System Architecture

**Technology Stack:**
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Authentication**: bcrypt for password hashing
- **File Storage**: Local file system (multer)
- **QR Code Generation**: qrcode library

**User Roles:**
1. **ADMIN** - Restaurant owner/manager
2. **STAFF** - Front-of-house staff (POS system)
3. **KITCHEN** - Kitchen staff (Kitchen Display System)
4. **CUSTOMER** - End customers (via QR code menu)

---

## 📋 Complete Flow Breakdown

### **Phase 1: Restaurant Registration**

#### Step 1.1: Restaurant Owner Registration
- **Location**: `views/RestaurantRegistration.tsx`
- **Process**:
  1. Restaurant owner visits landing page
  2. Clicks "Register Restaurant" or "Get Started"
  3. Fills out multi-step registration form:
     - **Step 1**: Basic Info (Restaurant name, Owner name, Email, Password, Phone)
     - **Step 2**: Business Details (Cuisine type, Address, Business type, Tax ID)
     - **Step 3**: Documents Upload (Business license, Tax document, Health permit, Owner ID proof, Restaurant photo)
     - **Step 4**: Restaurant Setup (Number of tables, Operating hours, Description)
  4. Submits form with all documents

#### Step 1.2: Backend Processing
- **Location**: `server/index.js` - `/api/restaurant/register` endpoint
- **Process**:
  1. Receives FormData with all restaurant details and files
  2. Validates email uniqueness across all user tables
  3. Hashes password using bcrypt
  4. Uploads documents to `server/uploads/` directory
  5. Creates admin record in `admin` table with:
     - Restaurant information
     - Document file paths
     - Registration status (default: 'pending')
  6. Returns admin user object with `adminId`

#### Step 1.3: Admin Dashboard Access
- **Location**: `views/AdminDashboard.tsx`
- **Process**:
  1. Admin logs in with registered credentials
  2. Redirected to Admin Dashboard
  3. Dashboard shows:
     - Analytics (Revenue, Orders, Ratings)
     - Menu Management
     - Staff Management
     - QR Code Generation
     - Order Management

---

### **Phase 2: Menu Setup**

#### Step 2.1: Adding Menu Items
- **Location**: `views/AdminDashboard.tsx` - MenuManagementView
- **Process**:
  1. Admin navigates to "Menu Management" section
  2. Clicks "Add Item" button
  3. Fills form with:
     - Item name
     - Description
     - Price
     - Category (Starters, Mains, Desserts, Drinks)
     - Image URL
     - Vegetarian/Non-vegetarian flag
     - Spicy flag
     - Out of stock flag
  4. Submits item

#### Step 2.2: Menu Item Storage
- **Location**: `server/index.js` - `/api/menu` endpoints
- **Process**:
  1. Backend receives menu item data
  2. Validates admin_id exists
  3. Inserts into `menu_items` table with:
     - `admin_id` (links to restaurant)
     - All item details
     - Default rating: 0, review_count: 0
  4. Returns created menu item

#### Step 2.3: Menu Management
- Admin can:
  - View all menu items
  - Edit existing items
  - Delete items
  - Mark items as out of stock
  - View item ratings and reviews

---

### **Phase 3: QR Code Generation**

#### Step 3.1: Generate QR Codes for Tables
- **Location**: `views/AdminDashboard.tsx` - QR Code Generation section
- **Process**:
  1. Admin navigates to QR Code section
  2. Selects table number (1 to N, based on `number_of_tables`)
  3. Clicks "Generate QR Code"

#### Step 3.2: QR Code Creation
- **Location**: `server/index.js` - `/api/qr/generate` endpoint
- **Process**:
  1. Backend receives `restaurantId` and `tableId`
  2. Constructs URL: `http://[domain]/menu?restaurant=[restaurantId]&table=[tableId]`
  3. Generates QR code image using `qrcode` library
  4. Returns QR code as base64 image or PNG file
  5. Admin can download/print QR codes for each table

#### Step 3.3: QR Code Placement
- Admin prints QR codes and places them on physical tables
- Each table has a unique QR code linking to that table's menu

---

### **Phase 4: Customer Ordering (QR Menu Flow)**

#### Step 4.1: Customer Scans QR Code
- **Location**: `views/QRMenuView.tsx`
- **Process**:
  1. Customer sits at table
  2. Scans QR code with phone camera
  3. QR code contains URL: `/menu?restaurant=[id]&table=[id]`
  4. Browser navigates to menu page

#### Step 4.2: Menu Display
- **Location**: `server/index.js` - `/api/qr/menu` endpoint (public, CORS enabled)
- **Process**:
  1. Frontend extracts `restaurant` and `table` from URL params
  2. Makes GET request to `/api/qr/menu?restaurant=[id]&table=[id]`
  3. Backend:
     - Validates restaurant exists
     - Fetches all menu items where `admin_id = restaurantId`
     - Includes ratings and review counts
     - Returns restaurant name and menu items
  4. Frontend displays:
     - Restaurant name header
     - Table number
     - Menu items in grid (3-4 per row)
     - Each item shows: image, name, price, rating, description, "ADD" button

#### Step 4.3: Adding Items to Cart
- **Process**:
  1. Customer browses menu items
  2. Clicks "ADD" button on desired items
  3. Items added to cart (stored in React state)
  4. Cart icon shows item count
  5. Customer can view cart, adjust quantities, remove items

#### Step 4.4: Placing Order
- **Process**:
  1. Customer clicks "VIEW CART" or cart icon
  2. Cart modal shows:
     - All items with quantities
     - Total amount
     - Cooking instructions textarea (optional)
  3. Customer enters cooking instructions (e.g., "No onions", "Extra spicy")
  4. Clicks "Place Order"

#### Step 4.5: Order Creation
- **Location**: `server/index.js` - `/api/orders/create` endpoint
- **Process**:
  1. Frontend sends POST request with:
     - `tableId`
     - `adminId` (restaurant ID)
     - `items` (array of menu items with quantities)
     - `customerName` (stores cooking instructions)
  2. Backend:
     - Validates restaurant exists
     - Calculates total amount
     - Creates order in `orders` table with status: `PENDING_PAYMENT`
     - Returns order object with order ID
  3. Frontend:
     - Clears cart
     - Shows payment modal

#### Step 4.6: Payment Processing
- **Location**: `views/QRMenuView.tsx` - PaymentModal
- **Process**:
  1. Payment modal displays:
     - Order summary
     - Total amount
     - Payment method (Test Payment for demo)
  2. Customer clicks "Pay Now"
  3. Frontend sends PATCH request to `/api/orders/[orderId]/status`
  4. Backend updates order status to `PAID`
  5. Frontend shows success animation
  6. After 2.5 seconds, redirects to `/orders?restaurant=[id]&table=[id]`

---

### **Phase 5: Kitchen Processing**

#### Step 5.1: Kitchen Display System
- **Location**: `views/KitchenDisplay.tsx`
- **Process**:
  1. Kitchen staff logs in (role: KITCHEN)
  2. Kitchen Display System shows:
     - All orders with status `PAID` or `IN_PROGRESS`
     - Order details (table number, items, quantities)
     - Cooking instructions (from `customer_name` field)
  3. System auto-refreshes every 5 seconds

#### Step 5.2: Starting Order Preparation
- **Process**:
  1. Kitchen staff sees new order (status: `PAID`)
  2. Clicks "Start Cooking" button
  3. Frontend sends PATCH request to update status to `IN_PROGRESS`
  4. Order card changes color (amber) to indicate cooking

#### Step 5.3: Marking Order Ready
- **Process**:
  1. Kitchen completes cooking
  2. Clicks "Mark Ready" button
  3. Frontend sends PATCH request to update status to `READY_FOR_PICKUP`
  4. Order disappears from Kitchen Display (only shows PAID/IN_PROGRESS)

---

### **Phase 6: Staff POS System**

#### Step 6.1: Staff View
- **Location**: `views/StaffPOS.tsx`
- **Process**:
  1. Staff logs in (role: STAFF)
  2. Staff POS shows all orders for their restaurant
  3. Orders grouped by status:
     - Pending Payment
     - Paid (Preparing)
     - In Progress (Cooking)
     - Ready for Pickup
     - Served
     - Cancelled

#### Step 6.2: Order Management
- **Process**:
  1. Staff sees order with status `READY_FOR_PICKUP`
  2. Staff delivers order to table
  3. Clicks "Mark as Served" button
  4. Frontend sends PATCH request to update status to `SERVED`
  5. Order moves to "Served" section

---

### **Phase 7: Customer Order Tracking**

#### Step 7.1: My Orders Page
- **Location**: `views/MyOrdersPage.tsx`
- **Process**:
  1. Customer navigates to `/orders?restaurant=[id]&table=[id]`
  2. Page fetches all orders for that table
  3. Displays orders with:
     - Order ID
     - Status badge (color-coded)
     - Order items and quantities
     - Total amount
     - Timestamp
  4. Auto-refreshes every 5 seconds to show status updates

#### Step 7.2: Order Status Flow
- **Status Progression**:
  1. `PENDING_PAYMENT` → Yellow badge
  2. `PAID` → Blue badge ("Paid - Preparing")
  3. `IN_PROGRESS` → Orange badge ("Cooking")
  4. `READY_FOR_PICKUP` → Purple badge
  5. `SERVED` → Green badge
  6. `CANCELLED` → Red badge

---

### **Phase 8: Ratings & Reviews (Optional)**

#### Step 8.1: Rating Submission
- **Location**: `views/CustomerApp.tsx` (for logged-in customers)
- **Process**:
  1. After order is `SERVED`, customer can rate items
  2. Customer selects star rating (1-5) for each item
  3. Optionally adds text review
  4. Submits ratings

#### Step 8.2: Rating Storage
- **Location**: `server/index.js` - `/api/ratings/submit` endpoint
- **Process**:
  1. Backend stores ratings in `ratings` table
  2. Calculates average rating for each menu item
  3. Updates `menu_items` table with:
     - `rating` (average)
     - `review_count`
  4. Ratings appear on menu items in future orders

---

## 🔄 Order Status Lifecycle

```
PENDING_PAYMENT → PAID → IN_PROGRESS → READY_FOR_PICKUP → SERVED
                      ↓
                  CANCELLED (if needed)
```

**Status Transitions:**
- **PENDING_PAYMENT**: Order created, awaiting payment
- **PAID**: Payment received, waiting for kitchen
- **IN_PROGRESS**: Kitchen is cooking
- **READY_FOR_PICKUP**: Food ready, waiting for staff to serve
- **SERVED**: Order delivered to customer
- **CANCELLED**: Order cancelled (can happen at any stage)

---

## 🗄️ Database Schema Overview

### Key Tables:
1. **admin** - Restaurant owners with registration details
2. **staff** - Front-of-house staff (linked to admin via `admin_id`)
3. **kitchen** - Kitchen staff (linked to admin via `admin_id`)
4. **customer** - Customer accounts (optional, for logged-in users)
5. **menu_items** - Menu items (linked to admin via `admin_id`)
6. **orders** - All orders (linked to admin, table, and optionally user)
7. **ratings** - Item ratings and reviews (linked to order, menu_item, user)

---

## 🔐 Authentication Flow

1. **Registration**: User registers with email, password, name, role
2. **Login**: User logs in, backend validates credentials
3. **Session**: User data stored in localStorage
4. **Role-based Access**: Different dashboards based on role:
   - ADMIN → Admin Dashboard
   - STAFF → Staff POS
   - KITCHEN → Kitchen Display
   - CUSTOMER → Customer App (optional)

---

## 🌐 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/restaurant/register` - Restaurant registration

### Menu
- `GET /api/menu/:adminId` - Get restaurant menu
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item
- `GET /api/qr/menu` - Public menu endpoint (for QR codes)

### Orders
- `POST /api/orders/create` - Create order
- `GET /api/orders/:adminId` - Get restaurant orders
- `GET /api/orders/user/:userId` - Get user orders
- `PATCH /api/orders/:orderId/status` - Update order status

### QR Codes
- `GET /api/qr/generate` - Generate QR code for table

### Analytics
- `GET /api/analytics/:adminId` - Get restaurant analytics

### Ratings
- `POST /api/ratings/submit` - Submit ratings
- `GET /api/ratings/order/:orderId` - Get order ratings

---

## 🎯 Key Features

1. **Multi-role System**: Admin, Staff, Kitchen, Customer
2. **QR Code Menu**: Contactless ordering via QR codes
3. **Real-time Updates**: Auto-refresh for order status
4. **Kitchen Display System**: Dedicated view for kitchen staff
5. **Staff POS**: Order management for front-of-house
6. **Order Tracking**: Customers can track order status
7. **Ratings & Reviews**: Customer feedback system
8. **Analytics Dashboard**: Revenue, orders, ratings analytics
9. **Menu Management**: Full CRUD for menu items
10. **Document Management**: Restaurant registration with document uploads

---

## 📱 User Interfaces

1. **Landing Page** - Public homepage
2. **Restaurant Registration** - Multi-step registration form
3. **Admin Dashboard** - Menu, staff, analytics, QR codes
4. **QR Menu View** - Public menu for customers (no login required)
5. **My Orders Page** - Order tracking for customers
6. **Kitchen Display** - Dark-themed KDS for kitchen staff
7. **Staff POS** - Order management for staff
8. **Customer App** - Full-featured app for logged-in customers (optional)

---

## 🔄 Data Flow Example

**Complete Order Flow:**
1. Customer scans QR → Menu loads from database
2. Customer adds items → Stored in React state
3. Customer places order → POST to `/api/orders/create`
4. Order created → Status: `PENDING_PAYMENT`
5. Customer pays → PATCH to update status: `PAID`
6. Kitchen sees order → Kitchen Display shows `PAID` orders
7. Kitchen starts cooking → Status: `IN_PROGRESS`
8. Kitchen marks ready → Status: `READY_FOR_PICKUP`
9. Staff sees ready order → Staff POS shows ready orders
10. Staff serves order → Status: `SERVED`
11. Customer sees update → My Orders page auto-refreshes

---

## 🚀 Getting Started

1. **Setup Database**: PostgreSQL with `pos` database
2. **Environment Variables**: Create `.env` with `DATABASE_URL`
3. **Install Dependencies**: `npm install`
4. **Start Backend**: `npm run server` (port 3001)
5. **Start Frontend**: `npm run dev` (port 5173)
6. **Access Application**: `http://localhost:5173`

---

## 📝 Notes

- QR menu and orders pages are **public** (no authentication required)
- All other pages require appropriate role-based authentication
- Orders are linked to tables, not necessarily to customer accounts
- Kitchen Display only shows orders that need cooking (`PAID` or `IN_PROGRESS`)
- Staff POS shows all orders for management
- Customer can track orders by table number via URL parameters

---

This system provides a complete end-to-end solution for restaurant operations, from registration to order fulfillment, with real-time updates and role-based access control.


