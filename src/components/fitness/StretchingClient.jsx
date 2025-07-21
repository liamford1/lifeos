"use client";
import dynamic from "next/dynamic";
import { StretchHorizontal } from "lucide-react";
const Calendar = dynamic(() => import("@/components/client/CalendarClient"));

export default function StretchingClient() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <StretchHorizontal /> Stretching Session
      </h1>
      <Calendar />
      {/* TODO: step-by-step stretching content goes here */}
    </section>
  );
} 