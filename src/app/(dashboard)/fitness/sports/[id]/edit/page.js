"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from '@/context/UserContext';
import BackButton from "@/components/shared/BackButton";
import SportForm from "@/components/forms/SportForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import { useToast } from "@/components/client/Toast";
import SharedDeleteButton from '@/components/SharedDeleteButton';

export default function EditSportPage() {
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  async function handleUpdateSport(sportData) {
    setSaving(true);
    setError("");
    const { error } = await supabase
      .from("fitness_sports")
      .update(sportData)
      .eq("id", params.id);
    if (error) {
      setError("Failed to update sport entry");
      showError("Failed to update sport entry");
      setSaving(false);
      return;
    }
    showSuccess("Sport entry updated!");
    router.push(`/fitness/sports/${params.id}`);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this sport entry?")) return;
    const { error } = await supabase
      .from("fitness_sports")
      .delete()
      .eq("id", params.id);
    if (error) {
      showError("Failed to delete sport entry");
      return;
    }
    showSuccess("Sport entry deleted");
    router.push("/fitness/sports");
  }

  if (loading || userLoading) return <LoadingSpinner />;
  if (!user) return null;
  if (error) return <div className="p-4"><p className="text-red-500 text-sm">{error}</p></div>;
  if (!sport) return <div className="p-4"><p className="text-muted-foreground text-sm">Sport entry not found.</p></div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Edit Sport Entry</h1>
      <SportForm initialData={sport} onSubmit={handleUpdateSport} loading={saving} />
      <div className="mt-4">
        <SharedDeleteButton
          onClick={handleDelete}
          aria-label="Delete sport entry"
          label="Delete Sport Entry"
        />
      </div>
    </div>
  );
} 