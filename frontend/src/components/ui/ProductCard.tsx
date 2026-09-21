import type { Product } from '../../lib/types';
import { moneyPlain } from '../../lib/format';
import { cn } from '../../lib/cn';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  disabled?: boolean;
}

export function ProductCard({ product, onClick, disabled }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group text-left bg-white rounded-2xl shadow-card p-4 flex flex-col gap-3',
        'active:scale-[0.98] hover:shadow-soft transition',
        !product.isActive && 'opacity-50',
        disabled && 'pointer-events-none'
      )}
    >
      <div className="w-full h-24 rounded-xl bg-coffee-50 flex items-center justify-center text-5xl">
        {product.emoji || '☕'}
      </div>
      <div className="min-h-[3.5rem] flex flex-col gap-1">
        <div className="font-semibold text-ink leading-tight line-clamp-2">{product.name}</div>
        <div className="text-coffee font-bold text-lg">{moneyPlain(product.basePrice)}</div>
      </div>
    </button>
  );
}
