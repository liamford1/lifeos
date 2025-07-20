'use client';

import { useRouter } from 'next/navigation';
import Button from './Button';

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      onClick={() => router.back()}
      variant="ghost"
      size="sm"
      className="mb-4"
    >
      <span aria-hidden="true" className="mr-1">&#8592;</span> Back
    </Button>
  );
}
