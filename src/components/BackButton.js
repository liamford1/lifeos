'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      variant="link"
      size="sm"
      className="mb-4"
    >
      ← Back
    </Button>
  );
}
