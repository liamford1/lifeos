'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';

export default function AddExpensePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    store: '',
    payment_method: '',
    date: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const user_id = user.id;
    const { data, error } = await supabase.from('expenses').insert([
      {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id,
      },
    ]).select().single();
    if (error) {
      console.error(error);
      alert('Error adding expense.');
      return;
    }
    // Create calendar event for the expense
    const startTime = new Date(formData.date);
    const { error: calendarError } = await supabase.from('calendar_events').insert({
      user_id: user_id,
      title: `Expense: ${formData.name} - $${formData.amount}`,
      source: CALENDAR_SOURCES.EXPENSE,
      source_id: data.id,
      start_time: startTime.toISOString(),
      end_time: null,
    });
    if (calendarError) {
      console.error('Calendar event creation failed:', calendarError);
    }
    alert('Expense added!');
    setFormData({
      name: '',
      amount: '',
      category: '',
      store: '',
      payment_method: '',
      date: '',
    });
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">Add Expense</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" required />
        <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Amount" className="w-full p-2 border rounded" required />
        <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="w-full p-2 border rounded" />
        <input name="store" value={formData.store} onChange={handleChange} placeholder="Store" className="w-full p-2 border rounded" />
        <input name="payment_method" value={formData.payment_method} onChange={handleChange} placeholder="Payment Method" className="w-full p-2 border rounded" />
        <input name="date" type="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" required />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded w-full">Add Expense</button>
      </form>
    </div>
  );
}
