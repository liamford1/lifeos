"use client";
import dynamic from "next/dynamic";
export const CalendarIconClient = dynamic(() => import("lucide-react").then(m => m.Calendar), { ssr: false }); 