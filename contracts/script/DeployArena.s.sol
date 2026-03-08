// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArenaPlatform.sol";
import "../src/GameCurrency.sol";

contract DeployArenaScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Arena contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Tokens (Gold & Diamond)
        console.log("\n1. Deploying GoldToken...");
        GoldToken goldToken = new GoldToken();
        console.log("GoldToken deployed at:", address(goldToken));

        console.log("\n2. Deploying DiamondToken...");
        DiamondToken diamondToken = new DiamondToken();
        console.log("DiamondToken deployed at:", address(diamondToken));

        // 2. Deploy ArenaPlatform
        console.log("\n3. Deploying ArenaPlatform...");
        address treasury = deployer; // Use deployer as treasury
        ArenaPlatform arena = new ArenaPlatform(treasury, address(0));
        console.log("ArenaPlatform deployed at:", address(arena));
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n========================================");
        console.log("ARENA DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("Network: Monad Testnet");
        console.log("Deployer:", deployer);
        console.log("GoldToken:", address(goldToken));
        console.log("DiamondToken:", address(diamondToken));
        console.log("ArenaPlatform:", address(arena));
        console.log("Treasury:", treasury);
        console.log("========================================");
    }
}
