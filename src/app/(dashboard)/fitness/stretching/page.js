"use client";
import dynamic from "next/dynamic";
const Move3D = dynamic(() => import("lucide-react").then(m => m.Move3D), { ssr: false });

      <h1 className="text-2xl font-bold flex items-center">
        <Move3D className="w-5 h-5 text-base mr-2 inline-block" />
        Stretching / Mobility
      </h1>
