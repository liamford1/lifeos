'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ScratchpadPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [entries, setEntries] = useState([])
  const [message, setMessage] = useState('')

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('scratchpad_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching entries:', error.message)
    } else {
      setEntries(data)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleAddEntry = async () => {
    setMessage('')
    if (!content.trim()) return

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Not logged in.')
      return
    }

    const { error } = await supabase.from('scratchpad_entries').insert([
      {
        user_id: user.id,
        content,
        category: category || null,
      },
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setContent('')
      setCategory('')
      setMessage('Added!')
      fetchEntries()
    }
  }

  const handleDelete = async (id) => {
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    
    if (!user_id) {
      alert('You must be logged in.');
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
    } else {
      fetchEntries();
    }
  }

  return (
    <>
      <BackButton />

      <h1 className="text-2xl font-bold mb-4">🧠 Scratchpad</h1>

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
        onClick={handleAddEntry}
        variant="primary"
      >
        Save Entry
      </Button>

      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">📝 Your Entries</h2>
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="border p-3 rounded">
              <p className="text-gray-800">{entry.content}</p>
              {entry.category && (
                <p className="text-sm text-blue-600 mt-1 capitalize">#{entry.category}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {new Date(entry.created_at).toLocaleString()}
              </p>
              <Button
                onClick={() => handleDelete(entry.id)}
                variant="link"
                size="sm"
                className="mt-2 text-red-500 hover:text-red-700"
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
} 