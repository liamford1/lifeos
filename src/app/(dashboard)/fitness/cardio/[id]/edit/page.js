'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CardioForm from '@/components/CardioForm';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditCardioPage() {
  const params = useParams();
  const [cardio, setCardio] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    const fetchCardio = async () => {
      const { data: cardioData } = await supabase
        .from('fitness_cardio')
        .select('*')
        .eq('id', params.id)
        .single();

      setCardio(cardioData);
      setLoading(false);
    };

    fetchCardio();
  }, [params.id, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  if (!cardio) return <div className="p-4"><p className="text-muted-foreground text-sm">Cardio session not found.</p></div>;

  return <CardioForm initialData={cardio} isEdit />;
} 