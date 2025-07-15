'use client'

import { useEffect, useState } from 'react'
import { useInsertEntity } from '@/lib/useSupabaseCrud'
import { supabase } from '@/lib/supabaseClient'
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function ScratchpadPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  const { insert, loading: insertLoading } = useInsertEntity('scratchpad_entries');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  const fetchEntries = async () => {
    setEntriesLoading(true)
    const { data, error } = await supabase
      .from('scratchpad_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching entries:', error.message)
    } else {
      setEntries(data)
    }
    setEntriesLoading(false)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!user) {
      showError('Not logged in.');
      return;
    }
    const { data, error } = await insert({
      user_id: user.id,
      content,
      category: category || null,
    });
    if (!error) {
      setContent('');
      setCategory('');
      fetchEntries();
    }
    // Toasts are handled by the hook
  };

  const handleDelete = async (id) => {
    const user_id = user?.id;
    if (!user_id) {
      showError('You must be logged in.');
      return;
    }
    const error = await deleteEntityWithCalendarEvent({
      table: 'scratchpad_entries',
      id: id,
      user_id: user_id,
      source: 'scratchpad',
    });
    if (error) {
      console.error('Error deleting entry:', error.message);
      showError('Failed to delete entry.');
    } else {
      fetchEntries();
      showSuccess('Entry deleted successfully!');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">🧠 Scratchpad</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-2 border rounded mb-2 h-24"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (optional)"
          className="w-full p-2 border rounded mb-4"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={insertLoading}
        >
          {insertLoading ? <LoadingSpinner size={20} /> : 'Save Entry'}
        </Button>
      </form>
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">📝 Your Entries</h2>
        {entriesLoading ? (
          <LoadingSpinner />
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="border p-3 rounded">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-gray-800">{entry.content}</p>
                    {entry.category && (
                      <p className="text-sm text-blue-600 mt-1 capitalize">#{entry.category}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0 md:ml-4">
                    <Link href={`/scratchpad/${entry.id}`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
                    <Link href={`/scratchpad/${entry.id}/edit`}>
                      <Button variant="primary" size="sm">Edit</Button>
                    </Link>
                    <Button
                      onClick={() => {
                        if (window.confirm('Delete this entry?')) handleDelete(entry.id);
                      }}
                      variant="link"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 