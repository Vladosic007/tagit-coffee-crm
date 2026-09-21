import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Delete } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NumericPad } from '../components/ui/NumericPad';
import { cn } from '../lib/cn';

const PIN_LEN = 4;

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const brand = useStore((s) => s.brand);
  const loginPin = useStore((s) => s.loginPin);

  async function push(d: string) {
    if (pin.length >= PIN_LEN || busy) return;
    setError(false);
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LEN) {
      setBusy(true);
      // small delay so user sees 4 dots filled
      await new Promise((r) => setTimeout(r, 150));
      const emp = await loginPin(next);
      setBusy(false);
      if (emp) {
        nav(emp.role === 'owner' ? '/owner' : '/', { replace: true });
      } else {
        setError(true);
        setPin('');
      }
    }
  }

  function back() {
    if (busy) return;
    setError(false);
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex flex-col items-center justify-center bg-coffee-50">
        <div className="text-9xl">{brand.logoEmoji}</div>
        <div className="mt-6 text-3xl font-extrabold text-ink tracking-wide">{brand.name}</div>
        <div className="mt-2 text-muted">Касса баристы</div>
      </div>
      <div className="flex flex-col items-center justify-center px-8 py-10 bg-cream">
        <div className="md:hidden mb-4 text-6xl">{brand.logoEmoji}</div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-wide">
          {brand.name.toUpperCase()}
        </h1>
        <div className="mt-2 text-muted">Введите PIN-код</div>

        <div className="mt-8 flex items-center gap-4">
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'w-4 h-4 rounded-full border-2 transition',
                i < pin.length
                  ? error
                    ? 'bg-error border-error'
                    : 'bg-coffee border-coffee'
                  : 'bg-white/40 border-coffee/30'
              )}
            />
          ))}
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 bg-error/10 text-error px-4 py-2.5 rounded-xl">
            <AlertCircle size={18} />
            <span className="font-medium text-sm">Неверный PIN. Попробуйте ещё раз</span>
          </div>
        )}

        <div className="mt-10 w-[320px] max-w-full">
          <NumericPad onDigit={push} onBackspace={back} />
        </div>

        <div className="mt-8 text-xs text-muted text-center leading-relaxed">
          <div>Демо-PIN'ы:</div>
          <div>Владелец — 1234, Бариста Аня — 5678, Максим — 2222</div>
        </div>

        <button
          onClick={back}
          className="hidden"
          aria-hidden
        >
          <Delete />
        </button>
      </div>
    </div>
  );
}
