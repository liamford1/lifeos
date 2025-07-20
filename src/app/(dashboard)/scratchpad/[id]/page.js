"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function ScratchpadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      if (!id) {
        setError("Missing note ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("scratchpad_entries")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load note");
      } else {
        setNote(data);
      }
      setLoading(false);
    }
    fetchNote();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this note?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("scratchpad_entries")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete note");
    } else {
      showSuccess("Note deleted");
      router.push("/scratchpad");
    }
    setDeleting(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Note Details</h1>
      {note && (
        <div className="mb-4">
          <div><strong>Title:</strong> {note.title}</div>
          <div><strong>Content:</strong> {note.content}</div>
          <div><strong>Created:</strong> {note.created_at}</div>
        </div>
      )}
      <Link href={`/scratchpad/${id}/edit`} className="mr-2">
        <Button variant="primary">Edit</Button>
      </Link>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        aria-label="Delete entry"
        loading={deleting}
      >
        🗑️ Delete
      </Button>
    </div>
  );
} 