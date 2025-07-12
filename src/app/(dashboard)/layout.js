'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AppBar from '@/components/AppBar';
import Link from 'next/link';
import { FaUtensils, FaDumbbell, FaCalculator, FaStickyNote, FaHome, FaUser } from 'react-icons/fa';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    getUser();
  }, [router]);

  if (loading) {
    return (
      <main className="p-6 text-center text-lg" style={{ backgroundColor: '#343541', color: '#e6e6e6' }}>
        <h1 className="text-2xl font-bold mb-4">📅 Your Life Planner</h1>
        <p>Loading...</p>
      </main>
    );
  }

  const navItems = [
    { href: '/', label: 'Home', icon: FaHome },
    { href: '/food', label: 'Food', icon: FaUtensils },
    { href: '/fitness', label: 'Fitness', icon: FaDumbbell },
    { href: '/finances', label: 'Finances', icon: FaCalculator },
    { href: '/scratchpad', label: 'Scratchpad', icon: FaStickyNote },
    { href: '/profile', label: 'Profile', icon: FaUser },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#343541' }}>
      <AppBar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 shadow-lg">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                      style={{ color: '#e6e6e6' }}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 