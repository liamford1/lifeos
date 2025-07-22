import React from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/SupabaseProvider";
import { UserProvider } from '@/context/UserContext';
import { ToastContainer } from '@/components/Toast';
import { WorkoutSessionProvider } from '@/context/WorkoutSessionContext';
import { CookingSessionProvider } from '@/context/CookingSessionContext';
import ErrorBoundaryWrapper from "../components/ErrorBoundaryWrapper";
import { supabase } from '@/lib/supabaseClient';
import ReactQueryProvider from '@/components/ReactQueryProvider';

if (typeof window !== 'undefined' && !window.supabase) {
  window.supabase = supabase;
}

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Planner App",
  description: "AI-powered life assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ReactQueryProvider>
          <SupabaseProvider>
            <UserProvider>
              <WorkoutSessionProvider>
                <CookingSessionProvider>
                  <ErrorBoundaryWrapper>
                    <ToastContainer />
                    {children}
                  </ErrorBoundaryWrapper>
                </CookingSessionProvider>
              </WorkoutSessionProvider>
            </UserProvider>
          </SupabaseProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
