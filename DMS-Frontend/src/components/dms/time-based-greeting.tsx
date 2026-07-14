'use client';

import React from 'react';
import { Sun, Sunrise, Sunset, Moon } from 'lucide-react';

interface TimeBasedGreetingProps {
  userName?: string;
  className?: string;
}

export function TimeBasedGreeting({ userName, className }: TimeBasedGreetingProps) {
  const [greeting, setGreeting] = React.useState('');
  const [icon, setIcon] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    const hour = new Date().getHours();
    let greetingText = '';
    let greetingIcon = null;

    if (hour < 12) {
      greetingText = 'Good Morning';
      greetingIcon = <Sunrise className="w-6 h-6 text-orange-500" />;
    } else if (hour < 16) {
      greetingText = 'Good Afternoon';
      greetingIcon = <Sun className="w-6 h-6 text-yellow-500" />;
    } else if (hour < 20) {
      greetingText = 'Good Evening';
      greetingIcon = <Sunset className="w-6 h-6 text-orange-600" />;
    } else {
      greetingText = 'Good Evening';
      greetingIcon = <Moon className="w-6 h-6 text-indigo-500" />;
    }

    setGreeting(greetingText);
    setIcon(greetingIcon);
  }, []);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {icon}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}{userName && `, ${userName}`}!
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Welcome to Don & Sons
        </p>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
