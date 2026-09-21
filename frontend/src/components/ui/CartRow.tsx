import { Minus, Plus, Trash2, Tag } from 'lucide-react';
import type { CartLine } from '../../lib/types';
import { moneyPlain } from '../../lib/format';

interface CartRowProps {
  line: CartLine;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  onDiscount: () => void;
}

export function CartRow({ line, onInc, onDec, onRemove, onDiscount }: CartRowProps) {
  return (
    <div className="bg-white rounded-xl p-3 flex flex-col gap-2 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink leading-tight">{line.productName}</div>
          {line.mods.length > 0 && (
            <div className="text-xs text-muted mt-0.5 leading-snug">
              {line.mods.map((m) => m.optionName).join(' · ')}
            </div>
          )}
          {line.discount > 0 && (
            <div className="text-xs text-error mt-0.5 leading-snug font-semibold">
              скидка {line.discount}% (−{moneyPlain((line.unitPrice - line.discountedUnit) * line.qty)})
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-muted hover:text-error p-1 -mt-1 -mr-1 shrink-0"
          aria-label="Удалить"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onDec}
            className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center hover:bg-coffee-50"
          >
            <Minus size={16} />
          </button>
          <div className="w-8 text-center font-semibold">{line.qty}</div>
          <button
            onClick={onInc}
            className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center hover:bg-coffee-50"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onDiscount}
            className={`h-9 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold ${
              line.discount > 0
                ? 'bg-error/10 text-error'
                : 'bg-cream text-muted hover:bg-coffee-50'
            }`}
            aria-label="Скидка"
          >
            <Tag size={13} />
            {line.discount > 0 ? `${line.discount}%` : 'скидка'}
          </button>
        </div>
        <div className="text-right leading-tight">
          {line.discount > 0 && (
            <div className="text-xs text-muted line-through">{moneyPlain(line.unitPrice * line.qty)}</div>
          )}
          <div className="font-bold text-coffee">{moneyPlain(line.lineTotal)}</div>
        </div>
      </div>
    </div>
  );
}
