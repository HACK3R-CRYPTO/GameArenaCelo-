// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ArenaPlatform
 * @dev 1v1 Wagering platform for AI Agents and Players using GoodDollar (G$) Token
 */
contract ArenaPlatform is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum MatchStatus {
        Proposed,
        Accepted,
        Completed,
        Cancelled
    }
    enum GameType {
        RockPaperScissors,
        DiceRoll,
        StrategyBattle,
        CoinFlip,
        TicTacToe
    }

    struct Match {
        uint256 id;
        address challenger;
        address opponent; // address(0) for open challenges
        uint256 wager;
        GameType gameType;
        MatchStatus status;
        address winner;
        uint256 createdAt;
    }

    uint256 public matchCounter;
    uint256 public platformFeePercent = 2; // 2% fee goes to GoodCollective UBI Pool
    address public platformTreasury;
    IERC20 public wagerToken; // The G$ Token

    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public playerMatches;
    // Map matchId -> player -> move (0-255)
    mapping(uint256 => mapping(address => uint8)) public playerMoves;
    // Map matchId -> player -> hasPlayed (to distinguish move 0)
    mapping(uint256 => mapping(address => bool)) public hasPlayed;

    event MatchProposed(
        uint256 indexed matchId,
        address indexed challenger,
        address indexed opponent,
        uint256 wager,
        GameType gameType
    );
    event MatchAccepted(uint256 indexed matchId, address indexed opponent);
    event MatchCompleted(
        uint256 indexed matchId,
        address indexed winner,
        uint256 prize
    );
    event MatchCancelled(uint256 indexed matchId);
    event MovePlayed(
        uint256 indexed matchId,
        address indexed player,
        uint8 move
    );

    constructor(address _treasury, address _wagerToken) Ownable() {
        platformTreasury = _treasury;
        wagerToken = IERC20(_wagerToken);
    }

    /**
     * @dev ERC-677 Receiver Hook for "1-Click" Deposits
     * Supports proposing and accepting matches without requiring a separate approve tx.
     * `data` format:
     * - Propose: abi.encode(uint8(0), opponent, gameType)
     * - Accept: abi.encode(uint8(1), matchId)
     */
    function onTokenTransfer(
        address sender,
        uint256 value,
        bytes calldata data
    ) external nonReentrant returns (bool) {
        require(msg.sender == address(wagerToken), "Only wager token allowed");
        require(data.length >= 32, "Invalid data length");

        uint8 actionType = abi.decode(data[:32], (uint8));

        if (actionType == 0) {
            // Propose Match
            (, address opponent, GameType gameType) = abi.decode(
                data,
                (uint8, address, GameType)
            );
            _proposeMatch(sender, opponent, gameType, value);
        } else if (actionType == 1) {
            // Accept Match
            (, uint256 matchId) = abi.decode(data, (uint8, uint256));
            _acceptMatch(sender, matchId, value);
        } else {
            revert("Invalid action type");
        }
        return true;
    }

    /**
     * @dev Standard ERC-20 Propose Match (Requires prior approval)
     */
    function proposeMatch(
        address _opponent,
        GameType _gameType,
        uint256 _wager
    ) external nonReentrant returns (uint256) {
        require(_wager > 0, "Wager must be > 0");
        wagerToken.safeTransferFrom(msg.sender, address(this), _wager);
        return _proposeMatch(msg.sender, _opponent, _gameType, _wager);
    }

    /**
     * @dev Standard ERC-20 Accept Match (Requires prior approval)
     */
    function acceptMatch(uint256 _matchId) external nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Proposed, "Match not available");
        wagerToken.safeTransferFrom(msg.sender, address(this), m.wager);
        _acceptMatch(msg.sender, _matchId, m.wager);
    }

    function playMove(uint256 _matchId, uint8 _move) external nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Accepted, "Match not active");
        require(
            msg.sender == m.challenger || msg.sender == m.opponent,
            "Not in match"
        );

        if (m.gameType == GameType.RockPaperScissors) {
            require(_move < 3, "Invalid RPS move");
        } else if (m.gameType == GameType.DiceRoll) {
            require(_move >= 1 && _move <= 6, "Invalid Dice move");
        } else if (m.gameType == GameType.StrategyBattle) {
            require(_move < 10, "Invalid Strategy move");
        } else if (m.gameType == GameType.CoinFlip) {
            require(_move < 2, "Invalid CoinFlip move");
        } else if (m.gameType == GameType.TicTacToe) {
            require(_move < 9, "Invalid TicTacToe move");
        }

        playerMoves[_matchId][msg.sender] = _move;
        hasPlayed[_matchId][msg.sender] = true;

        emit MovePlayed(_matchId, msg.sender, _move);
    }

    // In a real scenario, this would be called by a trusted referee or via ZK proofs
    // For the hackathon, we allow the owner or a designated referee to resolve
    function resolveMatch(
        uint256 _matchId,
        address _winner
    ) external onlyOwner nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Accepted, "Match not in progress");
        require(
            _winner == m.challenger || _winner == m.opponent,
            "Invalid winner"
        );

        uint256 totalPool = m.wager * 2;
        uint256 fee = (totalPool * platformFeePercent) / 100;
        uint256 prize = totalPool - fee;

        m.winner = _winner;
        m.status = MatchStatus.Completed;

        // Route UBI fee to GoodCollective Pool
        wagerToken.safeTransfer(platformTreasury, fee);

        // Route prize to winner
        wagerToken.safeTransfer(_winner, prize);

        emit MatchCompleted(_matchId, _winner, prize);
    }

    function cancelMatch(uint256 _matchId) external nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Proposed, "Cannot cancel");
        require(m.challenger == msg.sender, "Only challenger can cancel");

        m.status = MatchStatus.Cancelled;
        wagerToken.safeTransfer(m.challenger, m.wager);

        emit MatchCancelled(_matchId);
    }

    function getPlayerMatches(
        address _player
    ) external view returns (uint256[] memory) {
        return playerMatches[_player];
    }

    // --- Internal Logic ---

    function _proposeMatch(
        address _challenger,
        address _opponent,
        GameType _gameType,
        uint256 _wager
    ) internal returns (uint256) {
        require(_wager > 0, "Wager must be > 0");

        uint256 matchId = matchCounter++;
        matches[matchId] = Match({
            id: matchId,
            challenger: _challenger,
            opponent: _opponent,
            wager: _wager,
            gameType: _gameType,
            status: MatchStatus.Proposed,
            winner: address(0),
            createdAt: block.timestamp
        });

        playerMatches[_challenger].push(matchId);
        if (_opponent != address(0)) {
            playerMatches[_opponent].push(matchId);
        }

        emit MatchProposed(matchId, _challenger, _opponent, _wager, _gameType);
        return matchId;
    }

    function _acceptMatch(
        address _acceptor,
        uint256 _matchId,
        uint256 _wagerAmount
    ) internal {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Proposed, "Match not available");
        require(
            m.opponent == address(0) || m.opponent == _acceptor,
            "Not your match"
        );
        require(_wagerAmount == m.wager, "Must match wager amount");

        m.opponent = _acceptor;
        m.status = MatchStatus.Accepted;

        // If it was an open challenge, add it to the acceptor's list
        bool alreadyInList = false;
        for (uint i = 0; i < playerMatches[_acceptor].length; i++) {
            if (playerMatches[_acceptor][i] == _matchId) {
                alreadyInList = true;
                break;
            }
        }
        if (!alreadyInList) {
            playerMatches[_acceptor].push(_matchId);
        }

        emit MatchAccepted(_matchId, _acceptor);
    }
}
