
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
        <Clock className="h-5 w-5" />
        <span className="text-sm">{formatDate(time)}</span>
      </div>
      <div className="text-4xl md:text-6xl font-mono font-bold text-gray-900 dark:text-white">
        {formatTime(time)}
      </div>
    </div>
  );
}
