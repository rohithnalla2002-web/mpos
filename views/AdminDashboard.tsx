import React, { useState, useEffect } from 'react';
import { MenuItem, Category, AnalyticsData, TimeRange, User, UserRole, OrderStatus } from '../types';
import { MockAPI, subscribe } from '../services/mockBackend';
import { API } from '../services/api';
import { Button, Card, LoadingSpinner, FadeIn, Badge } from '../components/ui';
import { 
  Plus, Image as ImageIcon, DollarSign, Settings, LayoutDashboard, 
  BarChart3, Users, ChefHat, LogOut, TrendingUp, ShoppingBag, Star, 
  Calendar, Menu as MenuIcon, Search, Mail, UserPlus, ArrowUpRight,
  Activity, Clock, Award, Bell, MoreVertical, Edit2, Trash2, Eye,
  Zap, Target, PieChart, ArrowDownRight, Filter, Download, RefreshCw,
  QrCode, Download as DownloadIcon
} from 'lucide-react';

// --- Revenue Line Chart Component ---
const RevenueLineChart = ({ data, maxVal }: { data: { label: string; value: number }[], maxVal: number }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartHeight = 280;
  const chartWidth = 800;
  const padding = { top: 30, right: 40, bottom: 50, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate points for the line
  const points = data.map((point, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * innerWidth;
    const y = padding.top + innerHeight - (point.value / maxVal) * innerHeight;
    return { x, y, ...point };
  });

  // Create smooth path using cubic bezier curves
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      if (i === 0) {
        // First segment: use next point as control
        const cp1x = current.x + (next.x - current.x) / 3;
        const cp1y = current.y;
        const cp2x = current.x + (next.x - current.x) * 2 / 3;
        const cp2y = next.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
      } else if (i === points.length - 2) {
        // Last segment
        const prev = points[i - 1];
        const cp1x = current.x + (next.x - current.x) / 3;
        const cp1y = current.y + (next.y - current.y) / 3;
        const cp2x = current.x + (next.x - current.x) * 2 / 3;
        const cp2y = next.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
      } else {
        // Middle segments: smooth curves
        const prev = points[i - 1];
        const next2 = points[i + 1];
        const cp1x = current.x + (next.x - prev.x) / 6;
        const cp1y = current.y + (next.y - prev.y) / 6;
        const cp2x = next.x - (next2.x - current.x) / 6;
        const cp2y = next.y - (next2.y - current.y) / 6;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
      }
    }
    
    return path;
  };

  // Create area path (line + bottom closure)
  const linePath = createSmoothPath(points);
  const areaPath = linePath + 
    ` L ${points[points.length - 1].x} ${chartHeight - padding.bottom}` +
    ` L ${points[0].x} ${chartHeight - padding.bottom} Z`;

  // Y-axis labels
  const yAxisSteps = 5;
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    const value = (maxVal / yAxisSteps) * (yAxisSteps - i);
    const y = padding.top + (i / yAxisSteps) * innerHeight;
    return { value, y };
  });

  return (
    <div className="relative w-full">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full h-72"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {yAxisLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={label.y}
              x2={chartWidth - padding.right}
              y2={label.y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          </g>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === i ? 7 : 5}
              fill={hoveredIndex === i ? "#10b981" : "#ffffff"}
              stroke={hoveredIndex === i ? "#10b981" : "#10b981"}
              strokeWidth={hoveredIndex === i ? 3 : 2}
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              style={{ transition: 'all 0.2s ease' }}
            />
            
            {/* Hover tooltip */}
            {hoveredIndex === i && (
              <g>
                <rect
                  x={point.x - 45}
                  y={point.y - 50}
                  width="90"
                  height="32"
                  rx="8"
                  fill="#1e293b"
                  opacity="0.95"
                />
                <text
                  x={point.x}
                  y={point.y - 28}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                >
                  ${point.value.toLocaleString()}
                </text>
                <polygon
                  points={`${point.x - 8},${point.y - 18} ${point.x + 8},${point.y - 18} ${point.x},${point.y - 12}`}
                  fill="#1e293b"
                  opacity="0.95"
                />
              </g>
            )}
          </g>
        ))}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, i) => (
          <text
            key={i}
            x={padding.left - 12}
            y={label.y + 4}
            textAnchor="end"
            fill="#64748b"
            fontSize="11"
            fontWeight="600"
          >
            ${(label.value / 1000).toFixed(label.value >= 1000 ? 0 : 1)}k
          </text>
        ))}

        {/* X-axis labels */}
        {points.map((point, i) => (
          <text
            key={i}
            x={point.x}
            y={chartHeight - padding.bottom + 22}
            textAnchor="middle"
            fill={hoveredIndex === i ? "#10b981" : "#64748b"}
            fontSize="11"
            fontWeight={hoveredIndex === i ? "700" : "600"}
            className="transition-all"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// --- Sub-Component: Sidebar ---
const Sidebar = ({ activePage, setPage, onLogout, restaurantName, userName }: { activePage: string, setPage: (p: string) => void, onLogout: () => void, restaurantName?: string, userName?: string }) => {
  const links = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, color: 'emerald' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'blue' },
    { id: 'menu', label: 'Menu', icon: MenuIcon, color: 'amber' },
    { id: 'staff', label: 'Team', icon: Users, color: 'purple' },
    { id: 'qrmenu', label: 'QR Menu', icon: QrCode, color: 'indigo' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, color: 'rose' },
  ];

  return (
    <div className="w-80 bg-white border-r border-slate-200/60 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-sm backdrop-blur-xl">
      {/* Logo Section */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 rounded-2xl shadow-lg">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {restaurantName || 'Restaurant Name'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {userName || 'Admin'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
        {links.map(link => {
          const isActive = activePage === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setPage(link.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-r-full"></div>
              )}
              <link.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
              <span className={`font-semibold text-sm ${isActive ? 'text-emerald-700' : 'text-slate-700'}`}>{link.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-200 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

// --- Sub-View: Overview & Analytics ---
const AnalyticsView = ({ restaurantName }: { restaurantName?: string }) => {
  const [range, setRange] = useState<TimeRange>('Week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    MockAPI.getAnalytics(range).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [range]);

  const maxVal = data ? Math.max(...data.revenueTrend.map(d => d.value)) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Business Overview</h1>
          {restaurantName ? (
            <p className="text-sm text-slate-600">Monitor <span className="font-semibold text-emerald-600">{restaurantName}</span>'s key performance metrics</p>
          ) : (
            <p className="text-sm text-slate-600">Monitor your restaurant's key performance metrics</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            {['Today', 'Week', 'Month', 'Year'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as TimeRange)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  range === r 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="h-96 flex items-center justify-center">
          <LoadingSpinner size="lg" color="emerald" />
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md shadow-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-md">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">+12.5%</span>
                </div>
              </div>
              <div className="mb-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900">${data.totalRevenue.toLocaleString()}</h3>
              </div>
              <p className="text-xs text-slate-500">Compared to last {range.toLowerCase()}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md shadow-blue-500/20">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 rounded-md">
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">+5.2%</span>
                </div>
              </div>
              <div className="mb-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Orders</p>
                <h3 className="text-2xl font-bold text-slate-900">{data.totalOrders.toLocaleString()}</h3>
              </div>
              <p className="text-xs text-slate-500">Orders processed</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md shadow-amber-500/20">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-md">
                  <Award className="w-3 h-3 text-amber-600" />
                </div>
              </div>
              <div className="mb-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Average Rating</p>
                <h3 className="text-2xl font-bold text-slate-900">{data.averageRating.toFixed(1)}</h3>
              </div>
              <p className="text-xs text-slate-500">Customer satisfaction</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-0.5">Revenue Trend</h3>
                <p className="text-xs text-slate-500">Performance over selected period</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">Live Data</span>
              </div>
            </div>
            <RevenueLineChart data={data.revenueTrend} maxVal={maxVal} />
          </div>
        </>
      )}
    </div>
  );
};

// --- Sub-View: Menu Management ---
const MenuManagementView = ({ adminId }: { adminId: string }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>(Category.MAINS);
  const [image, setImage] = useState('');

  const fetchMenu = async () => {
    try {
      const menuItems = await API.getMenuItems(adminId);
      setItems(menuItems);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [adminId]);

  const resetForm = () => {
    setName('');
    setDesc('');
    setPrice('');
    setCategory(Category.MAINS);
    setImage('');
    setEditingItem(null);
    setIsAdding(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDesc(item.description);
    setPrice(item.price.toString());
    setCategory(item.category);
    setImage(item.image);
    setIsAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const imgUrl = image || `https://loremflickr.com/400/300/food,dish?random=${Date.now()}`;
    try {
      if (editingItem) {
        // Update existing item
        await API.updateMenuItem(editingItem.id, {
          name,
          description: desc,
          price: parseFloat(price),
          category,
          image: imgUrl,
          isVegetarian: false,
          isSpicy: false,
          isOutOfStock: editingItem.isOutOfStock || false
        }, adminId);
      } else {
        // Add new item
        await API.addMenuItem({
          name,
          description: desc,
          price: parseFloat(price),
          category,
          image: imgUrl,
          isVegetarian: false,
          isSpicy: false
        }, adminId);
      }
      await fetchMenu();
      resetForm();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      alert(error.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    try {
      await API.deleteMenuItem(itemId, adminId);
      await fetchMenu();
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      alert(error.message || 'Failed to delete menu item');
    }
  };

  const handleToggleStock = async (item: MenuItem) => {
    try {
      await API.toggleMenuItemStock(item.id, !item.isOutOfStock, adminId);
      await fetchMenu();
    } catch (error: any) {
      console.error('Error updating stock status:', error);
      alert(error.message || 'Failed to update stock status');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Menu Management</h1>
          <p className="text-sm text-slate-600">Manage your restaurant's menu items</p>
        </div>
        <Button 
          onClick={() => {
            if (isAdding) {
              resetForm();
            } else {
              setIsAdding(true);
            }
          }} 
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAdding ? 'Cancel' : 'Add Item'}
        </Button>
      </div>

       {/* Add Item Form */}
       {isAdding && (
          <div className="animate-slide-up">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
              </div>
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name</label>
                  <input 
                    required value={name} onChange={e => setName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-900" 
                    placeholder="e.g. Lobster Thermidor"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea 
                    required value={desc} onChange={e => setDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3.5 h-28 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-slate-900" 
                    placeholder="Ingredients and details..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-12 p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-900" 
                      placeholder="25.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <select 
                    value={category} onChange={e => setCategory(e.target.value as Category)}
                    className="w-full border border-slate-300 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-900"
                  >
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Image URL (Optional)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      value={image} onChange={e => setImage(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-12 p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-900" 
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex gap-3 mt-3 border-t border-slate-200 pt-4">
                  <Button type="submit" disabled={loading} className="px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white border-0 shadow-lg">
                    {loading ? <LoadingSpinner /> : editingItem ? 'Update Item' : 'Save Item'}
                  </Button>
                  {editingItem && (
                    <Button type="button" onClick={resetForm} className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 border-0">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search menu items..."
          className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-900 bg-white shadow-sm"
        />
      </div>

      {/* Display items by category */}
      {Object.keys(itemsByCategory).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No menu items found. Add your first item to get started!</p>
        </div>
      ) : (
        Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => (
          <div key={categoryName} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
              {categoryName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryItems.map((item, index) => (
                <FadeIn key={item.id} delay={index * 50}>
                  <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full flex flex-col ${
                    item.isOutOfStock ? 'border-rose-200 opacity-75' : 'border-slate-200'
                  }`}>
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {item.isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                          <span className="bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm">OUT OF STOCK</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg">
                        {item.category}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 bg-white/95 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg"
                            title="Edit item"
                          >
                            <Edit2 className="w-4 h-4 text-slate-700" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-white/95 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 leading-tight text-lg">{item.name}</h3>
                        <span className="text-emerald-600 font-bold text-lg">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                        <button
                          onClick={() => handleToggleStock(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            item.isOutOfStock
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {item.isOutOfStock ? 'Mark In Stock' : 'Mark Out of Stock'}
                        </button>
                        <span className="text-xs font-semibold text-slate-400">ID: {item.id}</span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// --- Sub-View: Staff Management ---
const StaffManagementView = ({ adminId }: { adminId: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STAFF);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStaffMembers = async () => {
    try {
      const members = await API.getStaffMembers(adminId);
      setUsers(members);
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, [adminId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Generate a default password if not provided
      const staffPassword = password || `Staff@${Date.now().toString().slice(-6)}`;
      await API.addStaffMember(name, email, staffPassword, role, adminId);
      await fetchStaffMembers(); // Refresh the list
      setIsAdding(false);
      setName('');
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Error adding staff member:', error);
      alert(error.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return { bg: 'from-indigo-500 to-purple-600', text: 'text-indigo-700', badge: 'bg-indigo-50 border-indigo-200' };
      case UserRole.KITCHEN: return { bg: 'from-amber-500 to-orange-600', text: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' };
      case UserRole.STAFF: return { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200' };
      default: return { bg: 'from-slate-500 to-slate-600', text: 'text-slate-700', badge: 'bg-slate-50 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Team Management</h1>
          <p className="text-sm text-slate-600">Manage your restaurant staff and access</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-0"
        >
           <UserPlus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {isAdding && (
         <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-slide-up">
            <h3 className="font-bold text-slate-900 mb-4 text-base">Register New Employee</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="text-sm font-semibold text-slate-700 mb-2 block">Full Name</label>
                     <input 
                       required 
                       value={name} 
                       onChange={e => setName(e.target.value)} 
                       className="w-full border border-slate-300 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900" 
                       placeholder="Jane Doe" 
                     />
                  </div>
                  <div>
                     <label className="text-sm font-semibold text-slate-700 mb-2 block">Email</label>
                     <input 
                       required 
                       type="email" 
                       value={email} 
                       onChange={e => setEmail(e.target.value)} 
                       className="w-full border border-slate-300 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900" 
                       placeholder="jane@dineflow.com" 
                     />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="text-sm font-semibold text-slate-700 mb-2 block">Role</label>
                     <select 
                       value={role} 
                       onChange={e => setRole(e.target.value as UserRole)} 
                       className="w-full border border-slate-300 rounded-xl p-3.5 text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900"
                     >
                        <option value={UserRole.STAFF}>Staff (POS)</option>
                        <option value={UserRole.KITCHEN}>Kitchen (KDS)</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-sm font-semibold text-slate-700 mb-2 block">Password (Optional)</label>
                     <input 
                       type="password"
                       value={password} 
                       onChange={e => setPassword(e.target.value)} 
                       className="w-full border border-slate-300 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900" 
                       placeholder="Auto-generated if empty"
                     />
                  </div>
               </div>
               <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white border-0 shadow-lg">
                    {loading ? <LoadingSpinner /> : 'Add Employee'}
                  </Button>
               </div>
            </form>
         </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search employees..."
          className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-900 bg-white shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                 <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Employee</th>
                 <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Role</th>
                 <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Email</th>
                 <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Status</th>
                 <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredUsers.map((user) => {
                 const colors = getRoleColor(user.role);
                 return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="p-5">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                              {user.name.charAt(0)}
                           </div>
                           <div>
                              <span className="font-bold text-slate-900 block">{user.name}</span>
                              <span className="text-xs text-slate-500">ID: {user.id}</span>
                           </div>
                        </div>
                     </td>
                     <td className="p-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${colors.badge} ${colors.text}`}>
                          {user.role}
                        </span>
                     </td>
                     <td className="p-5">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600 font-medium">{user.email}</span>
                        </div>
                     </td>
                     <td className="p-5">
                        <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                           <span className="text-sm font-semibold text-emerald-600">Active</span>
                        </div>
                     </td>
                     <td className="p-5">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-slate-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                     </td>
                  </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Sub-View: QR Menu Management ---
const QRMenuView = ({ adminId, restaurantName }: { adminId: string, restaurantName?: string }) => {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [numberOfTables, setNumberOfTables] = useState(20);

  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const adminDetails = await API.getAdminDetails(adminId);
        if (adminDetails.numberOfTables) {
          setNumberOfTables(adminDetails.numberOfTables);
        }
      } catch (error) {
        console.error('Failed to fetch admin details:', error);
      }
    };
    fetchAdminDetails();
  }, [adminId]);

  const handleGenerateQR = async () => {
    if (!selectedTable) {
      alert('Please select a table number');
      return;
    }

    setLoading(true);
    try {
      // Use the same API base URL logic as services/api.ts
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
      const url = `${API_BASE_URL}/qr/generate?adminId=${adminId}&tableId=${selectedTable}`;
      console.log('🔵 Generating QR code at:', url);
      console.log('🔵 API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(url);
      
      console.log('🔵 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate QR code');
        } else {
          const errorText = await response.text();
          console.error('❌ QR generation failed - non-JSON response:', errorText.substring(0, 200));
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Expected JSON but got:', contentType, text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Check if backend is running correctly.');
      }
      
      const data = await response.json();
      setQrCode(data.qrCode);
      setQrUrl(data.url);
    } catch (error: any) {
      console.error('❌ Error generating QR code:', error);
      console.error('❌ API_BASE_URL was:', API_BASE_URL);
      console.error('❌ VITE_API_URL env:', import.meta.env.VITE_API_URL);
      alert(`Failed to generate QR code: ${error.message || 'Please check your backend connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR-Table-${selectedTable}-${restaurantName || 'Menu'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate table options (1 to numberOfTables)
  const tableOptions = Array.from({ length: numberOfTables }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">QR Menu Generator</h1>
          <p className="text-sm text-slate-600">Generate QR codes for your restaurant tables</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Select Table Number</label>
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-xl">
              {tableOptions.map((tableNum) => (
                <button
                  key={tableNum}
                  onClick={() => setSelectedTable(tableNum)}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    selectedTable === tableNum
                      ? 'bg-emerald-600 text-white shadow-lg scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tableNum}
                </button>
              ))}
            </div>
            {selectedTable && (
              <p className="mt-3 text-sm text-slate-600">
                Selected: <span className="font-bold text-emerald-600">Table {selectedTable}</span>
              </p>
            )}
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center">
            {qrCode ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-lg">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700">
                    {restaurantName || 'Restaurant'} - Table {selectedTable}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleDownloadQR}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
                    >
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      Download QR
                    </Button>
                    <Button
                      onClick={() => {
                        setQrCode('');
                        setQrUrl('');
                        setSelectedTable('');
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700"
                    >
                      Clear
                    </Button>
                  </div>
                  {qrUrl && (
                    <p className="text-xs text-slate-500 mt-2 break-all">
                      URL: {qrUrl}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <QrCode className="w-24 h-24 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Select a table and generate QR code</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleGenerateQR}
            disabled={!selectedTable || loading}
            className="px-8 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-lg"
          >
            {loading ? <LoadingSpinner /> : 'Generate QR Code'}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">How to Use QR Menu</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Select a table number from the grid above</li>
          <li>Click "Generate QR Code" to create a QR code for that table</li>
          <li>Download and print the QR code</li>
          <li>Place the QR code on the table</li>
          <li>Customers can scan the QR code to view your menu and place orders</li>
          <li>Orders will appear in your KDS, Staff POS, and Admin Dashboard</li>
        </ol>
      </div>
    </div>
  );
};

// --- Sub-View: Orders Management ---
const OrdersView = ({ adminId }: { adminId: string }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await API.getOrders(adminId);
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [adminId]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await API.updateOrderStatus(orderId, newStatus, adminId);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'READY_FOR_PICKUP': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SERVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Orders</h1>
          <p className="text-sm text-slate-600">Manage and track all restaurant orders</p>
        </div>
        <Button onClick={fetchOrders} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'PENDING_PAYMENT', 'PAID', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'SERVED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {status === 'all' ? 'All Orders' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="emerald" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-slate-900">Order #{order.id}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-slate-500">Table</p>
                      <p className="font-semibold text-slate-900">#{order.tableId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total</p>
                      <p className="font-semibold text-emerald-600">${order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Customer</p>
                      <p className="font-semibold text-slate-900">{order.customerName || 'Guest'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Date</p>
                      <p className="font-semibold text-slate-900">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Items:</p>
                    <div className="space-y-2">
                      {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex justify-between text-sm text-slate-600">
                            <span>{item.quantity || 1}x {item.name}</span>
                            <span className="font-semibold">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                          </div>
                          {item.notes && (
                            <div className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
                              <span className="font-semibold">Note:</span> {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {order.status === 'PAID' && (
                    <Button
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.IN_PROGRESS)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Start Cooking
                    </Button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'READY_FOR_PICKUP' && (
                    <Button
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.SERVED)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Mark Served
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Layout Component ---
export const AdminDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [activePage, setActivePage] = useState('overview');
  const [restaurantName, setRestaurantName] = useState<string | undefined>(user.restaurantName);

  // Fetch restaurant name on mount and whenever user changes
  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      console.log('AdminDashboard - Current user:', user);
      console.log('AdminDashboard - Current restaurantName state:', restaurantName);
      console.log('AdminDashboard - User restaurantName prop:', user.restaurantName);
      
      if (user.role === UserRole.ADMIN) {
        // Always try to fetch latest restaurant info
        // This ensures we get updates if restaurant was registered after login
        try {
          console.log('Fetching admin details for user ID:', user.id);
          const adminDetails = await API.getAdminDetails(user.id);
          console.log('Admin details received:', adminDetails);
          
          // Update restaurant name if we got one (even if it's different from current)
          if (adminDetails.restaurantName) {
            console.log('Setting restaurant name to:', adminDetails.restaurantName);
            setRestaurantName(adminDetails.restaurantName);
            // Update localStorage with the updated user data
            const updatedUser = { ...user, restaurantName: adminDetails.restaurantName };
            localStorage.setItem('pos_user', JSON.stringify(updatedUser));
            console.log('Restaurant name updated in state and localStorage');
          } else if (adminDetails.restaurantName === null) {
            console.log('Restaurant name is null in database - admin has not registered a restaurant yet');
            // Keep current state (might be undefined or null)
          }
        } catch (error) {
          console.error('Failed to fetch restaurant info:', error);
          // If fetch fails, at least try to use what we have from props
          if (user.restaurantName && !restaurantName) {
            setRestaurantName(user.restaurantName);
          }
        }
      }
    };

    fetchRestaurantInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex font-sans">
       {/* Sidebar */}
       <Sidebar activePage={activePage} setPage={setActivePage} onLogout={onLogout} restaurantName={restaurantName} userName={user.name} />

       {/* Main Content Area */}
       <div className="flex-1 ml-80 p-6 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto">
             {activePage === 'overview' && <AnalyticsView restaurantName={restaurantName} />}
             {activePage === 'analytics' && <AnalyticsView restaurantName={restaurantName} />}
             {activePage === 'menu' && <MenuManagementView adminId={user.id} />}
             {activePage === 'staff' && <StaffManagementView adminId={user.id} />}
             {activePage === 'qrmenu' && <QRMenuView adminId={user.id} restaurantName={restaurantName} />}
             {activePage === 'orders' && <OrdersView adminId={user.id} />}
          </div>
       </div>
    </div>
  );
};
