'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Gift, User } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'Calendar', icon: Calendar },
    { href: '/gifts', label: 'Gifts', icon: Gift },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/85 backdrop-blur-xl border-t border-black/5 dark:border-white/10 z-50 pb-[env(safe-area-inset-bottom)]">
      <LayoutGroup id="bottom-nav">
        <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-1 items-center justify-center h-full text-neutral-500 dark:text-neutral-400"
              >
                <motion.span
                  className="relative inline-flex items-center justify-center"
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-full bg-neutral-900 dark:bg-[#1C1C1E] shadow-sm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    className={`relative flex items-center px-3 py-1.5 gap-2 ${
                      isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                    layout
                    transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                  >
                    <motion.div
                      animate={isActive ? { scale: 1.1, opacity: 1 } : { scale: 1, opacity: 0.85 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>

                    <AnimatePresence mode="wait" initial={false}>
                      {isActive && (
                        <motion.span
                          key={tab.label}
                          className="text-xs font-medium whitespace-nowrap"
                          initial={{ opacity: 0, x: -8, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -8, scale: 0.95 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                        >
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.span>
              </Link>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
