'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';

export function Protected({
  children,
  ownerOnly,
}: {
  children: React.ReactNode;
  ownerOnly?: boolean;
}) {
  const router = useRouter();
  const emp = useStore((s) => s.employees.find((e) => e.id === s.currentEmployeeId));
  const currentEmployeeId = useStore((s) => s.currentEmployeeId);
  const ready = useStore((s) => s.ready);

  useEffect(() => {
    if (!ready) return;
    if (!currentEmployeeId) router.replace('/login');
    else if (ownerOnly && emp?.role !== 'owner') router.replace('/');
  }, [ready, currentEmployeeId, emp?.role, ownerOnly, router]);

  if (!ready || !currentEmployeeId || (ownerOnly && emp?.role !== 'owner')) return null;
  return <>{children}</>;
}
