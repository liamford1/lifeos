"use client";
import dynamic from "next/dynamic";
export default dynamic(() => import("react-calendar"), { ssr: false, loading: () => <div className="animate-pulse p-4">Loading…</div> }); 