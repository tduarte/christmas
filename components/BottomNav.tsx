'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Gift, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'Calendar', icon: Calendar },
    { href: '/gifts', label: 'Gifts', icon: Gift },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/85 backdrop-blur-xl border-t border-black/5 dark:border-white/10 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <span
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-300 ${
                  isActive ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm' : 'bg-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'opacity-80 scale-100'
                  }`}
                />
                <span
                  className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-out ${
                    isActive
                      ? 'max-w-[96px] opacity-100 translate-y-0'
                      : 'max-w-0 opacity-0 -translate-y-1'
                  } sm:max-w-[96px] sm:opacity-90 sm:translate-y-0`}
                  style={{ willChange: 'max-width, opacity, transform' }}
                >
                  {tab.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
