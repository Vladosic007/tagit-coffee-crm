'use client';

import { useMemo, useState } from 'react';
import { Protected } from '@/components/layout/Protected';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useStore, buildCartLine } from '@/stores/useStore';
import type { Product, CartLineMod } from '@/lib/types';
import { TopBar } from '@/components/ui/TopBar';
import { ProductCard } from '@/components/ui/ProductCard';
import { CartRow } from '@/components/ui/CartRow';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { moneyPlain } from '@/lib/format';
import { cn } from '@/lib/cn';

function _InnerPage() {
  const router = useRouter();
  const categories = useStore((s) => s.categories.filter((c) => c.isActive));
  const products = useStore((s) => s.products);
  const modifierGroups = useStore((s) => s.modifierGroups);
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const incLine = useStore((s) => s.incLine);
  const decLine = useStore((s) => s.decLine);
  const setLineDiscount = useStore((s) => s.setLineDiscount);
  const removeLine = useStore((s) => s.removeLine);
  const clearCart = useStore((s) => s.clearCart);
  const cartTotal = useStore((s) => s.cartTotal);
  const cartQty = useStore((s) => s.cartQty);
  const cartSubtotal = useStore((s) => s.cartSubtotal);
  const cartDiscountAmount = useStore((s) => s.cartDiscountAmount);
  const currentShift = useStore((s) => s.currentShift());

  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? '');
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [discountEditLine, setDiscountEditLine] = useState<string | null>(null);
  const [discountText, setDiscountText] = useState('');

  const productsInCategory = useMemo(
    () => products.filter((p) => p.categoryId === activeCat && p.isActive),
    [products, activeCat]
  );

  if (!currentShift || currentShift.status !== 'open') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-cream">
        <div className="text-6xl">🕘</div>
        <div className="text-xl font-semibold">Смена не открыта</div>
        <Button onClick={() => router.push('/')}>На главный</Button>
      </div>
    );
  }

  const total = cartTotal();
  const qty = cartQty();

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <TopBar
        title="Новый заказ"
        subtitle={`В корзине: ${qty}`}
        onBack={() => router.push('/')}
        right={
          cart.length > 0 && (
            <Button
              variant="ghost"
              size="md"
              leftIcon={<Trash2 size={18} />}
              onClick={() => setConfirmClear(true)}
            >
              Очистить
            </Button>
          )
        }
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-4 p-4 lg:p-6 min-h-0">
        {/* Left: catalog */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  'px-5 h-12 rounded-full whitespace-nowrap font-semibold shrink-0 transition',
                  c.id === activeCat
                    ? 'bg-coffee text-white shadow-card'
                    : 'bg-white text-ink hover:bg-coffee-50'
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
            {productsInCategory.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => setOpenProduct(p)} />
            ))}
            {productsInCategory.length === 0 && (
              <div className="col-span-full text-muted text-center py-16">В этой категории пока пусто</div>
            )}
          </div>
        </div>

        {/* Right: cart */}
        <div className="bg-white rounded-2xl shadow-card flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <ShoppingBag size={20} className="text-coffee" />
            <div className="font-bold text-ink">Корзина</div>
            <div className="ml-auto text-sm text-muted">{qty} позиций</div>
          </div>
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
            {cart.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted text-sm text-center px-4">
                Выберите позицию из каталога слева
              </div>
            )}
            {cart.map((l) => (
              <CartRow
                key={l.lineId}
                line={l}
                onInc={() => incLine(l.lineId)}
                onDec={() => decLine(l.lineId)}
                onRemove={() => removeLine(l.lineId)}
                onDiscount={() => {
                  setDiscountEditLine(l.lineId);
                  setDiscountText(String(l.discount || ''));
                }}
              />
            ))}
          </div>
          <div className="p-4 border-t border-line bg-cream/50">
            {cartDiscountAmount() > 0 && (
              <div className="flex items-baseline justify-between mb-1 text-sm">
                <div className="text-muted">Без скидки</div>
                <div className="text-muted line-through">{moneyPlain(cartSubtotal())}</div>
              </div>
            )}
            {cartDiscountAmount() > 0 && (
              <div className="flex items-baseline justify-between mb-2 text-sm">
                <div className="text-error font-semibold">Скидка</div>
                <div className="text-error font-semibold">−{moneyPlain(cartDiscountAmount())}</div>
              </div>
            )}
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-muted">Итого</div>
              <div className="text-3xl font-extrabold text-coffee">{moneyPlain(total)}</div>
            </div>
            <Button size="xl" block disabled={cart.length === 0} onClick={() => router.push('/payment')}>
              К оплате
            </Button>
          </div>
        </div>
      </div>

      {openProduct && (
        <ProductModifierModal
          product={openProduct}
          allGroups={modifierGroups}
          onClose={() => setOpenProduct(null)}
          onAdd={(qty, mods, discount) => {
            addToCart(buildCartLine(openProduct, qty, mods, discount));
            setOpenProduct(null);
          }}
        />
      )}

      <Modal
        open={discountEditLine !== null}
        onClose={() => setDiscountEditLine(null)}
        title="Скидка на позицию"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button block variant="secondary" onClick={() => setDiscountEditLine(null)}>
              Отмена
            </Button>
            <Button
              block
              onClick={() => {
                if (discountEditLine) {
                  setLineDiscount(discountEditLine, Number(discountText || 0));
                }
                setDiscountEditLine(null);
              }}
            >
              Применить
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[0, 5, 10, 15, 20, 25, 30, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => setDiscountText(String(v))}
              className={`h-14 rounded-xl border-2 font-semibold ${
                Number(discountText || 0) === v
                  ? 'border-coffee bg-coffee-50 text-coffee'
                  : 'border-line bg-white text-ink hover:bg-coffee-50'
              }`}
            >
              {v}%
            </button>
          ))}
        </div>
        <div className="text-xs text-muted mb-2">Или введите свой процент (0–100)</div>
        <input
          value={discountText}
          onChange={(e) => setDiscountText(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="25"
          inputMode="numeric"
          className="w-full h-16 rounded-xl border border-line px-4 text-3xl font-bold text-center focus:border-coffee tabular-nums"
        />
      </Modal>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Очистить корзину?" size="sm">
        <div className="text-muted">Все позиции будут удалены. Отменить нельзя.</div>
        <div className="flex gap-3 mt-6">
          <Button block variant="secondary" onClick={() => setConfirmClear(false)}>
            Отмена
          </Button>
          <Button
            block
            variant="danger"
            onClick={() => {
              clearCart();
              setConfirmClear(false);
            }}
          >
            Очистить
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ProductModifierModal({
  product,
  allGroups,
  onClose,
  onAdd,
}: {
  product: Product;
  allGroups: ReturnType<typeof Object>[] | { id: string; name: string; type: string; required: boolean; multi: boolean; options: { id: string; name: string; priceDelta: number; isDefault?: boolean }[] }[];
  onClose: () => void;
  onAdd: (qty: number, mods: CartLineMod[], discount: number) => void;
}) {
  const groups = (allGroups as any[]).filter((g) => product.modifierGroupIds.includes(g.id));
  const initial: Record<string, string> = {};
  groups.forEach((g) => {
    const def = g.options.find((o: any) => o.isDefault) || g.options[0];
    if (def) initial[g.id] = def.id;
  });
  const [chosen, setChosen] = useState<Record<string, string>>(initial);
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [discountText, setDiscountText] = useState('');

  const mods: CartLineMod[] = groups
    .map((g) => {
      const optId = chosen[g.id];
      const opt = g.options.find((o: any) => o.id === optId);
      if (!opt) return null;
      return {
        groupId: g.id,
        groupName: g.name,
        optionId: opt.id,
        optionName: opt.name,
        priceDelta: opt.priceDelta,
      };
    })
    .filter(Boolean) as CartLineMod[];

  const unit = product.basePrice + mods.reduce((s, m) => s + m.priceDelta, 0);
  const discountedUnit = Math.round((unit * (100 - discount)) / 100);
  const total = discountedUnit * qty;
  const savings = (unit - discountedUnit) * qty;

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-coffee-50 flex items-center justify-center text-2xl">
            {product.emoji || '☕'}
          </div>
          <div>
            <div className="text-xl font-bold text-ink">{product.name}</div>
            <div className="text-sm text-muted">Базовая цена: {moneyPlain(product.basePrice)}</div>
          </div>
        </div>
      }
      size="md"
      footer={
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-line rounded-xl overflow-hidden">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-12 h-12 hover:bg-cream text-xl"
            >
              −
            </button>
            <div className="w-12 text-center font-bold text-lg">{qty}</div>
            <button onClick={() => setQty((q) => q + 1)} className="w-12 h-12 hover:bg-cream text-xl">
              +
            </button>
          </div>
          <div className="flex-1 text-right">
            <div className="text-xs text-muted">
              Итого{discount > 0 && ` (скидка ${discount}%, −${moneyPlain(savings)})`}
            </div>
            <div className="text-2xl font-extrabold text-coffee leading-tight">{moneyPlain(total)}</div>
          </div>
          <Button size="lg" onClick={() => onAdd(qty, mods, discount)}>
            Добавить в корзину
          </Button>
        </div>
      }
    >
      {groups.length === 0 && (
        <div className="text-muted text-center py-6">Модификаторы не требуются</div>
      )}
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-ink mb-2 flex items-center justify-between">
            <span>Скидка на позицию (0–100%)</span>
            <span className="text-muted font-normal text-xs">опционально</span>
          </div>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[0, 5, 10, 15, 20].map((v) => (
              <button
                key={v}
                onClick={() => { setDiscount(v); setDiscountText(v === 0 ? '' : String(v)); }}
                className={`h-12 rounded-xl font-semibold border-2 ${
                  discount === v ? 'border-coffee bg-coffee-50 text-coffee' : 'border-line bg-white text-ink'
                }`}
              >
                {v === 0 ? 'нет' : `${v}%`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={discountText}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                setDiscountText(v);
                const n = Math.min(100, Math.max(0, Number(v || 0)));
                setDiscount(n);
              }}
              placeholder="свой % (например 25)"
              className="flex-1 h-12 rounded-xl border border-line px-4 focus:border-coffee tabular-nums"
              inputMode="numeric"
            />
            <div className="text-2xl font-bold text-coffee w-14 text-center">{discount}%</div>
          </div>
        </div>
        {groups.map((g) => (
          <div key={g.id}>
            <div className="text-sm font-semibold text-ink mb-2">
              {g.name}
              {!g.required && <span className="text-muted font-normal ml-1">(опционально)</span>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {g.options.map((o: any) => {
                const active = chosen[g.id] === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setChosen({ ...chosen, [g.id]: o.id })}
                    className={cn(
                      'rounded-xl px-4 py-3 border-2 text-left transition',
                      active
                        ? 'border-coffee bg-coffee-50'
                        : 'border-line bg-white hover:border-coffee-200'
                    )}
                  >
                    <div className="font-semibold text-ink">{o.name}</div>
                    <div className="text-xs text-muted">
                      {o.priceDelta === 0 ? 'без доплаты' : `+${moneyPlain(o.priceDelta)}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function Page() {
  return (
    <Protected>
      <_InnerPage />
    </Protected>
  );
}
