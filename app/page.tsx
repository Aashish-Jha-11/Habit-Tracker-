"use client";

import dynamic from 'next/dynamic';
import '../app/globals.css';
const HabitTracker = dynamic(
  () => import('../aashishjha-personal-analytics-habit-tracker'), 
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen">
      <HabitTracker />
    </main>
  );
}
