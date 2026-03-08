// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArenaPlatform.sol";

contract DeployArena is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        ArenaPlatform platform = new ArenaPlatform(treasury, address(0));
        console.log("ArenaPlatform deployed to:", address(platform));

        vm.stopBroadcast();
    }
}
