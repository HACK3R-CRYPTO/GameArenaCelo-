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

// Cup deadline reminder — fires roughly 1 hour before the cup ends.
// Personalized with the player's current standing relative to the prize line.
function cupDeadlineNotification(rank, qualifyAt, totalPrizePool) {
  if (rank > 0 && rank <= qualifyAt) {
    return {
      title: '🏆 You\'re in the prize zone',
      body: `1 hour left. Hold #${rank} or climb — $${totalPrizePool} pool.`,
      tag: 'cup-deadline',
      url: '/leaderboard',
      requireInteraction: true,
    };
  }
  return {
    title: '🏆 1 hour left to qualify',
    body: rank > 0
      ? `You're #${rank}. Push past #${qualifyAt} to win — $${totalPrizePool} pool.`
      : `Last chance to qualify. $${totalPrizePool} pool.`,
    tag: 'cup-deadline',
    url: '/leaderboard',
    requireInteraction: true,
  };
}

// Rank change — someone just bumped you off a podium spot. Only fires for
// top-3 displacement because that's the emotionally significant moment.
function rankChangeNotification(opponent, newRank, game) {
  const gameLabel = game === 'rhythm' ? 'Rhythm Rush' : 'Simon Memory';
  const placeMedal = newRank === 4 ? '🥉→4️⃣' : newRank === 3 ? '🥈→🥉' : '🥇→🥈';
  return {
    title: `📉 You dropped to #${newRank}`,
    body: `${opponent} just passed you on ${gameLabel}. Take it back? ${placeMedal}`,
    tag: `rank-change-${game}-${new Date().toISOString().slice(0,10)}`,
    url: `/leaderboard?game=${game}`,
  };
}

// Achievement unlocked — fired inline from submit-score, not via cron.
function achievementNotification(name, icon) {
  return {
    title: `${icon || '🏆'} Achievement unlocked`,
    body: `${name}`,
    tag: `achievement-${name.toLowerCase().replace(/\s+/g, '-')}`,
    url: '/profile?tab=achievements',
  };
}

// Generic broadcast — admin sends "we shipped X" / "new cup is live".
// No category-specific dedup beyond the shared notification_log table.
function announcementNotification({ title, body, url, tag }) {
  return {
    title: title || '📣 GameArena update',
    body: body || '',
    url: url || '/games',
    tag: tag || `announcement-${new Date().toISOString().slice(0,10)}`,
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

// Broadcast to every subscribed wallet. Used by admin POST /api/push/broadcast.
// Honors per-wallet category mute via notification_prefs.reengagement so
// players who turned off all promo can't be force-fed announcements.
async function sendBroadcast(supabase, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return { sent: 0, skipped: 0 };

  // Pull all subscriptions and the prefs map in parallel
  const [{ data: subs }, { data: prefs }] = await Promise.all([
    supabase.from('push_subscriptions').select('wallet_address, endpoint, p256dh, auth'),
    supabase.from('notification_prefs').select('wallet_address, reengagement'),
  ]);
  const muted = new Set((prefs || []).filter(p => p.reengagement === false).map(p => p.wallet_address));

  let sent = 0, skipped = 0;
  const dead = [];
  const body = JSON.stringify(payload);

  for (const s of (subs || [])) {
    if (muted.has(s.wallet_address)) { skipped++; continue; }
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      );
      sent++;
    } catch (e) {
      if (e && (e.statusCode === 410 || e.statusCode === 404)) dead.push(s.endpoint);
    }
  }

  // Clean dead endpoints
  if (dead.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', dead);
  }
  return { sent, skipped, cleaned: dead.length };
}

module.exports = {
  petStage,
  streakNotification,
  cupDeadlineNotification,
  rankChangeNotification,
  reengagementNotification,
  achievementNotification,
  announcementNotification,
  saveSubscription,
  getSubscriptions,
  deleteSubscription,
  sendToWallet,
  sendBroadcast,
};
