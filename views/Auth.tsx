import React, { useState } from 'react';
import { API } from '../services/api';
import { User, UserRole } from '../types';
import { Button, Card, LoadingSpinner } from '../components/ui';
import { Utensils, Lock, Mail, User as UserIcon, Shield, UserCheck, ChefHat, Coffee, ArrowRight, ArrowLeft } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name || !email || !password) throw new Error("All fields required");
        const user = await API.register(email, name, password, role);
        onLogin(user);
      } else {
        if (!email || !password) throw new Error("All fields required");
        const user = await API.login(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid credentials. Try admin@pos.com / admin123');
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    // Map quick login emails to their passwords
    const quickLoginCredentials: { [key: string]: string } = {
      'admin@pos.com': 'admin123',
      'staff@pos.com': 'staff123',
      'kitchen@pos.com': 'kitchen123',
      'customer@pos.com': 'customer123',
    };

    const quickPassword = quickLoginCredentials[quickEmail] || 'demo123';
    setEmail(quickEmail);
    setPassword(quickPassword);
    setLoading(true);
    setError('');
    try {
      const user = await API.login(quickEmail, quickPassword);
      if (user) {
        onLogin(user);
      } else {
        setError('Quick login failed. User not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 animate-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-xl shadow-2xl relative z-10 animate-scale-in border-white/20">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back to Home</span>
          </button>
        )}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-2xl shadow-lg shadow-emerald-500/30 mb-4 transform transition-transform hover:rotate-12 duration-300">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">DineFlow</h1>
          <p className="text-slate-500 mt-2">
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Full Name</label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isRegistering && (
            <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Role</label>
              <div className="relative">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                >
                  <option value={UserRole.CUSTOMER}>Customer</option>
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.KITCHEN}>Kitchen</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-rose-500 text-sm text-center bg-rose-50 py-2 rounded-lg animate-fade-in">{error}</div>}

          <Button type="submit" className="w-full py-3 text-lg shadow-emerald-500/25 shadow-xl animate-slide-up" style={{ animationDelay: '300ms' }} disabled={loading}>
            {loading ? <LoadingSpinner /> : (isRegistering ? 'Create Account' : 'Sign In')}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm animate-fade-in" style={{ animationDelay: '400ms' }}>
          <span className="text-slate-400">{isRegistering ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-all"
          >
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </div>

        {/* Quick Login Section */}
        {!isRegistering && (
          <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <p className="text-xs font-bold text-slate-400 mb-4 text-center uppercase tracking-widest">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleQuickLogin('admin@pos.com')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group text-left"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-700 text-sm">Admin</div>
                  <div className="text-[10px] text-slate-400">Dashboard</div>
                </div>
              </button>
              
              <button 
                onClick={() => handleQuickLogin('staff@pos.com')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group text-left"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                   <UserCheck className="w-5 h-5" />
                </div>
                 <div>
                  <div className="font-bold text-slate-700 text-sm">Staff</div>
                  <div className="text-[10px] text-slate-400">POS View</div>
                </div>
              </button>

              <button 
                onClick={() => handleQuickLogin('kitchen@pos.com')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 hover:shadow-md transition-all group text-left"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors">
                   <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-700 text-sm">Kitchen</div>
                  <div className="text-[10px] text-slate-400">KDS View</div>
                </div>
              </button>

              <button 
                onClick={() => handleQuickLogin('customer@pos.com')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group text-left"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                   <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-700 text-sm">Customer</div>
                  <div className="text-[10px] text-slate-400">Ordering App</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
