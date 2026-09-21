import type { Category, Employee, ModifierGroup, Product, BrandSettings } from '@/lib/types';

export const initialBrand: BrandSettings = {
  name: 'TAGIT Coffee',
  logoEmoji: '☕',
  transferPhone: '+7 900 000-00-00',
  transferHolder: 'Иван И.',
  transferBank: 'Сбербанк',
};

export const initialEmployees: Employee[] = [
  { id: 'e1', name: 'Владелец', role: 'owner', pin: '1234', isActive: true },
  { id: 'e2', name: 'Аня (бариста)', role: 'barista', pin: '5678', isActive: true },
  { id: 'e3', name: 'Максим (бариста)', role: 'barista', pin: '2222', isActive: true },
];

export const initialCategories: Category[] = [
  { id: 'c1', name: 'Эспрессо', sortOrder: 1, isActive: true },
  { id: 'c2', name: 'На молоке', sortOrder: 2, isActive: true },
  { id: 'c3', name: 'Чай', sortOrder: 3, isActive: true },
  { id: 'c4', name: 'Авторские', sortOrder: 4, isActive: true },
  { id: 'c5', name: 'Десерты', sortOrder: 5, isActive: true },
];

export const initialModifierGroups: ModifierGroup[] = [
  {
    id: 'mg-size',
    name: 'Объём',
    type: 'size',
    required: true,
    multi: false,
    options: [
      { id: 'sz-s', name: 'S · 250 мл', priceDelta: 0, isDefault: true },
      { id: 'sz-m', name: 'M · 350 мл', priceDelta: 40 },
      { id: 'sz-l', name: 'L · 450 мл', priceDelta: 70 },
    ],
  },
  {
    id: 'mg-milk',
    name: 'Молоко',
    type: 'milk',
    required: true,
    multi: false,
    options: [
      { id: 'ml-reg', name: 'Обычное', priceDelta: 0, isDefault: true },
      { id: 'ml-oat', name: 'Овсяное', priceDelta: 30 },
      { id: 'ml-coco', name: 'Кокосовое', priceDelta: 30 },
      { id: 'ml-lact', name: 'Безлактозное', priceDelta: 30 },
    ],
  },
  {
    id: 'mg-syrup',
    name: 'Сироп',
    type: 'syrup',
    required: false,
    multi: false,
    options: [
      { id: 'sy-none', name: 'Без сиропа', priceDelta: 0, isDefault: true },
      { id: 'sy-van', name: 'Ваниль', priceDelta: 20 },
      { id: 'sy-car', name: 'Карамель', priceDelta: 20 },
      { id: 'sy-hzl', name: 'Фундук', priceDelta: 20 },
      { id: 'sy-lav', name: 'Лаванда', priceDelta: 30 },
    ],
  },
  {
    id: 'mg-syrup-only',
    name: 'Сироп',
    type: 'syrup',
    required: false,
    multi: false,
    options: [
      { id: 'sy2-none', name: 'Без сиропа', priceDelta: 0, isDefault: true },
      { id: 'sy2-van', name: 'Ваниль', priceDelta: 20 },
      { id: 'sy2-car', name: 'Карамель', priceDelta: 20 },
    ],
  },
];

export const initialProducts: Product[] = [
  // Эспрессо
  { id: 'p-esp', categoryId: 'c1', name: 'Эспрессо', basePrice: 130, emoji: '☕', isActive: true, sortOrder: 1, modifierGroupIds: [] },
  { id: 'p-dbl', categoryId: 'c1', name: 'Доппио', basePrice: 170, emoji: '☕', isActive: true, sortOrder: 2, modifierGroupIds: [] },
  { id: 'p-amr', categoryId: 'c1', name: 'Американо', basePrice: 160, emoji: '☕', isActive: true, sortOrder: 3, modifierGroupIds: ['mg-size'] },
  { id: 'p-mac', categoryId: 'c1', name: 'Макиато', basePrice: 190, emoji: '🥃', isActive: true, sortOrder: 4, modifierGroupIds: ['mg-milk'] },
  // На молоке
  { id: 'p-cap', categoryId: 'c2', name: 'Капучино', basePrice: 220, emoji: '☕', isActive: true, sortOrder: 1, modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'] },
  { id: 'p-lat', categoryId: 'c2', name: 'Латте', basePrice: 240, emoji: '🥛', isActive: true, sortOrder: 2, modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'] },
  { id: 'p-flt', categoryId: 'c2', name: 'Флэт уайт', basePrice: 240, emoji: '☕', isActive: true, sortOrder: 3, modifierGroupIds: ['mg-milk', 'mg-syrup'] },
  { id: 'p-raf', categoryId: 'c2', name: 'Раф', basePrice: 260, emoji: '🍯', isActive: true, sortOrder: 4, modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'] },
  { id: 'p-moc', categoryId: 'c2', name: 'Моккачино', basePrice: 280, emoji: '🍫', isActive: true, sortOrder: 5, modifierGroupIds: ['mg-size', 'mg-milk'] },
  { id: 'p-hchoc', categoryId: 'c2', name: 'Горячий шоколад', basePrice: 260, emoji: '🍫', isActive: true, sortOrder: 6, modifierGroupIds: ['mg-size', 'mg-milk'] },
  // Чай
  { id: 'p-tblk', categoryId: 'c3', name: 'Чёрный чай', basePrice: 150, emoji: '🍵', isActive: true, sortOrder: 1, modifierGroupIds: ['mg-size'] },
  { id: 'p-tgrn', categoryId: 'c3', name: 'Зелёный чай', basePrice: 150, emoji: '🍵', isActive: true, sortOrder: 2, modifierGroupIds: ['mg-size'] },
  { id: 'p-tmts', categoryId: 'c3', name: 'Матча-латте', basePrice: 280, emoji: '🍵', isActive: true, sortOrder: 3, modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'] },
  // Авторские
  { id: 'p-lav', categoryId: 'c4', name: 'Лавандовый раф', basePrice: 290, emoji: '💜', isActive: true, sortOrder: 1, modifierGroupIds: ['mg-size', 'mg-milk'] },
  { id: 'p-orng', categoryId: 'c4', name: 'Orange-эспрессо', basePrice: 240, emoji: '🍊', isActive: true, sortOrder: 2, modifierGroupIds: [] },
  { id: 'p-bnb', categoryId: 'c4', name: 'Банан-миндаль', basePrice: 310, emoji: '🍌', isActive: true, sortOrder: 3, modifierGroupIds: ['mg-size', 'mg-milk'] },
  // Десерты
  { id: 'p-crs', categoryId: 'c5', name: 'Круассан', basePrice: 180, emoji: '🥐', isActive: true, sortOrder: 1, modifierGroupIds: [] },
  { id: 'p-che', categoryId: 'c5', name: 'Чизкейк', basePrice: 260, emoji: '🍰', isActive: true, sortOrder: 2, modifierGroupIds: [] },
  { id: 'p-cok', categoryId: 'c5', name: 'Овсяное печенье', basePrice: 90, emoji: '🍪', isActive: true, sortOrder: 3, modifierGroupIds: [] },
];
