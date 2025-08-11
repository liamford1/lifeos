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
      {/* Feature: Step-by-step stretching content - planned for future release */}
      {/* GitHub Issue: #TODO-003 - Implement stretching session content */}
    </section>
  );
} 