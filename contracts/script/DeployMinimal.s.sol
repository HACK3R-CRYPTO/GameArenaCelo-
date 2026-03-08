// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArenaPlatform.sol";

contract DeployMinimal is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        ArenaPlatform a = new ArenaPlatform(vm.addr(pk), address(0));
        console.log("DEPLOYED_ADDR:", address(a));
        vm.stopBroadcast();
    }
}
