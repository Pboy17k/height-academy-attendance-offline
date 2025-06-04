
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { User, Moon, Sun } from 'lucide-react';

export function Header() {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const [currentTime, setCurrentTime] = React.useState(getCurrentTime());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/fa512d41-576b-43a9-88ba-aaa4123bc20a.png" 
            alt="Al'asr Comprehensive Academy Logo" 
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Al'asr Comprehensive Academy
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {currentTime}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {admin?.fullName}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
