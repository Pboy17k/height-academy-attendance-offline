
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  FileText, 
  Clock,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Calendar },
  { name: 'Check In/Out', href: '/attendance', icon: Clock },
  { name: 'Staff Registration', href: '/register', icon: UserPlus },
  { name: 'Staff Management', href: '/staff', icon: User },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/fa512d41-576b-43a9-88ba-aaa4123bc20a.png" 
            alt="Al'asr Comprehensive Academy Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Al'asr Comprehensive
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Academy
            </p>
          </div>
        </div>
      </div>
      
      <nav className="px-3 pb-6">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
