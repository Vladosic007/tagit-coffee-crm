import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TAGIT Coffee CRM database...');

  // Employees
  const employees = [
    { name: 'Владелец', role: 'owner', pin: '1234' },
    { name: 'Аня (бариста)', role: 'barista', pin: '5678' },
    { name: 'Максим (бариста)', role: 'barista', pin: '2222' },
  ];
  for (const e of employees) {
    const pinHash = await bcrypt.hash(e.pin, 10);
    await prisma.employee.upsert({
      where: { id: `emp_${e.pin}` },
      create: { id: `emp_${e.pin}`, name: e.name, role: e.role, pinHash },
      update: { name: e.name, role: e.role, pinHash },
    });
  }

  // Modifier groups
  const modifierGroups = [
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
  ];
  for (const g of modifierGroups) {
    await prisma.modifierGroup.upsert({
      where: { id: g.id },
      create: {
        id: g.id,
        name: g.name,
        type: g.type,
        required: g.required,
        multi: g.multi,
        options: JSON.stringify(g.options),
      },
      update: {
        name: g.name,
        options: JSON.stringify(g.options),
      },
    });
  }

  // Categories
  const categories = [
    { id: 'c1', name: 'Эспрессо', sortOrder: 1 },
    { id: 'c2', name: 'На молоке', sortOrder: 2 },
    { id: 'c3', name: 'Чай', sortOrder: 3 },
    { id: 'c4', name: 'Авторские', sortOrder: 4 },
    { id: 'c5', name: 'Десерты', sortOrder: 5 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name, sortOrder: c.sortOrder, isActive: true },
      update: { name: c.name },
    });
  }

  // Products
  const products: Array<{
    id: string; categoryId: string; name: string; basePrice: number; emoji: string;
    modifierGroupIds: string[]; sortOrder: number;
  }> = [
    { id: 'p-esp', categoryId: 'c1', name: 'Эспрессо', basePrice: 130, emoji: '☕', modifierGroupIds: [], sortOrder: 1 },
    { id: 'p-dbl', categoryId: 'c1', name: 'Доппио', basePrice: 170, emoji: '☕', modifierGroupIds: [], sortOrder: 2 },
    { id: 'p-amr', categoryId: 'c1', name: 'Американо', basePrice: 160, emoji: '☕', modifierGroupIds: ['mg-size'], sortOrder: 3 },
    { id: 'p-mac', categoryId: 'c1', name: 'Макиато', basePrice: 190, emoji: '🥃', modifierGroupIds: ['mg-milk'], sortOrder: 4 },
    { id: 'p-cap', categoryId: 'c2', name: 'Капучино', basePrice: 220, emoji: '☕', modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'], sortOrder: 1 },
    { id: 'p-lat', categoryId: 'c2', name: 'Латте', basePrice: 240, emoji: '🥛', modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'], sortOrder: 2 },
    { id: 'p-flt', categoryId: 'c2', name: 'Флэт уайт', basePrice: 240, emoji: '☕', modifierGroupIds: ['mg-milk', 'mg-syrup'], sortOrder: 3 },
    { id: 'p-raf', categoryId: 'c2', name: 'Раф', basePrice: 260, emoji: '🍯', modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'], sortOrder: 4 },
    { id: 'p-moc', categoryId: 'c2', name: 'Моккачино', basePrice: 280, emoji: '🍫', modifierGroupIds: ['mg-size', 'mg-milk'], sortOrder: 5 },
    { id: 'p-hchoc', categoryId: 'c2', name: 'Горячий шоколад', basePrice: 260, emoji: '🍫', modifierGroupIds: ['mg-size', 'mg-milk'], sortOrder: 6 },
    { id: 'p-tblk', categoryId: 'c3', name: 'Чёрный чай', basePrice: 150, emoji: '🍵', modifierGroupIds: ['mg-size'], sortOrder: 1 },
    { id: 'p-tgrn', categoryId: 'c3', name: 'Зелёный чай', basePrice: 150, emoji: '🍵', modifierGroupIds: ['mg-size'], sortOrder: 2 },
    { id: 'p-tmts', categoryId: 'c3', name: 'Матча-латте', basePrice: 280, emoji: '🍵', modifierGroupIds: ['mg-size', 'mg-milk', 'mg-syrup'], sortOrder: 3 },
    { id: 'p-lav', categoryId: 'c4', name: 'Лавандовый раф', basePrice: 290, emoji: '💜', modifierGroupIds: ['mg-size', 'mg-milk'], sortOrder: 1 },
    { id: 'p-orng', categoryId: 'c4', name: 'Orange-эспрессо', basePrice: 240, emoji: '🍊', modifierGroupIds: [], sortOrder: 2 },
    { id: 'p-bnb', categoryId: 'c4', name: 'Банан-миндаль', basePrice: 310, emoji: '🍌', modifierGroupIds: ['mg-size', 'mg-milk'], sortOrder: 3 },
    { id: 'p-crs', categoryId: 'c5', name: 'Круассан', basePrice: 180, emoji: '🥐', modifierGroupIds: [], sortOrder: 1 },
    { id: 'p-che', categoryId: 'c5', name: 'Чизкейк', basePrice: 260, emoji: '🍰', modifierGroupIds: [], sortOrder: 2 },
    { id: 'p-cok', categoryId: 'c5', name: 'Овсяное печенье', basePrice: 90, emoji: '🍪', modifierGroupIds: [], sortOrder: 3 },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        basePrice: p.basePrice,
        emoji: p.emoji,
        modifierGroupIds: JSON.stringify(p.modifierGroupIds),
        sortOrder: p.sortOrder,
        isActive: true,
      },
      update: {
        name: p.name,
        basePrice: p.basePrice,
        emoji: p.emoji,
        modifierGroupIds: JSON.stringify(p.modifierGroupIds),
      },
    });
  }

  // Brand settings
  const settings = [
    { key: 'brand.name', value: 'TAGIT Coffee' },
    { key: 'brand.logoEmoji', value: '☕' },
    { key: 'brand.transferPhone', value: '+7 900 000-00-00' },
    { key: 'brand.transferHolder', value: 'Иван И.' },
    { key: 'brand.transferBank', value: 'Сбербанк' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Employees:', employees.length);
  console.log('   Categories:', categories.length);
  console.log('   Products:', products.length);
  console.log('   Demo PINs — Владелец 1234, Аня 5678, Максим 2222');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
