// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ArenaPlatform} from "../src/ArenaPlatform.sol";

contract DeployCelo is Script {
    function run() external returns (ArenaPlatform) {
        // Cyfrin Method: We do NOT hardcode or load plain-text private keys.
        // We broadcast using vm.startBroadcast() and will pass `--account <wallet_name>`
        // when running the script via CLI to use an encrypted keystore.
        vm.startBroadcast();

        // GoodDollar G$ Token address on Celo Mainnet
        address gTokenAddress = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

        // Treasury address (GoodCollective Pool or Platform Owner for fee routing)
        // Setting it to msg.sender for initial deployment
        address treasury = msg.sender;

        ArenaPlatform arenaPlatform = new ArenaPlatform(
            treasury,
            gTokenAddress
        );

        vm.stopBroadcast();
        return arenaPlatform;
    }
}
