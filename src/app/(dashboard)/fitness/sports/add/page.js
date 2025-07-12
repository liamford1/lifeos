'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import SportForm from '@/components/SportForm';

export default function AddSportSession() {
  const router = useRouter();

  const handleAdd = async (formData) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('fitness_sports').insert([
      {
        ...formData,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert('Failed to add session.');
    } else {
      router.push('/fitness/sports');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">➕ Add Sport Session</h1>
      <SportForm onSubmit={handleAdd} />
    </div>
  );
}
