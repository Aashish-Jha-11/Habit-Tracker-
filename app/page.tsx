"use client";

import dynamic from 'next/dynamic';
import '../app/globals.css';

// Dynamic import with no SSR to avoid hydration issues with components 
// that interact with the document object
const HabitTracker = dynamic(
  () => import('../habit-tracker'), 
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen">
      <HabitTracker />
    </main>
  );
}