'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CardioForm from '@/components/CardioForm';
import BackButton from '@/components/BackButton';

export default function AddCardioSessionPage() {
  const router = useRouter();

  const handleAdd = async (formData) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;

    if (!user_id) {
      alert('You must be logged in.');
      return;
    }

    const { error } = await supabase.from('fitness_cardio').insert([
      {
        ...formData,
        user_id,
        calories_burned: null, // placeholder for AI estimate later
      },
    ]);

    if (error) {
      console.error(error);
      alert('Failed to save cardio session.');
      return;
    }

    router.push('/fitness/cardio');
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">➕ Add Cardio Session</h1>
      <CardioForm onSubmit={handleAdd} />
    </div>
  );
}
