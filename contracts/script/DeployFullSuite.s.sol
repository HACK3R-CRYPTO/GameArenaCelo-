// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/WinnerBadge.sol";
import "../src/GameCurrency.sol";
import "../src/GameAssets.sol";
import "../src/TournamentPlatform.sol";
import "../src/GameLottery.sol";
import "../src/ArcadePlatform.sol";
import "../src/ArenaPlatform.sol";

contract DeployFullSuiteScript is Script {
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying full contract suite with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Tokens
        console.log("\n1. Deploying GoldToken...");
        GoldToken goldToken = new GoldToken();
        console.log("GoldToken deployed at:", address(goldToken));

        console.log("\n2. Deploying DiamondToken...");
        DiamondToken diamondToken = new DiamondToken();
        console.log("DiamondToken deployed at:", address(diamondToken));

        // 2. Deploy Game Assets (ERC1155)
        console.log("\n3. Deploying GameAssets...");
        GameAssets gameAssets = new GameAssets();
        console.log("GameAssets deployed at:", address(gameAssets));

        // 3. Deploy WinnerBadge (ERC721)
        console.log("\n4. Deploying WinnerBadge...");
        WinnerBadge winnerBadge = new WinnerBadge();
        console.log("WinnerBadge deployed at:", address(winnerBadge));
        
        // 4. Deploy TournamentPlatform
        console.log("\n5. Deploying TournamentPlatform...");
        address treasury = deployer; // Use deployer as treasury
        TournamentPlatform platform = new TournamentPlatform(
            treasury,
            address(winnerBadge),
            address(goldToken),
            address(diamondToken)
        );
        console.log("TournamentPlatform deployed at:", address(platform));
        
        // 5. Deploy GameLottery
        console.log("\n6. Deploying GameLottery...");
        GameLottery lottery = new GameLottery(
            address(diamondToken),
            address(goldToken),
            address(gameAssets),
            treasury
        );
        console.log("GameLottery deployed at:", address(lottery));

        // 6. Deploy ArcadePlatform
        console.log("\n7. Deploying ArcadePlatform...");
        ArcadePlatform arcade = new ArcadePlatform();
        console.log("ArcadePlatform deployed at:", address(arcade));

        // 7. Deploy ArenaPlatform
        console.log("\n8. Deploying ArenaPlatform...");
        ArenaPlatform arena = new ArenaPlatform(treasury, address(0));
        console.log("ArenaPlatform deployed at:", address(arena));

        // 8. Setup Permissions
        console.log("\n9. Setting up permissions...");
        
        // TournamentPlatform needs to mint Badges, Gold, and Diamonds
        winnerBadge.authorizeMinter(address(platform));
        goldToken.addMinter(address(platform));
        diamondToken.addMinter(address(platform));
        
        // GameLottery needs to mint Gold, Diamonds, and Assets
        goldToken.addMinter(address(lottery));
        diamondToken.addMinter(address(lottery));
        gameAssets.addMinter(address(lottery));

        console.log("Permissions configured successfully");
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n========================================");
        console.log("FULL SUITE DEPLOYMENT SUMMARY (MONAD TESTNET)");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("GoldToken:", address(goldToken));
        console.log("DiamondToken:", address(diamondToken));
        console.log("GameAssets:", address(gameAssets));
        console.log("WinnerBadge:", address(winnerBadge));
        console.log("TournamentPlatform:", address(platform));
        console.log("GameLottery:", address(lottery));
        console.log("ArcadePlatform:", address(arcade));
        console.log("ArenaPlatform:", address(arena));
        console.log("Treasury:", treasury);
        console.log("========================================");
    }
}
