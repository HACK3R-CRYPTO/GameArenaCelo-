// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArenaPlatform.sol";

contract DeployArenaOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = 0x56717540445F1B6727266935261f8bf63065DF60; // Corrected checksum

        vm.startBroadcast(deployerPrivateKey);

        ArenaPlatform arena = new ArenaPlatform(treasury, address(0));
        console.log("ArenaPlatform deployed at:", address(arena));

        vm.stopBroadcast();
    }
}
