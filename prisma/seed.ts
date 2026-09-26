import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TAGIT Coffee CRM database...');

  // === Employees (upsert, сохраняем существующих) ===
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

  // === Меню — полный сброс и загрузка заново ===
  // Мы сначала обнуляем productId у существующих order_items (снимок цены и названия
  // уже сохранён в самой строке, ссылка на товар нужна только для группировки в отчётах).
  await prisma.orderItem.updateMany({ data: { productId: null } });
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.modifierGroup.deleteMany();

  // === Modifier groups ===
  const modifierGroups = [
    {
      id: 'mg-size-ml',
      name: 'Объём',
      type: 'size',
      required: true,
      multi: false,
      options: [
        { id: 'sz-m', name: 'M', priceDelta: 0, isDefault: true },
        { id: 'sz-l', name: 'L', priceDelta: 60 },
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
        { id: 'sy-van', name: 'Ваниль', priceDelta: 40 },
        { id: 'sy-car', name: 'Карамель', priceDelta: 40 },
        { id: 'sy-coc', name: 'Кокос', priceDelta: 40 },
        { id: 'sy-str', name: 'Клубника', priceDelta: 40 },
        { id: 'sy-rasp', name: 'Малина', priceDelta: 40 },
        { id: 'sy-lich', name: 'Личи', priceDelta: 40 },
        { id: 'sy-peach', name: 'Персик', priceDelta: 40 },
        { id: 'sy-mango', name: 'Манго', priceDelta: 40 },
      ],
    },
    {
      id: 'mg-extras',
      name: 'Добавки',
      type: 'extra',
      required: false,
      multi: true,
      options: [
        { id: 'ex-tap', name: 'Тапиока (2 порции)', priceDelta: 80 },
        { id: 'ex-jel', name: 'Джус-боллы (2 порции)', priceDelta: 80 },
        { id: 'ex-cheese', name: 'Сырная шапка', priceDelta: 15 },
      ],
    },
  ];
  for (const g of modifierGroups) {
    await prisma.modifierGroup.create({
      data: {
        id: g.id,
        name: g.name,
        type: g.type,
        required: g.required,
        multi: g.multi,
        options: JSON.stringify(g.options),
      },
    });
  }

  // === Categories ===
  const categories = [
    { id: 'c-milk', name: 'Молочные', sortOrder: 1 },
    { id: 'c-sweet', name: 'Послаще', sortOrder: 2 },
    { id: 'c-sour', name: 'Покислее', sortOrder: 3 },
    { id: 'c-tart', name: 'С кислинкой', sortOrder: 4 },
    { id: 'c-matcha', name: 'Бабл-Матча', sortOrder: 5 },
    { id: 'c-lim', name: 'Бабл-лим', sortOrder: 6 },
    { id: 'c-babl-coffee', name: 'Бабл-кофе', sortOrder: 7 },
    { id: 'c-tea', name: 'Чаи', sortOrder: 8 },
    { id: 'c-coffee', name: 'Кофе', sortOrder: 9 },
    { id: 'c-cacao', name: 'Какао', sortOrder: 10 },
  ];
  for (const c of categories) {
    await prisma.category.create({
      data: { id: c.id, name: c.name, sortOrder: c.sortOrder, isActive: true },
    });
  }

  // === Products ===
  // BUBBLE — categories с M/L + сиропом + добавками
  const BUBBLE = ['mg-size-ml', 'mg-syrup', 'mg-extras'];
  // COFFEE — только сироп, без объёма и без добавок
  const COFFEE = ['mg-syrup'];
  // NONE — без модификаторов (чаи, какао)
  const NONE: string[] = [];

  const products: Array<{
    id: string; categoryId: string; name: string; basePrice: number; emoji: string;
    mods: string[];
  }> = [
    // Молочные (base = M price)
    { id: 'p-tai', categoryId: 'c-milk', name: 'Тайское караоке', basePrice: 300, emoji: '🥛', mods: BUBBLE },
    { id: 'p-oreo', categoryId: 'c-milk', name: 'Орео', basePrice: 330, emoji: '🍪', mods: BUBBLE },
    { id: 'p-nut', categoryId: 'c-milk', name: 'Нутелла', basePrice: 330, emoji: '🍫', mods: BUBBLE },
    { id: 'p-mblue', categoryId: 'c-milk', name: 'Молочная черника', basePrice: 320, emoji: '🫐', mods: BUBBLE },
    { id: 'p-gran', categoryId: 'c-milk', name: 'Гранат-кокос', basePrice: 330, emoji: '🥥', mods: BUBBLE },
    { id: 'p-chstr', categoryId: 'c-milk', name: 'Чоко-клубника', basePrice: 330, emoji: '🍓', mods: BUBBLE },
    { id: 'p-moon', categoryId: 'c-milk', name: 'Таро тень луны', basePrice: 330, emoji: '🌙', mods: BUBBLE },
    { id: 'p-milkti', categoryId: 'c-milk', name: 'Бабл милк-ти', basePrice: 280, emoji: '🧋', mods: BUBBLE },

    // Послаще
    { id: 'p-jstr', categoryId: 'c-sweet', name: 'Жасминовая клубника', basePrice: 310, emoji: '🍓', mods: BUBBLE },
    { id: 'p-jrasp', categoryId: 'c-sweet', name: 'Жасминовая малина', basePrice: 310, emoji: '🍇', mods: BUBBLE },
    { id: 'p-frblue', categoryId: 'c-sweet', name: 'Морозная черника', basePrice: 310, emoji: '🫐', mods: BUBBLE },
    { id: 'p-rcloud', categoryId: 'c-sweet', name: 'Малиновое облако', basePrice: 320, emoji: '☁️', mods: BUBBLE },
    { id: 'p-redcur', categoryId: 'c-sweet', name: 'Красный со смородиной', basePrice: 310, emoji: '🔴', mods: BUBBLE },
    { id: 'p-citrus', categoryId: 'c-sweet', name: 'Цитрус', basePrice: 300, emoji: '🍊', mods: BUBBLE },

    // Покислее
    { id: 'p-marak', categoryId: 'c-sour', name: 'Маракуйя с содовой', basePrice: 310, emoji: '🥭', mods: BUBBLE },
    { id: 'p-rdrag', categoryId: 'c-sour', name: 'Рэд драгон', basePrice: 310, emoji: '🐉', mods: BUBBLE },
    { id: 'p-jlim', categoryId: 'c-sour', name: 'Жасминовый лайм', basePrice: 310, emoji: '🍋', mods: BUBBLE },
    { id: 'p-tlun', categoryId: 'c-sour', name: 'Тай лун', basePrice: 310, emoji: '🐲', mods: BUBBLE },

    // С кислинкой
    { id: 'p-oblep', categoryId: 'c-tart', name: 'Облепиховая пряность', basePrice: 300, emoji: '🌾', mods: BUBBLE },
    { id: 'p-velv', categoryId: 'c-tart', name: 'Вельвет', basePrice: 310, emoji: '❤️', mods: BUBBLE },
    { id: 'p-lmors', categoryId: 'c-tart', name: 'Лесной морс', basePrice: 310, emoji: '🌲', mods: BUBBLE },
    { id: 'p-berry', categoryId: 'c-tart', name: 'Ягодный микс', basePrice: 310, emoji: '🍒', mods: BUBBLE },
    { id: 'p-jkiwi', categoryId: 'c-tart', name: 'Жасминовый киви', basePrice: 320, emoji: '🥝', mods: BUBBLE },
    { id: 'p-taior', categoryId: 'c-tart', name: 'Тайский с апельсином', basePrice: 320, emoji: '🍊', mods: BUBBLE },

    // Бабл-Матча
    { id: 'p-mtchrasp', categoryId: 'c-matcha', name: 'Матча с малиной', basePrice: 330, emoji: '🍵', mods: BUBBLE },
    { id: 'p-mtchfis', categoryId: 'c-matcha', name: 'Матча с фисташкой', basePrice: 330, emoji: '🌰', mods: BUBBLE },
    { id: 'p-mtchjstr', categoryId: 'c-matcha', name: 'Жасминовая клубника', basePrice: 310, emoji: '🍓', mods: BUBBLE },
    { id: 'p-mtchsak', categoryId: 'c-matcha', name: 'Розовая сакура', basePrice: 330, emoji: '🌸', mods: BUBBLE },

    // Бабл-лим
    { id: 'p-lmoh', categoryId: 'c-lim', name: 'Мохито', basePrice: 300, emoji: '🌿', mods: BUBBLE },
    { id: 'p-lshav', categoryId: 'c-lim', name: 'Щавелевый', basePrice: 300, emoji: '🌱', mods: BUBBLE },
    { id: 'p-limbr', categoryId: 'c-lim', name: 'Изумрудный бриз', basePrice: 300, emoji: '💚', mods: BUBBLE },
    { id: 'p-lcarr', categoryId: 'c-lim', name: 'Карамельная малина', basePrice: 300, emoji: '🍬', mods: BUBBLE },
    { id: 'p-lraisz', categoryId: 'c-lim', name: 'Райсзан', basePrice: 300, emoji: '✨', mods: BUBBLE },
    { id: 'p-lban', categoryId: 'c-lim', name: 'Банановый', basePrice: 300, emoji: '🍌', mods: BUBBLE },

    // Бабл-кофе — только M, добавки+сироп можно
    { id: 'p-bkchob', categoryId: 'c-babl-coffee', name: 'Чоко-банан', basePrice: 380, emoji: '🍫', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkbcar', categoryId: 'c-babl-coffee', name: 'Взрывная карамель', basePrice: 380, emoji: '💥', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkrose', categoryId: 'c-babl-coffee', name: 'Красотка в розовом', basePrice: 380, emoji: '🌹', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bktof', categoryId: 'c-babl-coffee', name: 'Тоффи бум', basePrice: 380, emoji: '🍮', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bksn', categoryId: 'c-babl-coffee', name: 'Сникерс', basePrice: 380, emoji: '🥜', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkstb', categoryId: 'c-babl-coffee', name: 'Клубника-базилик', basePrice: 380, emoji: '🌿', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkchz', categoryId: 'c-babl-coffee', name: 'Чизкейк', basePrice: 380, emoji: '🍰', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkhal', categoryId: 'c-babl-coffee', name: 'Халва', basePrice: 380, emoji: '🍯', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkrf', categoryId: 'c-babl-coffee', name: 'Рот фронт', basePrice: 380, emoji: '🍬', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkcrf', categoryId: 'c-babl-coffee', name: 'Сырный раф', basePrice: 380, emoji: '🧀', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkbmb', categoryId: 'c-babl-coffee', name: 'Бамбл', basePrice: 380, emoji: '🐝', mods: ['mg-syrup', 'mg-extras'] },
    { id: 'p-bkdub', categoryId: 'c-babl-coffee', name: 'Дубайский', basePrice: 380, emoji: '🕌', mods: ['mg-syrup', 'mg-extras'] },

    // Чаи (без модификаторов, но с примечанием об объёме в названии)
    { id: 'p-tass', categoryId: 'c-tea', name: 'Ассам 380 мл', basePrice: 120, emoji: '🍵', mods: NONE },
    { id: 'p-tkar', categoryId: 'c-tea', name: 'Каркадэ 380 мл', basePrice: 135, emoji: '🌺', mods: NONE },
    { id: 'p-tglw', categoryId: 'c-tea', name: 'Глинтвейн 380 мл', basePrice: 180, emoji: '🍷', mods: NONE },
    { id: 'p-tpea', categoryId: 'c-tea', name: 'Персиковый Липтон 380 мл', basePrice: 125, emoji: '🍑', mods: NONE },
    { id: 'p-tobl', categoryId: 'c-tea', name: 'Облепиховый 380 мл', basePrice: 115, emoji: '🌾', mods: NONE },

    // Кофе — сироп, без объёма
    { id: 'p-amer', categoryId: 'c-coffee', name: 'Американо 250 мл', basePrice: 150, emoji: '☕', mods: COFFEE },
    { id: 'p-lat', categoryId: 'c-coffee', name: 'Латте 380 мл', basePrice: 200, emoji: '☕', mods: COFFEE },
    { id: 'p-cap', categoryId: 'c-coffee', name: 'Капучино 380 мл', basePrice: 190, emoji: '☕', mods: COFFEE },
    { id: 'p-raf', categoryId: 'c-coffee', name: 'Раф 380 мл', basePrice: 230, emoji: '🍯', mods: COFFEE },
    { id: 'p-brraf', categoryId: 'c-coffee', name: 'Банановый раф 380 мл', basePrice: 275, emoji: '🍌', mods: COFFEE },
    { id: 'p-flat', categoryId: 'c-coffee', name: 'Флэт уайт 250 мл', basePrice: 200, emoji: '🥛', mods: COFFEE },
    { id: 'p-moc', categoryId: 'c-coffee', name: 'Моккачино 380 мл', basePrice: 215, emoji: '🍫', mods: COFFEE },

    // Какао
    { id: 'p-ccl', categoryId: 'c-cacao', name: 'Классика 380 мл', basePrice: 160, emoji: '🍫', mods: NONE },
    { id: 'p-cbur', categoryId: 'c-cacao', name: 'Буренка 380 мл', basePrice: 210, emoji: '🐄', mods: NONE },
    { id: 'p-ccar', categoryId: 'c-cacao', name: 'Карамель 380 мл', basePrice: 210, emoji: '🍮', mods: NONE },
    { id: 'p-cshok', categoryId: 'c-cacao', name: 'Шоколад 380 мл', basePrice: 215, emoji: '🍫', mods: NONE },
  ];

  let sortOrder = 0;
  for (const p of products) {
    sortOrder += 1;
    await prisma.product.create({
      data: {
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        basePrice: p.basePrice,
        emoji: p.emoji,
        modifierGroupIds: JSON.stringify(p.mods),
        sortOrder,
        isActive: true,
      },
    });
  }

  // === Brand settings ===
  // Реквизиты обновляем принудительно; название и лого — только создаём,
  // чтобы владелец мог их поменять руками через кабинет позже.
  const alwaysUpdate = [
    { key: 'brand.transferPhone', value: '+7 900 275 90 64' },
    { key: 'brand.transferHolder', value: '' },
    { key: 'brand.transferBank', value: 'СБП' },
  ];
  for (const s of alwaysUpdate) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }
  const createOnly = [
    { key: 'brand.name', value: 'TAGIT Coffee' },
    { key: 'brand.logoEmoji', value: '☕' },
  ];
  for (const s of createOnly) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Employees:', employees.length);
  console.log('   Categories:', categories.length);
  console.log('   Products:', products.length);
  console.log('   Modifier groups:', modifierGroups.length);
  console.log('   Демо PIN — Владелец 1234, Аня 5678, Максим 2222');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
