// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {HabitatRegistry} from "../src/HabitatRegistry.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockGoodDollar is ERC20 {
    constructor() ERC20("GoodDollar", "G$") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract HabitatRegistryTest is Test {
    HabitatRegistry registry;
    MockGoodDollar gToken;

    address owner    = address(0xA11CE);
    address player   = address(0xB0B);
    address player2  = address(0xC4101);
    address ubiPool  = address(0xCAFE);
    address treasury = address(0x77357);

    event HabitatUnlocked(
        address indexed player,
        uint8   indexed tier,
        uint256 totalPaid,
        uint256 ubiAmount,
        uint256 treasuryAmount
    );

    function setUp() public {
        gToken = new MockGoodDollar();
        vm.prank(owner);
        registry = new HabitatRegistry(address(gToken), ubiPool, treasury);

        // Give players generous G$ balances and approve registry
        gToken.mint(player, 100_000 ether);
        gToken.mint(player2, 100_000 ether);

        vm.prank(player);
        gToken.approve(address(registry), type(uint256).max);
        vm.prank(player2);
        gToken.approve(address(registry), type(uint256).max);
    }

    // ── Constructor ──────────────────────────────────────────────────────────
    function test_constructor_sets_state() public view {
        assertEq(address(registry.gToken()), address(gToken));
        assertEq(registry.ubiPool(), ubiPool);
        assertEq(registry.treasury(), treasury);
        assertEq(registry.ubiBps(), 8500);
        assertEq(registry.treasuryBps(), 1500);
        assertEq(registry.tierCost(6),    300 ether);
        assertEq(registry.tierCost(10), 30_000 ether);
    }

    function test_constructor_rejects_zero_addresses() public {
        vm.expectRevert("G$ address zero");
        new HabitatRegistry(address(0), ubiPool, treasury);

        vm.expectRevert("UBI pool zero");
        new HabitatRegistry(address(gToken), address(0), treasury);

        vm.expectRevert("Treasury zero");
        new HabitatRegistry(address(gToken), ubiPool, address(0));
    }

    // ── Unlock happy path ────────────────────────────────────────────────────
    function test_unlock_splits_correctly() public {
        uint256 cost = registry.tierCost(6); // 300 G$
        uint256 expectedTreasury = (cost * 1500) / 10000; // 15%
        uint256 expectedUbi      = cost - expectedTreasury;

        vm.prank(player);
        registry.unlockHabitat(6);

        assertEq(gToken.balanceOf(ubiPool),  expectedUbi);
        assertEq(gToken.balanceOf(treasury), expectedTreasury);
        assertEq(gToken.balanceOf(player),   100_000 ether - cost);
        assertTrue(registry.ownsHabitat(player, 6));
        assertEq(registry.playerUbiDonated(player), expectedUbi);
        assertEq(registry.totalCommunityContribution(), expectedUbi);
    }

    function test_unlock_emits_event() public {
        uint256 cost = registry.tierCost(7);
        uint256 expectedTreasury = (cost * 1500) / 10000;
        uint256 expectedUbi      = cost - expectedTreasury;

        vm.expectEmit(true, true, false, true);
        emit HabitatUnlocked(player, 7, cost, expectedUbi, expectedTreasury);

        vm.prank(player);
        registry.unlockHabitat(7);
    }

    function test_unlock_higher_tier_directly() public {
        // Player buys tier 10 without owning lower tiers — allowed
        vm.prank(player);
        registry.unlockHabitat(10);

        assertTrue(registry.ownsHabitat(player, 10));
        assertFalse(registry.ownsHabitat(player, 6));
        assertFalse(registry.ownsHabitat(player, 9));
    }

    function test_unlock_multiple_tiers_accumulate_donation() public {
        vm.startPrank(player);
        registry.unlockHabitat(6);  // 300
        registry.unlockHabitat(7);  // 1,000
        registry.unlockHabitat(8);  // 3,000
        vm.stopPrank();

        uint256 totalCost = 4_300 ether;
        uint256 expectedUbi = totalCost - (totalCost * 1500) / 10000;
        // Note: per-tier rounding, so compute per-call sum
        uint256 ubi6 = 300 ether - (300 ether * 1500) / 10000;
        uint256 ubi7 = 1_000 ether - (1_000 ether * 1500) / 10000;
        uint256 ubi8 = 3_000 ether - (3_000 ether * 1500) / 10000;
        assertEq(registry.playerUbiDonated(player), ubi6 + ubi7 + ubi8);
        assertEq(registry.totalCommunityContribution(), ubi6 + ubi7 + ubi8);
        // Sanity check: same as the cleaner sum
        assertEq(ubi6 + ubi7 + ubi8, expectedUbi);
    }

    // ── Unlock guards ────────────────────────────────────────────────────────
    function test_unlock_invalid_low_tier_reverts() public {
        vm.prank(player);
        vm.expectRevert("Invalid tier");
        registry.unlockHabitat(5);
    }

    function test_unlock_disabled_tier_reverts() public {
        vm.prank(player);
        vm.expectRevert("Tier disabled");
        registry.unlockHabitat(11); // not configured
    }

    function test_unlock_double_unlock_reverts() public {
        vm.startPrank(player);
        registry.unlockHabitat(6);
        vm.expectRevert("Already owned");
        registry.unlockHabitat(6);
        vm.stopPrank();
    }

    function test_unlock_without_balance_reverts() public {
        address poorPlayer = address(0xD00D);
        vm.prank(poorPlayer);
        gToken.approve(address(registry), type(uint256).max);

        vm.prank(poorPlayer);
        vm.expectRevert(); // ERC20 transfer fails
        registry.unlockHabitat(6);
    }

    function test_unlock_without_approval_reverts() public {
        address newPlayer = address(0xE0E);
        gToken.mint(newPlayer, 1_000 ether);

        vm.prank(newPlayer);
        vm.expectRevert(); // ERC20 transfer fails (no approval)
        registry.unlockHabitat(6);
    }

    // ── Pause ────────────────────────────────────────────────────────────────
    function test_pause_blocks_unlock() public {
        vm.prank(owner);
        registry.pause();

        vm.prank(player);
        vm.expectRevert("Pausable: paused");
        registry.unlockHabitat(6);
    }

    function test_unpause_restores_unlock() public {
        vm.prank(owner);
        registry.pause();
        vm.prank(owner);
        registry.unpause();

        vm.prank(player);
        registry.unlockHabitat(6);
        assertTrue(registry.ownsHabitat(player, 6));
    }

    function test_pause_only_owner() public {
        vm.prank(player);
        vm.expectRevert("Ownable: caller is not the owner");
        registry.pause();
    }

    // ── Admin: setTierCost ───────────────────────────────────────────────────
    function test_set_tier_cost_adds_new_tier() public {
        vm.prank(owner);
        registry.setTierCost(11, 100_000 ether);

        gToken.mint(player, 100_000 ether);
        vm.prank(player);
        registry.unlockHabitat(11);
        assertTrue(registry.ownsHabitat(player, 11));
    }

    function test_set_tier_cost_to_zero_disables() public {
        vm.prank(owner);
        registry.setTierCost(6, 0);

        vm.prank(player);
        vm.expectRevert("Tier disabled");
        registry.unlockHabitat(6);
    }

    function test_set_tier_cost_only_owner() public {
        vm.prank(player);
        vm.expectRevert("Ownable: caller is not the owner");
        registry.setTierCost(6, 500 ether);
    }

    function test_set_tier_cost_invalid_tier_reverts() public {
        vm.prank(owner);
        vm.expectRevert("Invalid tier");
        registry.setTierCost(5, 100 ether);
    }

    // ── Admin: setSplit ──────────────────────────────────────────────────────
    function test_set_split_updates_distribution() public {
        vm.prank(owner);
        registry.setSplit(9000, 1000); // 90% UBI, 10% treasury

        uint256 cost = registry.tierCost(6);
        uint256 expectedTreasury = (cost * 1000) / 10000;
        uint256 expectedUbi      = cost - expectedTreasury;

        vm.prank(player);
        registry.unlockHabitat(6);

        assertEq(gToken.balanceOf(ubiPool),  expectedUbi);
        assertEq(gToken.balanceOf(treasury), expectedTreasury);
    }

    function test_set_split_must_sum_to_10000() public {
        vm.prank(owner);
        vm.expectRevert("Must sum to 10000");
        registry.setSplit(8000, 1000);
    }

    function test_set_split_full_to_ubi() public {
        vm.prank(owner);
        registry.setSplit(10000, 0);

        uint256 cost = registry.tierCost(6);
        vm.prank(player);
        registry.unlockHabitat(6);

        assertEq(gToken.balanceOf(ubiPool),  cost);
        assertEq(gToken.balanceOf(treasury), 0);
    }

    // ── Admin: setUbiPool / setTreasury ──────────────────────────────────────
    function test_set_ubi_pool_routes_to_new_address() public {
        address newPool = address(0xDEED);

        vm.prank(owner);
        registry.setUbiPool(newPool);
        assertEq(registry.ubiPool(), newPool);

        vm.prank(player);
        registry.unlockHabitat(6);
        assertGt(gToken.balanceOf(newPool), 0);
        assertEq(gToken.balanceOf(ubiPool), 0);
    }

    function test_set_treasury_routes_to_new_address() public {
        address newTreasury = address(0xBEEF);

        vm.prank(owner);
        registry.setTreasury(newTreasury);

        vm.prank(player);
        registry.unlockHabitat(6);
        assertGt(gToken.balanceOf(newTreasury), 0);
        assertEq(gToken.balanceOf(treasury), 0);
    }

    function test_set_ubi_pool_zero_reverts() public {
        vm.prank(owner);
        vm.expectRevert("Zero address");
        registry.setUbiPool(address(0));
    }

    function test_set_treasury_zero_reverts() public {
        vm.prank(owner);
        vm.expectRevert("Zero address");
        registry.setTreasury(address(0));
    }

    // ── Recovery ─────────────────────────────────────────────────────────────
    function test_recover_token_blocks_g_dollar() public {
        vm.prank(owner);
        vm.expectRevert("Cannot recover G$");
        registry.recoverToken(IERC20(address(gToken)), owner, 1 ether);
    }

    function test_recover_token_works_for_other_tokens() public {
        MockGoodDollar otherToken = new MockGoodDollar();
        otherToken.mint(address(registry), 100 ether);

        vm.prank(owner);
        registry.recoverToken(IERC20(address(otherToken)), owner, 100 ether);
        assertEq(otherToken.balanceOf(owner), 100 ether);
    }

    function test_recover_token_zero_to_reverts() public {
        MockGoodDollar otherToken = new MockGoodDollar();
        vm.prank(owner);
        vm.expectRevert("Zero address");
        registry.recoverToken(IERC20(address(otherToken)), address(0), 1 ether);
    }

    // ── Contract holds zero G$ invariant ─────────────────────────────────────
    function test_contract_never_holds_g_dollar() public {
        vm.startPrank(player);
        registry.unlockHabitat(6);
        registry.unlockHabitat(7);
        registry.unlockHabitat(10);
        vm.stopPrank();

        // After multiple unlocks, contract balance must still be zero
        assertEq(gToken.balanceOf(address(registry)), 0);
    }

    // ── Multiple players don't interfere ─────────────────────────────────────
    function test_multiple_players_independent_ownership() public {
        vm.prank(player);
        registry.unlockHabitat(6);

        vm.prank(player2);
        registry.unlockHabitat(8);

        assertTrue(registry.ownsHabitat(player, 6));
        assertFalse(registry.ownsHabitat(player, 8));
        assertTrue(registry.ownsHabitat(player2, 8));
        assertFalse(registry.ownsHabitat(player2, 6));
    }
}
