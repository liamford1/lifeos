import React from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/client/SupabaseProvider";
import { UserProvider } from '@/context/UserContext';
import { ToastContainer, ToastProvider } from '@/components/client/Toast';
import { WorkoutSessionProvider } from '@/context/WorkoutSessionContext';
import { CardioSessionProvider } from '@/context/CardioSessionContext';
import { SportsSessionProvider } from '@/context/SportsSessionContext';
import { StretchingSessionProvider } from '@/context/StretchingSessionContext';
import { CookingSessionProvider } from '@/context/CookingSessionContext';
import { supabase } from '@/lib/supabaseClient';
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import QueryProvider from '@/components/QueryProvider';

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
        <QueryProvider>
          <SupabaseProvider>
            <UserProvider>
              <ToastProvider>
                <WorkoutSessionProvider>
                  <CardioSessionProvider>
                    <SportsSessionProvider>
                      <StretchingSessionProvider>
                        <CookingSessionProvider>
                        <ErrorBoundary>
                          <ToastContainer />
                          {children}
                        </ErrorBoundary>
                      </CookingSessionProvider>
                    </StretchingSessionProvider>
                  </SportsSessionProvider>
                </CardioSessionProvider>
              </WorkoutSessionProvider>
              </ToastProvider>
            </UserProvider>
          </SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
