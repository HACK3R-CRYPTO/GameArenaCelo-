-- Web Push subscriptions, one row per (wallet, device).
-- Multiple subscriptions per wallet are intentional — players use phone +
-- desktop. We don't dedupe; we send to all of a player's subscriptions
-- and let the browser decide which to display.

create table if not exists push_subscriptions (
  id              bigserial primary key,
  wallet_address  text        not null,
  endpoint        text        not null unique,  -- the unique URL the browser gives us
  p256dh          text        not null,         -- public key for the encrypted payload
  auth            text        not null,         -- shared secret
  user_agent      text,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);

create index if not exists push_subscriptions_wallet_idx on push_subscriptions(wallet_address);

-- Per-wallet notification preferences. Players can disable categories they
-- don't want without revoking the subscription entirely.
create table if not exists notification_prefs (
  wallet_address    text primary key,
  streak_warnings   boolean not null default true,
  cup_deadlines     boolean not null default true,
  rank_changes      boolean not null default true,
  reengagement      boolean not null default true,
  updated_at        timestamptz not null default now()
);

-- Track when we last sent a given category to a wallet so the cron doesn't
-- spam during a 24h window. Keyed by (wallet, category, day).
create table if not exists notification_log (
  wallet_address  text        not null,
  category        text        not null,
  sent_on         date        not null default current_date,
  payload_tag     text,
  created_at      timestamptz not null default now(),
  primary key (wallet_address, category, sent_on)
);
