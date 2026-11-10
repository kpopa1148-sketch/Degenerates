-- Этап 1: выбор доп. номинаций. Этап 2: голосование за кандидатов.
insert into settings(key, value) values ('stage', '"nominations"') on conflict (key) do nothing;

create table if not exists nomination_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nomination_id uuid not null references nominations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, nomination_id)
);
create index if not exists nomination_picks_nom_idx on nomination_picks (nomination_id);
alter table nomination_picks enable row level security;
revoke all on nomination_picks from anon, authenticated;
grant all on nomination_picks to service_role;

create or replace function cast_nomination_pick(p_user_id uuid, p_nomination_id uuid, p_on boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));
  if not voting_is_open() then raise exception 'VOTING_CLOSED'; end if;
  if coalesce((select value #>> '{}' from settings where key='stage'), 'candidates') <> 'nominations' then
    raise exception 'WRONG_STAGE'; end if;
  if not exists (select 1 from nominations where id = p_nomination_id and type = 'additional') then
    raise exception 'BAD_NOMINATION'; end if;
  if p_on then
    if not exists (select 1 from nomination_picks where user_id = p_user_id and nomination_id = p_nomination_id) then
      select count(*) into cnt from nomination_picks p join nominations n on n.id = p.nomination_id
        where p.user_id = p_user_id and n.type = 'additional';
      if cnt >= 2 then raise exception 'PICK_LIMIT'; end if;
      insert into nomination_picks(user_id, nomination_id) values (p_user_id, p_nomination_id);
    end if;
  else
    delete from nomination_picks where user_id = p_user_id and nomination_id = p_nomination_id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function finish_stage1() returns jsonb
language plpgsql security definer set search_path = public as $$
declare winners uuid[];
begin
  select array_agg(id) into winners from (
    select n.id from nominations n left join nomination_picks p on p.nomination_id = n.id
    where n.type = 'additional' group by n.id, n.sort_order
    order by count(p.id) desc, n.sort_order limit 2) t;
  update nominations set is_active = (id = any(winners)), updated_at = now() where type = 'additional';
  insert into settings(key, value) values ('stage', '"candidates"')
    on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('winners', winners);
end $$;

-- голосование за кандидатов теперь возможно только на этапе 2
create or replace function cast_vote(p_user_id uuid, p_nomination_id uuid, p_candidate_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare existed boolean;
begin
  if not voting_is_open() then raise exception 'VOTING_CLOSED'; end if;
  if coalesce((select value #>> '{}' from settings where key='stage'), 'candidates') <> 'candidates' then
    raise exception 'WRONG_STAGE'; end if;
  if not exists (select 1 from nominations where id=p_nomination_id and is_active) then
    raise exception 'NOMINATION_INACTIVE'; end if;
  if not exists (select 1 from candidates where id=p_candidate_id and nomination_id=p_nomination_id) then
    raise exception 'BAD_CANDIDATE'; end if;
  select exists(select 1 from votes where user_id=p_user_id and nomination_id=p_nomination_id) into existed;
  insert into votes(user_id, nomination_id, candidate_id) values (p_user_id, p_nomination_id, p_candidate_id)
  on conflict (user_id, nomination_id) do update set candidate_id = excluded.candidate_id, updated_at = now();
  insert into activity_logs(user_id, action, entity_type, entity_id, metadata)
    values (p_user_id, case when existed then 'vote_changed' else 'vote_cast' end, 'nomination', p_nomination_id::text,
            jsonb_build_object('candidate_id', p_candidate_id));
  return jsonb_build_object('changed', existed);
end $$;

revoke all on function cast_nomination_pick(uuid,uuid,boolean), finish_stage1(), cast_vote(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function cast_nomination_pick(uuid,uuid,boolean), finish_stage1(), cast_vote(uuid,uuid,uuid) to service_role;
