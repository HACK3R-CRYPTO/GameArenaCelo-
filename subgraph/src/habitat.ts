import { HabitatUnlocked } from "../generated/HabitatRegistry/HabitatRegistry";
import { PlayerHabitat } from "../generated/schema";
import {
  getOrCreatePlayer,
  getOrCreateDailyStat,
  getOrCreateGlobalStat,
  ONE_BI,
} from "./helpers";

export function handleHabitatUnlocked(event: HabitatUnlocked): void {
  let player = getOrCreatePlayer(event.params.player);

  // Per-player habitat row — `${wallet}-${tier}` makes it unique per unlock
  // and lets the GraphQL `derivedFrom` pull the player's full collection.
  let id = player.id.concat("-").concat(event.params.tier.toString());
  let h = new PlayerHabitat(id);
  h.player = player.id;
  h.tier = event.params.tier;
  h.unlockedAt = event.block.timestamp;
  h.totalPaid = event.params.totalPaid;
  h.ubiAmount = event.params.ubiAmount;
  h.treasuryAmount = event.params.treasuryAmount;
  h.txHash = event.transaction.hash;
  h.save();

  // Update player aggregates
  player.totalUbiDonated = player.totalUbiDonated.plus(event.params.ubiAmount);
  let tierInt = event.params.tier;
  if (tierInt > player.highestHabitatTier) player.highestHabitatTier = tierInt;
  player.save();

  // Daily aggregate
  let day = getOrCreateDailyStat(event.block.timestamp);
  day.habitatUnlocks = day.habitatUnlocks.plus(ONE_BI);
  day.ubiDonatedG = day.ubiDonatedG.plus(event.params.ubiAmount);
  day.save();

  // Global aggregate — track UBI and treasury split separately so the
  // dashboard can show "we routed X to UBI, Y to treasury" without joins
  let global = getOrCreateGlobalStat(event.block.timestamp);
  global.totalHabitatUnlocks = global.totalHabitatUnlocks.plus(ONE_BI);
  global.totalUbiDonatedG = global.totalUbiDonatedG.plus(event.params.ubiAmount);
  global.totalTreasuryG = global.totalTreasuryG.plus(event.params.treasuryAmount);
  global.save();
}
