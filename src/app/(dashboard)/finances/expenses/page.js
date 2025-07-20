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
import { deleteCalendarEventForEntity } from '@/lib/calendarSync';
import SharedDeleteButton from '@/components/SharedDeleteButton';

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
  }, [loading, user, router]);

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
  }, [user, router]);

  const handleDelete = async (id) => {
    if (!user) return;
    const user_id = user.id;
    // Delete the expense
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (deleteError) {
      showError('Error deleting expense.');
      return;
    }
    // Delete the linked calendar event
    const calendarError = await deleteCalendarEventForEntity('expense', id);
    if (calendarError) {
      showError('Error deleting linked calendar event.');
      return;
    }
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    showSuccess('Expense deleted successfully!');
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">Expenses Overview</h1>
      <p className="text-base">Track and manage your expense records.</p>
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
              <div className="text-sm text-base">{exp.category} — {exp.store} — {exp.payment_method}</div>
              <div className="text-xs text-base">{exp.date}</div>
              <div className="flex gap-2 mt-2">
                <Link href={`/finances/expenses/${exp.id}`} passHref legacyBehavior>
                  <Button as="a" variant="secondary" size="sm">View</Button>
                </Link>
                <Link href={`/finances/expenses/${exp.id}/edit`} passHref legacyBehavior>
                  <Button as="a" variant="primary" size="sm">Edit</Button>
                </Link>
                <SharedDeleteButton
                  size="sm"
                  onClick={() => handleDelete(exp.id)}
                  aria-label="Delete expense entry"
                  label="Delete"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
