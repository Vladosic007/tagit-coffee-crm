'use client';

import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const bootstrap = useStore((s) => s.bootstrap);
  const ready = useStore((s) => s.ready);
  const brand = useStore((s) => s.brand);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
        <div className="text-6xl mb-3">{brand.logoEmoji}</div>
        <div className="text-lg font-bold text-ink">{brand.name}</div>
        <div className="text-sm text-muted mt-1">Загружаем…</div>
      </div>
    );
  }
  return <>{children}</>;
}
