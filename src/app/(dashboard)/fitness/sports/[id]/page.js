"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from '@/context/UserContext';
import BackButton from "@/components/shared/BackButton";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import { useToast } from "@/components/client/Toast";
import { MdOutlineCalendarToday } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';

export default function SportDetailPage() {
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  const fetchSport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("fitness_sports")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error) throw error;
      setSport(data);
    } catch (err) {
      setError(err.message || "Failed to load sport entry");
      if (typeof showError === 'function') showError(err.message || "Failed to load sport entry");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (user) fetchSport();
  }, [user, fetchSport]);

  async function handleDelete() {
    if (!window.confirm("Delete this sport entry?")) return;
    const { error } = await supabase
      .from("fitness_sports")
      .delete()
      .eq("id", params.id);
    if (error) {
      showError("Failed to delete sport entry");
    } else {
      showSuccess("Sport entry deleted");
      router.push("/fitness");
    }
  }

  if (loading || userLoading) return <LoadingSpinner />;
  if (!user) return null;
  if (error) return <div className="p-4"><p className="text-red-500 text-sm">{error}</p></div>;
  if (!sport) return <div className="p-4"><p className="text-muted-foreground text-sm">Sport entry not found.</p></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">{sport.activity_type || 'Sport Session'}</h1>
      <p className="text-base">View your sport session details.</p>
      <p className="text-sm text-base mb-3">{sport.date}</p>
      {sport.performance_notes && <p className="mb-4 italic text-base">{sport.performance_notes}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border p-4 rounded bg-panel">
          <h3 className="font-semibold text-lg mb-2">📊 Session Details</h3>
          <div className="space-y-2">
            <div><strong>Activity:</strong> {sport.activity_type || 'Sport'}</div>
            <div><strong>Duration:</strong> {sport.duration_minutes ?? '-'} minutes</div>
            {sport.intensity_level && (
              <div><strong>Intensity:</strong> {sport.intensity_level}</div>
            )}
            {sport.calories_burned && (
              <div><strong>Calories:</strong> {sport.calories_burned} kcal</div>
            )}
          </div>
        </div>
        
        <div className="border p-4 rounded bg-panel">
          <h3 className="font-semibold text-lg mb-2">📍 Location & Details</h3>
          <div className="space-y-2">
            {sport.location && (
              <div><strong>Location:</strong> {sport.location}</div>
            )}
            {sport.weather && (
              <div><strong>Weather:</strong> {sport.weather}</div>
            )}
            {sport.participants && (
              <div><strong>Participants:</strong> {sport.participants}</div>
            )}
            {sport.score && (
              <div><strong>Score/Result:</strong> {sport.score}</div>
            )}
            {sport.start_time && (
              <div><strong>Started:</strong> {new Date(sport.start_time).toLocaleString()}</div>
            )}
            {sport.end_time && (
              <div><strong>Ended:</strong> {new Date(sport.end_time).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>

      {sport.injuries_or_flags && (
        <div className="border p-4 rounded bg-panel mb-6">
          <h3 className="font-semibold text-lg mb-2">⚠️ Injuries/Flags</h3>
          <p className="text-base">{sport.injuries_or_flags}</p>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <Button
          variant="primary"
          onClick={() => router.push(`/fitness/sports/${params.id}/edit`)}
          className="px-4 py-2"
        >
          ✏️ Edit Session
        </Button>
        <SharedDeleteButton
          onClick={handleDelete}
          aria-label="Delete sport entry"
          label="Delete Session"
        />
        <Button
          variant="secondary"
          onClick={() => router.push('/')}
          className="px-4 py-2"
        >
          <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
          Back to Calendar
        </Button>
      </div>
    </div>
  );
}
