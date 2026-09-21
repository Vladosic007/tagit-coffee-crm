import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Home from './pages/Home';
import Order from './pages/Order';
import Payment from './pages/Payment';
import Success from './pages/Success';
import ShiftOpen from './pages/ShiftOpen';
import ShiftClose from './pages/ShiftClose';
import CashMovement from './pages/CashMovement';
import OwnerLayout from './pages/owner/OwnerLayout';
import Report from './pages/owner/Report';
import ShiftJournal from './pages/owner/ShiftJournal';
import MenuAdmin from './pages/owner/MenuAdmin';
import Employees from './pages/owner/Employees';

function Protected({ children, ownerOnly }: { children: JSX.Element; ownerOnly?: boolean }) {
  const currentEmployeeId = useStore((s) => s.currentEmployeeId);
  const employees = useStore((s) => s.employees);
  const ready = useStore((s) => s.ready);
  const loc = useLocation();
  const emp = employees.find((e) => e.id === currentEmployeeId);
  if (!ready) return <BootSplash />;
  if (!emp) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (ownerOnly && emp.role !== 'owner') return <Navigate to="/" replace />;
  return children;
}

function BootSplash() {
  const brand = useStore((s) => s.brand);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
      <div className="text-6xl mb-3">{brand.logoEmoji}</div>
      <div className="text-lg font-bold text-ink">{brand.name}</div>
      <div className="text-sm text-muted mt-1">Загружаем…</div>
    </div>
  );
}

export default function App() {
  const bootstrap = useStore((s) => s.bootstrap);
  const ready = useStore((s) => s.ready);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);
  if (!ready) return <BootSplash />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Home />
          </Protected>
        }
      />
      <Route
        path="/order"
        element={
          <Protected>
            <Order />
          </Protected>
        }
      />
      <Route
        path="/payment"
        element={
          <Protected>
            <Payment />
          </Protected>
        }
      />
      <Route
        path="/success/:id"
        element={
          <Protected>
            <Success />
          </Protected>
        }
      />
      <Route
        path="/shift/open"
        element={
          <Protected>
            <ShiftOpen />
          </Protected>
        }
      />
      <Route
        path="/shift/close"
        element={
          <Protected>
            <ShiftClose />
          </Protected>
        }
      />
      <Route
        path="/cash-movement"
        element={
          <Protected>
            <CashMovement />
          </Protected>
        }
      />
      <Route
        path="/owner"
        element={
          <Protected ownerOnly>
            <OwnerLayout />
          </Protected>
        }
      >
        <Route index element={<Report />} />
        <Route path="shifts" element={<ShiftJournal />} />
        <Route path="menu" element={<MenuAdmin />} />
        <Route path="employees" element={<Employees />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
