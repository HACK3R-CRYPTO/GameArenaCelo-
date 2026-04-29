// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title HabitatRegistry
 * @dev Records on-chain which paid habitat tiers a player has unlocked. The
 *      habitat art lives in the frontend; this contract just gates access by
 *      requiring a G$ donation. The donation splits in one transaction:
 *        ubiBps      → GoodCollective UBI pool   (default 85%)
 *        treasuryBps → GameArena treasury        (default 15%)
 *      The contract never holds G$.
 *
 *      Free habitat tiers (1-5) are level-based and tracked off-chain.
 *      Only paid tiers (>= FIRST_PAID_TIER) are recorded here.
 *
 *      Default tiers (G$ amounts use 18 decimals):
 *        6  Celestial Arena       300 G$
 *        7  Mystic Garden       1,000 G$
 *        8  Astral Realm        3,000 G$
 *        9  Cosmic Throne      10,000 G$
 *       10  Eternal Sanctuary  30,000 G$
 *
 *      New tiers can be added later by calling setTierCost(); no upgrade
 *      needed. Players may unlock any tier directly without owning lower ones.
 *      Unlock timestamps and history are available off-chain via the
 *      HabitatUnlocked event.
 */
contract HabitatRegistry is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ── Constants ────────────────────────────────────────────────────────────
    uint8   public constant FIRST_PAID_TIER = 6;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // ── State ────────────────────────────────────────────────────────────────
    IERC20  public immutable gToken;        // GoodDollar G$ on Celo
    address public ubiPool;                  // GoodCollective UBI pool
    address public treasury;                 // GameArena treasury

    uint256 public ubiBps      = 8_500;     // 85% to UBI
    uint256 public treasuryBps = 1_500;     // 15% to treasury

    mapping(uint8 => uint256) public tierCost;                           // tier => G$ cost
    mapping(address => mapping(uint8 => bool)) public ownedTiers;        // player => tier => owned
    mapping(address => uint256) public playerUbiDonated;                 // per-player UBI portion only
    uint256 public totalCommunityContribution;                           // aggregate UBI portion

    // ── Events ───────────────────────────────────────────────────────────────
    event HabitatUnlocked(
        address indexed player,
        uint8   indexed tier,
        uint256 totalPaid,
        uint256 ubiAmount,
        uint256 treasuryAmount
    );
    event UbiPoolChanged(address indexed oldPool, address indexed newPool);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);
    event SplitChanged(uint256 oldUbiBps, uint256 newUbiBps, uint256 oldTreasuryBps, uint256 newTreasuryBps);
    event TierCostUpdated(uint8 indexed tier, uint256 oldCost, uint256 newCost);

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address _gToken, address _ubiPool, address _treasury) {
        require(_gToken   != address(0), "G$ address zero");
        require(_ubiPool  != address(0), "UBI pool zero");
        require(_treasury != address(0), "Treasury zero");
        gToken   = IERC20(_gToken);
        ubiPool  = _ubiPool;
        treasury = _treasury;

        tierCost[6]  =    300 ether;
        tierCost[7]  =  1_000 ether;
        tierCost[8]  =  3_000 ether;
        tierCost[9]  = 10_000 ether;
        tierCost[10] = 30_000 ether;
    }

    // ── Core ─────────────────────────────────────────────────────────────────
    /**
     * @notice Unlock a paid habitat tier. Splits G$ between UBI pool and
     *         treasury based on configured basis points.
     * @param tier Tier ID (>= FIRST_PAID_TIER, must have a configured cost).
     */
    function unlockHabitat(uint8 tier) external nonReentrant whenNotPaused {
        require(tier >= FIRST_PAID_TIER, "Invalid tier");
        uint256 cost = tierCost[tier];
        require(cost > 0, "Tier disabled");
        require(!ownedTiers[msg.sender][tier], "Already owned");

        // Treasury portion first; UBI takes the remainder so any rounding
        // always favors UBI, never the platform.
        uint256 treasuryAmount = (cost * treasuryBps) / BPS_DENOMINATOR;
        uint256 ubiAmount      = cost - treasuryAmount;

        gToken.safeTransferFrom(msg.sender, ubiPool, ubiAmount);
        if (treasuryAmount > 0) {
            gToken.safeTransferFrom(msg.sender, treasury, treasuryAmount);
        }

        ownedTiers[msg.sender][tier]  = true;
        playerUbiDonated[msg.sender] += ubiAmount;
        totalCommunityContribution  += ubiAmount;

        emit HabitatUnlocked(msg.sender, tier, cost, ubiAmount, treasuryAmount);
    }

    // ── Views ────────────────────────────────────────────────────────────────
    function ownsHabitat(address player, uint8 tier) external view returns (bool) {
        return ownedTiers[player][tier];
    }

    // ── Admin ────────────────────────────────────────────────────────────────
    function setUbiPool(address newPool) external onlyOwner {
        require(newPool != address(0), "Zero address");
        emit UbiPoolChanged(ubiPool, newPool);
        ubiPool = newPool;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Zero address");
        emit TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    /**
     * @notice Update the UBI/treasury split. Both values in basis points;
     *         must sum exactly to 10000.
     */
    function setSplit(uint256 newUbiBps, uint256 newTreasuryBps) external onlyOwner {
        require(newUbiBps + newTreasuryBps == BPS_DENOMINATOR, "Must sum to 10000");
        emit SplitChanged(ubiBps, newUbiBps, treasuryBps, newTreasuryBps);
        ubiBps      = newUbiBps;
        treasuryBps = newTreasuryBps;
    }

    /**
     * @notice Configure or disable a tier. Cost > 0 enables, 0 disables.
     */
    function setTierCost(uint8 tier, uint256 newCost) external onlyOwner {
        require(tier >= FIRST_PAID_TIER, "Invalid tier");
        emit TierCostUpdated(tier, tierCost[tier], newCost);
        tierCost[tier] = newCost;
    }

    function pause()   external onlyOwner { _pause();   }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Recover stray ERC20s sent here by mistake. G$ is excluded so
     *         the owner can never drain UBI flow.
     */
    function recoverToken(IERC20 token, address to, uint256 amount) external onlyOwner {
        require(address(token) != address(gToken), "Cannot recover G$");
        require(to != address(0), "Zero address");
        token.safeTransfer(to, amount);
    }
}
