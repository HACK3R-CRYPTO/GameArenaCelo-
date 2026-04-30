// Web Push helper. Sends notifications, manages subscriptions, owns the
// pet-voice copy library so the backend speaks consistently across all
// notification triggers.
//
// Pattern lifted from Duolingo + top mobile games:
//   - Streak loss aversion as the primary engagement loop
//   - Pet-as-narrator (the slime says it, not "GameArena: ...")
//   - Once-per-day cap per category (notification_log primary key enforces it)
//   - Pet stage adapts the voice (egg vs king slime)

const webpush = require('web-push');

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_CONTACT = process.env.VAPID_CONTACT_EMAIL || 'mailto:notify@gamearenahq.xyz';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ─── Pet voice library ───────────────────────────────────────────────────────
// Pet evolves with player level (matches /frontend/app/profile/page.tsx).
// We pick the voice that matches their current stage so the notification
// reads as if it's from the player's actual pet, not generic copy.
function petStage(level) {
  if (level >= 50) return 'king';
  if (level >= 30) return 'crystal';
  if (level >= 15) return 'teen';
  if (level >= 5)  return 'baby';
  return 'egg';
}

// Streak warning copy by stage. Each variant uses loss aversion + the pet's
// personality. Player's actual streak count goes in the body for personalization.
const STREAK_COPY = {
  egg: {
    title: '🥚 Your egg is shaking',
    body: (s) => `${s}-day streak ends in a few hours. One round keeps it alive.`,
  },
  baby: {
    title: '🟢 Your slime is sad',
    body: (s) => `Your ${s}-day streak ends soon. Just one round to keep going.`,
  },
  teen: {
    title: '🟣 The forest is quiet',
    body: (s) => `${s} days strong. Don't lose it now — play one round.`,
  },
  crystal: {
    title: '💎 Your crystal is dimming',
    body: (s) => `${s}-day streak about to break. One round saves it.`,
  },
  king: {
    title: '👑 A king without games is just a slime',
    body: (s) => `${s}-day streak ends in a few hours. Defend the throne.`,
  },
};

function streakNotification(stage, streakDays) {
  const c = STREAK_COPY[stage] || STREAK_COPY.baby;
  return {
    title: c.title,
    body: c.body(streakDays),
    tag: `streak-warning-${new Date().toISOString().slice(0,10)}`,
    url: '/games',
    requireInteraction: true,
  };
}

// Cup deadline reminder — fires 1 hour before cup ends if the player has at
// least one play but isn't already top-N qualified. Personalized with rank.
function cupDeadlineNotification(rank, totalPrizePool) {
  return {
    title: '🏆 1 hour left in the Arena Cup',
    body: rank > 0
      ? `You're #${rank}. Push for top — $${totalPrizePool} pool.`
      : `Last chance to qualify. $${totalPrizePool} pool.`,
    tag: 'cup-deadline',
    url: '/leaderboard',
    requireInteraction: true,
  };
}

// Rank change — someone just took your spot.
function rankChangeNotification(opponent, newRank) {
  return {
    title: '📉 You got passed',
    body: `${opponent} just took #${newRank - 1}. Take it back?`,
    tag: 'rank-change',
    url: '/leaderboard',
  };
}

// Re-engagement, escalating by days lapsed.
function reengagementNotification(stage, daysLapsed) {
  if (daysLapsed === 1) {
    return { title: '🥚 Your pet misses you', body: 'Quick round? Less than a minute.', tag: 're-d1', url: '/games' };
  }
  if (daysLapsed === 3) {
    const titles = {
      egg: '🥚 Still cold in here',
      baby: '🟢 Bored. Come play.',
      teen: '🟣 Forest is silent without you',
      crystal: '💎 The cave is dark',
      king: '👑 The throne is empty',
    };
    return { title: titles[stage] || titles.baby, body: '3 days away. Come back?', tag: 're-d3', url: '/games' };
  }
  if (daysLapsed === 7) {
    return { title: '✨ A week away', body: 'New cups, new players, new prizes. Come see.', tag: 're-d7', url: '/games' };
  }
  return null;
}

// ─── Subscription management ─────────────────────────────────────────────────
async function saveSubscription(supabase, walletAddress, sub, userAgent) {
  const lower = walletAddress.toLowerCase();
  const { error } = await supabase.from('push_subscriptions').upsert({
    wallet_address: lower,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth:   sub.keys.auth,
    user_agent: userAgent || null,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
  return !error;
}

async function getSubscriptions(supabase, walletAddress) {
  const { data } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('wallet_address', walletAddress.toLowerCase());
  return data || [];
}

async function deleteSubscription(supabase, endpoint) {
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

// ─── Send ────────────────────────────────────────────────────────────────────
// Fires a push to all of a wallet's subscriptions. Records once-per-day in
// notification_log so the cron can't double-send. Removes dead endpoints
// (410 Gone) so the table stays clean.
async function sendToWallet(supabase, walletAddress, category, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;

  const lower = walletAddress.toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  // De-dupe: have we already sent this category today?
  const { data: log } = await supabase
    .from('notification_log')
    .select('wallet_address')
    .eq('wallet_address', lower)
    .eq('category', category)
    .eq('sent_on', today)
    .limit(1);
  if (log && log.length > 0) return false;

  const subs = await getSubscriptions(supabase, lower);
  if (subs.length === 0) return false;

  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map(s => webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      body,
    )),
  );

  // Clean up dead subscriptions
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'rejected' && r.reason && (r.reason.statusCode === 410 || r.reason.statusCode === 404)) {
      await deleteSubscription(supabase, subs[i].endpoint);
    }
  }

  // Record send so we don't repeat today
  await supabase.from('notification_log').insert({
    wallet_address: lower,
    category,
    sent_on: today,
    payload_tag: payload.tag || null,
  });

  return true;
}

module.exports = {
  petStage,
  streakNotification,
  cupDeadlineNotification,
  rankChangeNotification,
  reengagementNotification,
  saveSubscription,
  getSubscriptions,
  deleteSubscription,
  sendToWallet,
};
