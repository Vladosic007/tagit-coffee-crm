# TAGIT Coffee CRM (Next.js на Vercel)

Касса и учётная система для одной кофейни на планшете 1280×800. Роли: Бариста / Владелец, вход по 4-значному PIN.

Стек:
- **Next.js 14 (App Router)** — фронт + API-роуты в одном приложении
- **Prisma + PostgreSQL** (Neon для Vercel)
- **Zustand + Tailwind + Recharts + qrcode.react**
- **JOSE JWT + bcryptjs** для авторизации

## Локальный запуск

```bash
npm install
```

Создать `.env` в корне (шаблон в `.env.example`):
```
DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/tagit_crm?sslmode=require"
JWT_SECRET="случайная-длинная-строка-32+"
```

Применить миграции и залить демо-данные:
```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

Запустить:
```bash
npm run dev   # http://localhost:3000
```

Демо-PIN'ы после seed: **1234** владелец, **5678** Аня, **2222** Максим.

## Деплой на Vercel

1. **Neon Postgres** — создать проект в [neon.tech](https://neon.tech), скопировать connection string.
2. **Vercel** — импортировать репо, задать env-переменные:
   - `DATABASE_URL` — Neon connection string
   - `JWT_SECRET` — случайная строка ≥ 32 символов
3. **Prisma migrate** — либо через Vercel CLI один раз (`vercel env pull .env && npx prisma migrate deploy`), либо build-hook. Первый seed сделать вручную: `npx tsx prisma/seed.ts`.
4. Готово: `https://<project>.vercel.app`.

## Структура

```
app/
├─ (клиентские страницы)
│  ├─ login/       — вход по PIN
│  ├─ page.tsx     — главный экран баристы
│  ├─ order/       — каталог и корзина
│  ├─ payment/     — оплата (нал/перевод) со скидкой
│  ├─ success/[id] — успех + квитанция
│  ├─ shift/       — открытие/закрытие смены
│  ├─ cash-movement — инкассация/внесение
│  └─ owner/       — кабинет владельца (отчёт + периоды, смены, меню, сотрудники)
└─ api/            — все ручки (auth, menu, shifts, orders, cash-movements, reports/{day,period}, products, categories, employees, settings/brand)
components/        — UI + layout (Protected, AppBootstrap)
lib/               — prisma, auth, types, format, report, shiftStats
lib/client/        — client fetch + services
stores/            — Zustand стор (persist в localStorage)
prisma/            — schema + миграции + seed
```

## Что умеет

| Роль | Возможности |
|---|---|
| Бариста | Открыть/закрыть смену, продажи, скидка 0-100% на каждую позицию, инкассация/внесение, квитанция с QR |
| Владелец | Всё выше + отчёты за день/неделю/месяц/год/свой период, журнал смен, редактор меню и модификаторов, управление сотрудниками |

## Правовая оговорка

Квитанция — не фискальный чек 54-ФЗ. Для реальных продаж в РФ нужна интеграция с онлайн-кассой.
