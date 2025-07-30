'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/shared/BackButton';
import Button from '@/components/shared/Button';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import { useToast } from '@/components/client/Toast';
import { createCalendarEventForEntity } from '@/lib/calendarSync';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddExpensePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
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
  }, [loading, user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // React Query mutation for creating expenses
  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData) => {
      if (!user) {
        throw new Error('Not logged in');
      }

      const { data, error } = await supabase.from('expenses').insert([
        {
          ...expenseData,
          amount: parseFloat(expenseData.amount),
          user_id: user.id,
        },
      ]).select().single();

      if (error) {
        throw new Error('Error adding expense.');
      }

      // Create calendar event for the expense
      const calendarError = await createCalendarEventForEntity(CALENDAR_SOURCES.EXPENSE, {
        id: data.id,
        user_id: user.id,
        name: expenseData.name,
        amount: expenseData.amount,
        date: expenseData.date,
        notes: expenseData.notes,
      });

      if (calendarError) {
        throw new Error('Calendar event creation failed.');
      }

      return data;
    },
    onSuccess: (data) => {
      showSuccess('Expense added successfully!');
      
      // Invalidate calendar events query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
      
      // Reset form
      setFormData({
        name: '',
        amount: '',
        category: '',
        store: '',
        payment_method: '',
        date: '',
      });
    },
    onError: (error) => {
      showError(error.message);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Execute the mutation
    createExpenseMutation.mutate(formData);
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">Add Expense</h1>
      <p className="text-base">Record a new expense with details.</p>
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
        <Button 
          type="submit" 
          variant="primary" 
          className="w-full"
          disabled={createExpenseMutation.isPending}
        >
          {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
        </Button>
      </form>
    </div>
  );
}
