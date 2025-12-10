import React from 'react';
import { User } from '../types';
import { LogOut } from 'lucide-react';

interface TopBarProps {
  user: User;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onLogout }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-indigo-500';
      case 'STAFF':
        return 'bg-blue-500';
      case 'KITCHEN':
        return 'bg-amber-500';
      case 'CUSTOMER':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Welcome Message with User Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold shadow-md`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Welcome,</span>
                  <span className="text-base font-semibold text-slate-800">{user.name}</span>
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{user.role}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

