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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/85 backdrop-blur-xl border-t border-black/5 dark:border-white/10 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <span
                className={`flex items-center px-3 py-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-[#1C1C1E] dark:text-white shadow-sm gap-2'
                    : 'bg-transparent gap-0'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform transition-opacity duration-300 ${
                    isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-80'
                  }`}
                />
                <span
                  className={`text-xs font-medium overflow-hidden min-w-0 transition-[max-width,opacity,transform] duration-300 ease-out ${
                    isActive
                      ? 'max-w-[96px] opacity-100 translate-y-0'
                      : 'max-w-0 opacity-0 -translate-y-1'
                  }`}
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
