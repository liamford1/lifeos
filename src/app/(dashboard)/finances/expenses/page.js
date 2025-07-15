'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';

export default function FinancesOverview() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    const fetchExpenses = async () => {
      setExpensesLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (!error) setExpenses(data);
      setExpensesLoading(false);
    };
    fetchExpenses();
  }, [user]);

  const handleDelete = async (id) => {
    if (!user) return;
    const user_id = user.id;
    const error = await deleteEntityWithCalendarEvent({
      table: 'expenses',
      id: id,
      user_id: user_id,
      source: 'expense',
    });
    if (!error) {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      showSuccess('Expense deleted successfully!');
    } else {
      console.error(error);
      showError('Error deleting expense.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">Finances Overview</h1>
      <Link href="/finances/add" className="text-blue-600 underline mb-4 inline-block">
        ➕ Add New Expense
      </Link>
      {expensesLoading ? (
        <LoadingSpinner />
      ) : expenses.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
      ) : (
        <ul className="space-y-2 mt-4">
          {expenses.map((exp) => (
            <li key={exp.id} className="border p-3 rounded">
              <div className="font-semibold">{exp.name} — ${exp.amount.toFixed(2)}</div>
              <div className="text-sm text-gray-600">{exp.category} — {exp.store} — {exp.payment_method}</div>
              <div className="text-xs text-gray-500">{exp.date}</div>
              <Button
                onClick={() => handleDelete(exp.id)}
                variant="link"
                size="sm"
                className="mt-2 text-red-600 hover:text-red-700"
              >
                🗑️ Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
