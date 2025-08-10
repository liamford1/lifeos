"use client";

import { useState } from "react";
import BaseModal from "@/components/shared/BaseModal";
import dynamic from "next/dynamic";
const StretchHorizontal = dynamic(
  () => import("lucide-react/dist/esm/icons/stretch-horizontal"),
  { ssr: false },
);
const Calendar = dynamic(() => import("@/components/client/CalendarClient"));

export default function StretchingMobilityModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Stretching / Mobility"
      subtitle="Yoga, rehab, cooldowns and flexibility work"
      icon={StretchHorizontal}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      maxWidth="max-w-4xl"
      data-testid="stretching-mobility-modal"
    >
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <StretchHorizontal className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">Stretching Session</h3>
          <p className="text-sm text-gray-400 mb-6">
            Track your flexibility and mobility work
          </p>
        </div>

        {/* Calendar for scheduling stretching sessions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-md font-semibold mb-3">
            Schedule Stretching Sessions
          </h4>
          <Calendar />
        </div>

        {/* TODO: Add step-by-step stretching content */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-md font-semibold mb-3">Stretching Routines</h4>
          <p className="text-sm text-gray-400">
            Step-by-step stretching content will be added here
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
