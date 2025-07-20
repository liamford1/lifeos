import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/SupabaseProvider";
import { UserProvider } from '@/context/UserContext';
import { ToastContainer } from '@/components/Toast';
import { WorkoutSessionProvider } from '@/context/WorkoutSessionContext';
import { CookingSessionProvider } from '@/context/CookingSessionContext';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Planner App",
  description: "AI-powered life assistant",
};

export default function RootLayout({ children }) {
  return (
    <UserProvider>
      <WorkoutSessionProvider>
        <CookingSessionProvider>
          <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
              <SupabaseProvider>
                {children}
                <ToastContainer />
              </SupabaseProvider>
            </body>
          </html>
        </CookingSessionProvider>
      </WorkoutSessionProvider>
    </UserProvider>
  );
}
