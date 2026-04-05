'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import LandingOverlay from '@/components/LandingOverlay';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('splashSeen');
  });

  return (
    <>
      {showSplash && (
        <LandingOverlay onEnter={() => {
          sessionStorage.setItem('splashSeen', '1');
          setShowSplash(false);
        }} />
      )}
      <div className="min-h-screen relative bg-[#050505] text-gray-200 selection:bg-purple-500/30">
        <Navigation />
        <div className={`relative z-10 pt-24 px-4 pb-12 max-w-[1000px] mx-auto transition-all duration-1000 ${showSplash ? 'blur-sm opacity-50 grayscale' : 'blur-0 opacity-100 grayscale-0'}`}>
          {children}
        </div>
      </div>
    </>
  );
}
