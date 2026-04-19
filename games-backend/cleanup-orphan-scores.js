/**
 * Orphan Score Cleanup
 *
 * Removes rows from `scores` (and matching `activity` rows) whose `tx_hash`
 * is NULL — these are "ghost scores" that slipped into the DB during a window
 * where the frontend called /api/submit-score without first completing the
 * on-chain recordScoreWithBackendSig write. The submit-score guard now blocks
 * this, but existing ghosts need a one-shot purge.
 *
 * Usage:
 *   Dry run (default — shows what WOULD be deleted, no changes):
 *     node cleanup-orphan-scores.js
 *
 *   Actually delete:
 *     node cleanup-orphan-scores.js --confirm
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ─── Supabase client (same env vars as server.js) ────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CONFIRM = process.argv.includes('--confirm');

async function main() {
  console.log(`\n🔎 Finding orphan score rows (tx_hash IS NULL)…\n`);

  // ── SCORES table ────────────────────────────────────────────────────────
  const { data: orphanScores, error: sErr } = await supabase
    .from('scores')
    .select('id, wallet_address, game, score, created_at')
    .is('tx_hash', null)
    .order('score', { ascending: false });
  if (sErr) throw sErr;

  console.log(`  scores:   ${orphanScores.length} orphan row(s)`);
  if (orphanScores.length) {
    console.log();
    for (const r of orphanScores) {
      console.log(
        `    • ${r.wallet_address.slice(0, 10)}…  ${r.game.padEnd(7)}  score=${String(r.score).padStart(6)}  ${r.created_at}`
      );
    }
  }

  // ── ACTIVITY table ──────────────────────────────────────────────────────
  const { data: orphanActivity, error: aErr } = await supabase
    .from('activity')
    .select('id, wallet_address, game, score, created_at')
    .is('tx_hash', null)
    .order('created_at', { ascending: false });
  if (aErr) throw aErr;

  console.log(`\n  activity: ${orphanActivity.length} orphan row(s)\n`);

  if (!orphanScores.length && !orphanActivity.length) {
    console.log('✅ Nothing to clean. DB is in sync with on-chain state.\n');
    return;
  }

  if (!CONFIRM) {
    console.log('🟡 Dry run. Re-run with --confirm to delete these rows.\n');
    return;
  }

  // ── DELETE ──────────────────────────────────────────────────────────────
  console.log('🗑️  Deleting…');
  const scoreIds = orphanScores.map(r => r.id);
  const activityIds = orphanActivity.map(r => r.id);

  if (scoreIds.length) {
    const { error } = await supabase.from('scores').delete().in('id', scoreIds);
    if (error) throw error;
    console.log(`    ✓ scores:   ${scoreIds.length} rows deleted`);
  }
  if (activityIds.length) {
    const { error } = await supabase.from('activity').delete().in('id', activityIds);
    if (error) throw error;
    console.log(`    ✓ activity: ${activityIds.length} rows deleted`);
  }

  console.log('\n✅ Cleanup complete.\n');
}

main().catch(err => {
  console.error('❌', err.message || err);
  process.exit(1);
});
