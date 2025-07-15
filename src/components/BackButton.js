'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-default bg-card text-base hover:border-white transition mb-4"
    >
      ← Back
    </button>
  );
}
