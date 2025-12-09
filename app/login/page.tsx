'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          pin,
          name: isRegister ? name : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] dark:bg-[var(--background)] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm text-2xl">
            🎄
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Family Christmas</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Sign in to organize events</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-all"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                PIN (4 digits)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 4) setPin(value);
                }}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none transition-all text-center text-2xl tracking-widest"
                placeholder="0000"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#34C759] hover:bg-[#2EC254] dark:bg-[#30D158] dark:hover:bg-[#2BC451] disabled:opacity-50 text-black font-semibold py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>

            <div className="mt-4 text-center">
              {isRegister ? (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-neutral-900 dark:text-white font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-neutral-900 dark:text-white font-semibold hover:underline"
                  >
                    Create one
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
