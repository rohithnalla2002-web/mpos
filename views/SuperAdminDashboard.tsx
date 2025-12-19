import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { API } from '../services/api';
import { Button, Card, LoadingSpinner, Badge } from '../components/ui';
import {
  LayoutDashboard, Users, Building2, CreditCard, LogOut, Menu as MenuIcon,
  TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight,
  Search, Mail, Calendar, IndianRupee, CheckCircle2, XCircle, Clock,
  X, Eye, Edit2, Trash2, Filter, Download, RefreshCw
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  numberOfTables: number;
  createdAt: string;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'expired';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

interface Subscription {
  id: string;
  restaurantId: string;
  restaurantName: string;
  adminId: string;
  adminEmail: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  amount: number;
  createdAt: string;
}

interface DashboardStats {
  totalRestaurants: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  restaurantsChange: number;
  usersChange: number;
  subscriptionsChange: number;
  revenueChange: number;
}

// Sidebar Component
const Sidebar = ({ activePage, setPage, onLogout, isOpen, setIsOpen }: {
  activePage: string;
  setPage: (p: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'emerald' },
    { id: 'restaurants', label: 'Restaurants', icon: Building2, color: 'blue' },
    { id: 'users', label: 'Users', icon: Users, color: 'purple' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'violet' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className={`w-80 bg-white border-r border-slate-200/60 flex flex-col h-screen fixed left-0 top-0 z-40 shadow-sm backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo Section */}
        <div className="p-4 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-indigo-500 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-lg">
                <Activity className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                Super Admin
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                System Management
              </p>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 sm:p-6 space-y-1 overflow-y-auto">
          {links.map(link => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setPage(link.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all duration-200 group relative touch-manipulation ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"></div>
                )}
                <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                <span className={`font-semibold text-sm ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>{link.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 sm:p-6 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-200 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 touch-manipulation active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

// Dashboard Overview
const DashboardView = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await API.getSuperAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set default values on error
        setStats({
          totalRestaurants: 0,
          totalUsers: 0,
          activeSubscriptions: 0,
          totalRevenue: 0,
          restaurantsChange: 0,
          usersChange: 0,
          subscriptionsChange: 0,
          revenueChange: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" color="indigo" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-600">System-wide analytics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              stats.restaurantsChange >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
            }`}>
              {stats.restaurantsChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600" />
              )}
              <span className={`text-xs font-bold ${
                stats.restaurantsChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {stats.restaurantsChange >= 0 ? '+' : ''}{stats.restaurantsChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Restaurants</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalRestaurants}</h3>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md shadow-purple-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              stats.usersChange >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
            }`}>
              {stats.usersChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600" />
              )}
              <span className={`text-xs font-bold ${
                stats.usersChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {stats.usersChange >= 0 ? '+' : ''}{stats.usersChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Users</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalUsers}</h3>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg shadow-md shadow-violet-500/20">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              stats.subscriptionsChange >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
            }`}>
              {stats.subscriptionsChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600" />
              )}
              <span className={`text-xs font-bold ${
                stats.subscriptionsChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {stats.subscriptionsChange >= 0 ? '+' : ''}{stats.subscriptionsChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Active Subscriptions</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.activeSubscriptions}</h3>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md shadow-emerald-500/20">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              stats.revenueChange >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
            }`}>
              {stats.revenueChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600" />
              )}
              <span className={`text-xs font-bold ${
                stats.revenueChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Restaurants</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalRestaurants}</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 ml-auto group-hover:text-slate-600 transition-colors" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Users</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 ml-auto group-hover:text-slate-600 transition-colors" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-100 rounded-xl group-hover:bg-violet-200 transition-colors">
              <CreditCard className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900">{stats.activeSubscriptions}</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400 ml-auto group-hover:text-slate-600 transition-colors" />
          </div>
        </Card>
      </div>
    </div>
  );
};

// Restaurants View
const RestaurantsView = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const data = await API.getAllRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.adminEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelled': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expired': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Restaurants</h1>
          <p className="text-sm text-slate-600">Manage all registered restaurants</p>
        </div>
        <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search restaurants..."
          className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 bg-white shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="indigo" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Restaurant</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Admin</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Tables</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Status</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Created</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-slate-900">{restaurant.name}</div>
                      <div className="text-xs text-slate-500">ID: {restaurant.id}</div>
                    </td>
                    <td className="p-5">
                      <div className="font-semibold text-slate-900">{restaurant.adminName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {restaurant.adminEmail}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="font-semibold text-slate-900">{restaurant.numberOfTables}</span>
                    </td>
                    <td className="p-5">
                      <Badge className={getStatusColor(restaurant.subscriptionStatus)}>
                        {restaurant.subscriptionStatus}
                      </Badge>
                    </td>
                    <td className="p-5">
                      <div className="text-sm text-slate-600">
                        {new Date(restaurant.createdAt).toLocaleDateString()}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Users View
const UsersView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await API.getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case UserRole.STAFF: return 'bg-blue-100 text-blue-700 border-blue-200';
      case UserRole.KITCHEN: return 'bg-amber-100 text-amber-700 border-amber-200';
      case UserRole.CUSTOMER: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case UserRole.SUPER_ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Users</h1>
          <p className="text-sm text-slate-600">Manage all system users</p>
        </div>
        <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 bg-white shadow-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white font-medium text-slate-900"
        >
          <option value="all">All Roles</option>
          {Object.values(UserRole).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="indigo" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">User</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Email</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Role</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">ID: {user.id}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Subscriptions View
const SubscriptionsView = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await API.getAllSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    // Refresh every 10 seconds to get latest subscription status
    const interval = setInterval(fetchSubscriptions, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredSubscriptions = statusFilter === 'all'
    ? subscriptions
    : subscriptions.filter(s => s.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelled': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expired': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Subscriptions</h1>
          <p className="text-sm text-slate-600">Manage all restaurant subscriptions</p>
        </div>
        <Button onClick={fetchSubscriptions} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'active', 'inactive', 'cancelled', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" color="indigo" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Restaurant</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Admin</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Status</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Amount</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Start Date</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">End Date</th>
                  <th className="p-5 text-xs uppercase text-slate-600 font-bold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-slate-900">{subscription.restaurantName}</div>
                      <div className="text-xs text-slate-500">ID: {subscription.restaurantId}</div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm text-slate-600 font-medium">{subscription.adminEmail}</div>
                    </td>
                    <td className="p-5">
                      <Badge className={getStatusColor(subscription.status)}>
                        {subscription.status}
                      </Badge>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-900">₹{subscription.amount}</div>
                      <div className="text-xs text-slate-500">per month</div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm text-slate-600">{formatDate(subscription.startDate)}</div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm text-slate-600">{formatDate(subscription.endDate)}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export const SuperAdminDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setPage={setActivePage}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-80 p-4 sm:p-6 overflow-y-auto min-h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors touch-manipulation"
        >
          <MenuIcon className="w-6 h-6 text-slate-700" />
        </button>

        <div className="max-w-7xl mx-auto">
          {activePage === 'dashboard' && <DashboardView />}
          {activePage === 'restaurants' && <RestaurantsView />}
          {activePage === 'users' && <UsersView />}
          {activePage === 'subscriptions' && <SubscriptionsView />}
        </div>
      </div>
    </div>
  );
};

