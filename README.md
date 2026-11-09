# DEGENERATES AWARDS

Сделано (этапы 1–3): схема БД + RLS + RPC (`supabase/migrations/0001_schema.sql`), Discord OAuth2 (state, HttpOnly-сессия с HMAC), `POST /api/votes` (атомарный upsert через RPC), `GET /api/auth/me`, Zod-схемы, rate limit.

## Запуск
1. `cp .env.example .env.local`, заполнить (см. ниже). `VOTING_SECRET`: `openssl rand -hex 32`.
2. Supabase → SQL Editor → выполнить `0001_schema.sql`.
3. Discord Developer Portal → New Application → OAuth2: Client ID/Secret, Redirect `http://localhost:3000/auth/callback` (в production — ваш домен, совпадать с `DISCORD_REDIRECT_URI`).
4. `ADMIN_DISCORD_ID`: Discord → режим разработчика → ПКМ по себе → Copy User ID.
5. `npm install && npm run dev`.
6. Открыть голосование: `update settings set value='true' where key='voting_open'; update settings set value='"2026-12-31T20:00:00Z"' where key='voting_ends_at';` (позже будет в админке).

## Прочее
- Production: `npm run build && npm run start`. Deploy: Vercel/любой Node-хостинг; в Discord Redirect и `.env` укажите боевой домен.
- Управление голосованием — в `/admin` (вход под `ADMIN_DISCORD_ID`).
- Админка обновляется опросом раз в 5 с (RLS закрывает `votes` для клиента, поэтому прямой Supabase Realtime на `votes` не используется).
- Не реализовано: настоящая 3D-модель (вместо неё иконка с анимацией), Realtime-подписка.
