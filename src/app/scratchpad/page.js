'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BackButton from '@/components/BackButton'

export default function ScratchpadPage() {
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
    const { error } = await supabase
      .from('scratchpad_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting entry:', error.message)
    } else {
      fetchEntries()
    }
  }

  return (
    <main className="p-4">
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

      <button
        onClick={handleAddEntry}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Entry
      </button>

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
              <button
                onClick={() => handleDelete(entry.id)}
                className="mt-2 text-sm text-red-500 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
