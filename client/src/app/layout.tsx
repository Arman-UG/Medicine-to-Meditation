import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { AudioProvider } from "../context/AudioContext";
import { Navbar } from "../components/Navbar";
import { AudioBar } from "../components/AudioBar";

export const metadata: Metadata = {
  title: "Medicine to Meditation — Everyday Mental Pressure Relief",
  description: "Short, guided relaxation activities to help you find peace in everyday pressure. Open. Choose. Relax. Return.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-ivory-100 text-forest min-h-screen flex flex-col selection:bg-sage-200 selection:text-forest">
        <AuthProvider>
          <AudioProvider>
            <Navbar />
            <main className="flex-1 pb-28">
              {children}
            </main>
            <AudioBar />
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
