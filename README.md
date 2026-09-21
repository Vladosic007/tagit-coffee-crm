# TAGIT Coffee CRM

Касса и учётная система для одной кофейни на планшете 1280×800 (альбомная).
Роли: **Бариста** (смена, продажи, касса) и **Владелец** (отчёты, меню, сотрудники).
Вход по 4-значному PIN.

## Что внутри

- `frontend/` — React + Vite + TypeScript + Tailwind, PWA-ready
- `backend/` — Node.js + Fastify + Prisma + JWT + bcrypt
- `docker-compose.yml` — Postgres + backend + frontend в трёх контейнерах
- `дизайн/` — исходный HTML-макет с 13 экранами
- `CRM для кофейни — ТЗ, база и промты (TAGIT).docx` — техническое задание

## Локальный запуск (без Docker)

Одноразовая настройка:

```bash
cd frontend && npm install
cd ../backend && npm install
cd backend && npm run setup   # prisma generate + migrate + seed
```

Запуск в двух терминалах:

```bash
# терминал 1 — бэк на :3001
cd backend && npm run dev

# терминал 2 — фронт на :3000
cd frontend && npm run dev
```

Открыть http://localhost:3000. Демо-PIN'ы: **1234** владелец, **5678** Аня, **2222** Максим.

## База данных

В `backend/prisma/schema.prisma` по умолчанию SQLite (файл `backend/prisma/dev.db`) — удобно для локальной разработки без установки Postgres. Для продакшна в Docker Compose схема автоматически переключается на PostgreSQL (см. `backend/Dockerfile`).

## Продакшн деплой (Docker Compose)

1. Установите Docker и Docker Compose на сервер.
2. Скопируйте `.env.example` в `.env` и заполните:
   - `POSTGRES_PASSWORD` — сильный пароль
   - `JWT_SECRET` — случайная строка от 32 символов
   - `CORS_ORIGIN` — публичный URL фронта (например `https://kassa.вашдомен`)
   - `VITE_API_URL` — публичный URL API (например `https://api.вашдомен`)
3. Запустите:

```bash
docker compose up -d --build
```

Фронт доступен на `:8080`, API — на `:3001`. Первый запуск сам создаст миграции и заполнит демо-меню.

### Nginx + HTTPS (reg.cloud)

Поверх контейнеров ставится системный Nginx с сертификатом Let's Encrypt как reverse-proxy на `:8080` и `:3001`. Пример упрощённого конфига есть в `ops/nginx.example.conf` (создать при деплое).

### Резервные копии

Ежедневно по cron:

```cron
0 3 * * * docker exec tagit-postgres pg_dump -U tagit tagit_crm | gzip > /var/backup/tagit-$(date +\%F).sql.gz
```

## Стек

| Слой | Технология |
|---|---|
| Фронт | React 18, TypeScript, Vite, Tailwind, Zustand, React Router, Recharts, qrcode.react |
| Бэк | Node 20, Fastify 4, Prisma 5, bcryptjs, Zod |
| БД | SQLite (dev) / PostgreSQL 16 (prod) |
| Обёртка | Docker Compose, Nginx |

## Дизайн-токены

Кремовый фон `#F7F3EE`, кофейно-коричневый акцент `#6F4E37`, тёмно-коричневый текст `#2B2018`, успех `#3E7C5A`, ошибка `#C0492F`. Шрифт Inter, радиус 12px, минимальная тач-цель 64px. Всё — из ТЗ, раздел 12.

## Правовая оговорка

Квитанция не является фискальным чеком по 54-ФЗ. Для реальной работы в РФ потребуется интеграция с онлайн-кассой — заложено в дорожную карту после MVP.
