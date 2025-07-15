'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';

export default function AddExpensePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
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
      showError('Error adding expense.');
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
    showSuccess('Expense added successfully!');
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
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">Add Expense</h1>
      <p className="text-gray-400">Record a new expense with details.</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="expense-name" className="sr-only">Name</label>
        <input id="expense-name" name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded" required />
        <label htmlFor="expense-amount" className="sr-only">Amount</label>
        <input id="expense-amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Amount" className="w-full p-2 border rounded" required />
        <label htmlFor="expense-category" className="sr-only">Category</label>
        <input id="expense-category" name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="w-full p-2 border rounded" />
        <label htmlFor="expense-store" className="sr-only">Store</label>
        <input id="expense-store" name="store" value={formData.store} onChange={handleChange} placeholder="Store" className="w-full p-2 border rounded" />
        <label htmlFor="expense-payment-method" className="sr-only">Payment Method</label>
        <input id="expense-payment-method" name="payment_method" value={formData.payment_method} onChange={handleChange} placeholder="Payment Method" className="w-full p-2 border rounded" aria-label="Payment Method" />
        <label htmlFor="expense-date" className="sr-only">Date</label>
        <input id="expense-date" name="date" type="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" required />
        <Button type="submit" variant="primary" className="w-full">
          Add Expense
        </Button>
      </form>
    </div>
  );
}
