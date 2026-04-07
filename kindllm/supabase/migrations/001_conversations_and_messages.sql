-- Run in Supabase SQL Editor after enabling Anonymous sign-ins (Authentication > Providers).
-- conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  position int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_user_id on public.conversations (user_id);
create index if not exists idx_messages_conversation_id on public.messages (conversation_id);
create index if not exists idx_messages_position on public.messages (conversation_id, position);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users manage own conversations"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own messages"
  on public.messages for all
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  )
  with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );
