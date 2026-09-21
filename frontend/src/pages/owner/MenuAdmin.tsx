import { useState } from 'react';
import { Plus, Pencil, Trash2, EyeOff, Eye } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { moneyPlain } from '../../lib/format';
import type { Product } from '../../lib/types';
import { cn } from '../../lib/cn';

export default function MenuAdmin() {
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const modifierGroups = useStore((s) => s.modifierGroups);
  const createCategory = useStore((s) => s.createCategory);
  const toggleProductActive = useStore((s) => s.toggleProductActive);
  const updateProduct = useStore((s) => s.updateProduct);
  const createProduct = useStore((s) => s.createProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);

  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? '');
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const catProducts = products.filter((p) => p.categoryId === activeCat);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 border-b border-line bg-white flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold text-ink">Управление меню</div>
          <div className="text-sm text-muted">Категории, позиции, цены и модификаторы</div>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setCreating(true)}>
          Новая позиция
        </Button>
      </div>

      <div className="p-8 flex flex-col gap-6">
        <div className="flex gap-2 flex-wrap items-center">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={cn(
                'px-5 h-11 rounded-full font-semibold whitespace-nowrap',
                c.id === activeCat ? 'bg-coffee text-white' : 'bg-white text-ink hover:bg-coffee-50'
              )}
            >
              {c.name}
              <span className="ml-2 text-xs opacity-70">
                {products.filter((p) => p.categoryId === c.id).length}
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowNewCat(true)}
            className="px-4 h-11 rounded-full border border-dashed border-coffee/40 text-coffee hover:bg-coffee-50"
          >
            + Категория
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="grid grid-cols-[40px,1fr,120px,1fr,120px,180px] gap-3 px-5 py-3 text-xs uppercase tracking-wide text-muted border-b border-line font-semibold">
            <div />
            <div>Название</div>
            <div>Цена</div>
            <div>Модификаторы</div>
            <div>Статус</div>
            <div className="text-right">Действия</div>
          </div>
          {catProducts.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[40px,1fr,120px,1fr,120px,180px] gap-3 px-5 py-3 items-center border-b last:border-b-0 border-line"
            >
              <div className="text-2xl">{p.emoji || '☕'}</div>
              <div className="font-semibold text-ink">{p.name}</div>
              <div className="tabular-nums">{moneyPlain(p.basePrice)}</div>
              <div className="text-xs text-muted">
                {p.modifierGroupIds.length === 0
                  ? '—'
                  : modifierGroups
                      .filter((g) => p.modifierGroupIds.includes(g.id))
                      .map((g) => g.name)
                      .join(', ')}
              </div>
              <div>
                {p.isActive ? (
                  <span className="text-success text-xs font-semibold bg-success/10 px-2 py-1 rounded-md">
                    В меню
                  </span>
                ) : (
                  <span className="text-error text-xs font-semibold bg-error/10 px-2 py-1 rounded-md">
                    Стоп-лист
                  </span>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => toggleProductActive(p.id)}
                  className="w-10 h-10 rounded-lg bg-cream hover:bg-coffee-50 flex items-center justify-center"
                  title={p.isActive ? 'Скрыть' : 'Показать'}
                >
                  {p.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => setEditing(p)}
                  className="w-10 h-10 rounded-lg bg-cream hover:bg-coffee-50 flex items-center justify-center"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Удалить «${p.name}»? Продажи в отчётах останутся.`)) deleteProduct(p.id);
                  }}
                  className="w-10 h-10 rounded-lg bg-cream hover:bg-error/10 hover:text-error flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {catProducts.length === 0 && (
            <div className="p-8 text-muted text-center">В этой категории пусто</div>
          )}
        </div>
      </div>

      {/* Category modal */}
      <Modal open={showNewCat} onClose={() => setShowNewCat(false)} title="Новая категория" size="sm">
        <input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="Например: Смузи"
          className="w-full h-14 rounded-xl border border-line px-4 focus:border-coffee"
        />
        <div className="flex gap-3 mt-6">
          <Button block variant="secondary" onClick={() => setShowNewCat(false)}>
            Отмена
          </Button>
          <Button
            block
            onClick={() => {
              if (newCatName.trim()) {
                createCategory(newCatName.trim());
                setNewCatName('');
                setShowNewCat(false);
              }
            }}
          >
            Добавить
          </Button>
        </div>
      </Modal>

      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateProduct(editing.id, patch);
            setEditing(null);
          }}
        />
      )}

      {creating && (
        <ProductEditor
          product={{
            id: '',
            categoryId: activeCat,
            name: '',
            basePrice: 200,
            emoji: '☕',
            isActive: true,
            sortOrder: catProducts.length + 1,
            modifierGroupIds: [],
          }}
          onClose={() => setCreating(false)}
          onSave={(patch) => {
            createProduct({
              categoryId: patch.categoryId ?? activeCat,
              name: patch.name ?? '',
              basePrice: patch.basePrice ?? 0,
              emoji: patch.emoji ?? '☕',
              sortOrder: catProducts.length + 1,
              modifierGroupIds: patch.modifierGroupIds ?? [],
            });
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (patch: Partial<Product>) => void;
}) {
  const categories = useStore((s) => s.categories);
  const modifierGroups = useStore((s) => s.modifierGroups);
  const [name, setName] = useState(product.name);
  const [basePrice, setBasePrice] = useState(String(product.basePrice));
  const [emoji, setEmoji] = useState(product.emoji || '');
  const [catId, setCatId] = useState(product.categoryId);
  const [modIds, setModIds] = useState<string[]>(product.modifierGroupIds);

  return (
    <Modal
      open
      onClose={onClose}
      title={product.id ? `Редактировать: ${product.name}` : 'Новая позиция'}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button block variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            block
            disabled={!name.trim() || Number(basePrice) < 0}
            onClick={() =>
              onSave({
                name: name.trim(),
                basePrice: Number(basePrice),
                emoji: emoji || '☕',
                categoryId: catId,
                modifierGroupIds: modIds,
              })
            }
          >
            Сохранить
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[80px,1fr] gap-4 mb-4 items-start">
        <div>
          <div className="text-xs text-muted mb-1">Иконка</div>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="w-full h-14 rounded-xl border border-line text-center text-3xl focus:border-coffee"
          />
        </div>
        <div>
          <div className="text-xs text-muted mb-1">Название</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 rounded-xl border border-line px-4 focus:border-coffee"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-muted mb-1">Категория</div>
          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            className="w-full h-14 rounded-xl border border-line px-4 focus:border-coffee bg-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">Базовая цена, ₽</div>
          <input
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full h-14 rounded-xl border border-line px-4 focus:border-coffee tabular-nums"
          />
        </div>
      </div>
      <div>
        <div className="text-xs text-muted mb-2">Модификаторы</div>
        <div className="grid grid-cols-2 gap-2">
          {modifierGroups.map((g) => {
            const active = modIds.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() =>
                  setModIds((ids) => (active ? ids.filter((i) => i !== g.id) : [...ids, g.id]))
                }
                className={cn(
                  'rounded-xl p-3 border-2 text-left',
                  active ? 'border-coffee bg-coffee-50' : 'border-line bg-white'
                )}
              >
                <div className="font-semibold text-ink text-sm">{g.name}</div>
                <div className="text-xs text-muted">{g.options.length} опций</div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
