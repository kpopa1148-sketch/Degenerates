create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null unique,
  username text not null,
  global_name text,
  avatar_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table nominations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null check (type in ('main','additional')),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references nominations(id) on delete cascade,
  discord_id text not null,
  username text not null,
  avatar_hash text,
  description text,
  created_at timestamptz not null default now(),
  unique (nomination_id, discord_id)
);
create index on candidates (nomination_id);

create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nomination_id uuid not null references nominations(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, nomination_id)
);
create index on votes (nomination_id, candidate_id);
create index on votes (created_at desc);

create table candidate_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references users(id) on delete cascade,
  nomination_id uuid not null references nominations(id) on delete cascade,
  candidate_discord_id text not null,
  candidate_name text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index on candidate_submissions (nomination_id, candidate_discord_id) where status = 'pending';

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on activity_logs (created_at desc);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into settings(key, value) values
  ('voting_open','false'), ('voting_ends_at','null'),
  ('public_live_results','false'), ('results_published','false'),
  ('site_maintenance','false');

-- 16 номинаций из ТЗ (структурные данные, не фиктивные голоса/кандидаты)
insert into nominations (title, description, type, sort_order) values
 ('Кринж года','За самый легендарный кринж','main',1),
 ('Клоун сервера','За максимальную концентрацию кринжа','main',2),
 ('Душнила года','За умение испортить любой прикол','main',3),
 ('Призрак года','За появление раз в три месяца','main',4),
 ('Спамер года','За 300 сообщений за 5 минут','main',5),
 ('Провокатор года','За умение развести срач из ничего','main',6),
 ('Токсик года','За самые ядовитые комментарии','main',7),
 ('Переобуватель года','За смену мнения быстрее ветра','main',8),
 ('Легенда подвала','За неизвестные причины постоянного пребывания на сервере','main',9),
 ('Ебанутый гений года','За самые странные идеи','main',10),
 ('Секретарь ФСБ','Знает все сплетни сервера','additional',11),
 ('Мамин бизнесмен','За самые сомнительные сделки','additional',12),
 ('Местный NPC','За повторение одних и тех же фраз','additional',13),
 ('Человек-отмазка','Всегда найдёт причину','additional',14),
 ('Голосовой террорист','За звуки, которые невозможно забыть','additional',15),
 ('Переиграл и уничтожил','За попытки красиво ответить, которые провалились','additional',16);

-- ===== RLS: всё закрыто, доступ клиенту только через явные политики =====
alter table users enable row level security;
alter table nominations enable row level security;
alter table candidates enable row level security;
alter table votes enable row level security;
alter table candidate_submissions enable row level security;
alter table activity_logs enable row level security;
alter table settings enable row level security;

-- публично читаем только активные номинации, кандидатов и безопасные настройки
create policy nominations_read on nominations for select to anon, authenticated using (is_active);
create policy candidates_read on candidates for select to anon, authenticated
  using (exists (select 1 from nominations n where n.id = nomination_id and n.is_active));
create policy settings_read on settings for select to anon, authenticated
  using (key in ('voting_open','voting_ends_at','public_live_results','results_published','site_maintenance'));
-- users, votes, submissions, activity_logs: политик нет => клиент (anon/authenticated) не видит и не пишет.

revoke all on users, votes, candidate_submissions, activity_logs from anon, authenticated;
revoke insert, update, delete on nominations, candidates, settings from anon, authenticated;

-- ===== Автозакрытие по таймеру (серверное) =====
create or replace function voting_is_open() returns boolean
language plpgsql security definer set search_path = public as $$
declare o boolean; e timestamptz;
begin
  select (value)::boolean into o from settings where key='voting_open';
  select nullif(value #>> '{}','')::timestamptz into e from settings where key='voting_ends_at';
  if o and e is not null and e <= now() then
    update settings set value='false', updated_at=now() where key='voting_open';
    return false;
  end if;
  return coalesce(o,false);
end $$;

-- ===== Атомарное голосование / смена голоса =====
create or replace function cast_vote(p_user_id uuid, p_nomination_id uuid, p_candidate_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare existed boolean;
begin
  if not voting_is_open() then raise exception 'VOTING_CLOSED'; end if;
  if not exists (select 1 from nominations where id=p_nomination_id and is_active) then
    raise exception 'NOMINATION_INACTIVE'; end if;
  if not exists (select 1 from candidates where id=p_candidate_id and nomination_id=p_nomination_id) then
    raise exception 'BAD_CANDIDATE'; end if;
  select exists(select 1 from votes where user_id=p_user_id and nomination_id=p_nomination_id) into existed;
  insert into votes(user_id, nomination_id, candidate_id)
    values (p_user_id, p_nomination_id, p_candidate_id)
  on conflict (user_id, nomination_id)
    do update set candidate_id = excluded.candidate_id, updated_at = now();
  insert into activity_logs(user_id, action, entity_type, entity_id, metadata)
    values (p_user_id, case when existed then 'vote_changed' else 'vote_cast' end,
            'nomination', p_nomination_id::text, jsonb_build_object('candidate_id', p_candidate_id));
  return jsonb_build_object('changed', existed);
end $$;

-- ===== Результаты: видимость решает БД =====
create or replace function get_results(p_is_admin boolean default false)
returns table(nomination_id uuid, candidate_id uuid, discord_id text, username text,
              avatar_hash text, votes bigint, pct numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not p_is_admin
     and not coalesce((select value::boolean from settings where key='results_published'), false)
     and not coalesce((select value::boolean from settings where key='public_live_results'), false)
  then raise exception 'RESULTS_HIDDEN'; end if;
  return query
  select c.nomination_id, c.id, c.discord_id, c.username, c.avatar_hash,
         count(v.id),
         round(100.0 * count(v.id) / nullif(sum(count(v.id)) over (partition by c.nomination_id),0), 1)
  from candidates c left join votes v on v.candidate_id = c.id
  group by c.id
  order by c.nomination_id, count(v.id) desc;
end $$;

-- Публичный счётчик голосов (агрегат, не раскрывает кто за кого)
create or replace function nomination_vote_counts()
returns table(nomination_id uuid, total bigint)
language sql security definer set search_path = public as $$
  select n.id, count(v.id) from nominations n left join votes v on v.nomination_id=n.id group by n.id $$;

revoke all on function cast_vote, get_results from public, anon, authenticated;
grant execute on function cast_vote, get_results to service_role;
grant execute on function nomination_vote_counts, voting_is_open to anon, authenticated;
