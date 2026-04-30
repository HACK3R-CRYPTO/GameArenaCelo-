import {
  WagerCreated,
  WagerResolved,
} from "../generated/SoloWager/SoloWager";
import { Wager } from "../generated/schema";
import {
  getOrCreatePlayer,
  getOrCreateDailyStat,
  getOrCreateGlobalStat,
  ZERO_BI,
  ONE_BI,
} from "./helpers";

export function handleWagerCreated(event: WagerCreated): void {
  let player = getOrCreatePlayer(event.params.player);

  // Wager id is the on-chain counter; one row per wager, status mutates.
  let w = new Wager(event.params.wagerId.toString());
  w.player = player.id;
  w.amount = event.params.amount;
  w.gameType = event.params.gameType;
  w.status = 0; // pending
  w.payout = ZERO_BI;
  w.createdAt = event.block.timestamp;
  w.txHash = event.transaction.hash;
  w.save();

  // Player aggregates
  player.totalWagers = player.totalWagers.plus(ONE_BI);
  player.totalWageredG = player.totalWageredG.plus(event.params.amount);
  player.save();

  // Daily + global
  let day = getOrCreateDailyStat(event.block.timestamp);
  day.wagersCreated = day.wagersCreated.plus(ONE_BI);
  day.save();

  let global = getOrCreateGlobalStat(event.block.timestamp);
  global.totalWagers = global.totalWagers.plus(ONE_BI);
  global.totalWageredG = global.totalWageredG.plus(event.params.amount);
  global.save();
}

export function handleWagerResolved(event: WagerResolved): void {
  let w = Wager.load(event.params.wagerId.toString());
  // If the WagerCreated event was missed (shouldn't happen but be defensive),
  // skip rather than fabricate a row with no amount data.
  if (w == null) return;

  w.status = event.params.won ? 1 : 2;
  w.payout = event.params.payout;
  w.resolvedAt = event.block.timestamp;
  w.save();

  // Update player win/loss counters
  let player = getOrCreatePlayer(event.params.player);
  if (event.params.won) {
    player.wagersWon = player.wagersWon.plus(ONE_BI);
    player.totalWonG = player.totalWonG.plus(event.params.payout);
  } else {
    player.wagersLost = player.wagersLost.plus(ONE_BI);
  }
  player.save();
}
