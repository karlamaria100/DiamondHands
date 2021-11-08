//"SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract DiamondHands is Ownable {

    event Deposited(address indexed _from, uint256 _value, uint releaseTime);
    event Withdrawal(address indexed _to, uint _value);
    event WithdrawalFailed(address indexed _to, uint _value, string reason);

    struct Deposit {
        uint256 time;
        uint256 amount;
    }

    uint8 numberOfYears = 2;
    mapping(address => Deposit[]) private deposits;

    constructor() {
    }

    function setNumberOfYears(uint8 updateNumberOfYears) external onlyOwner {
        numberOfYears = updateNumberOfYears;
    }

    function getNumberOfYears() external view returns (uint8) {
        return numberOfYears;
    }

    function deposit() external payable {
        deposits[tx.origin].push(Deposit(block.timestamp, msg.value));
        emit Deposited(tx.origin, msg.value, block.timestamp + numberOfYears * 365 days);
    }

    function withdrawal() external payable {
        Deposit[] memory addressDeposits = deposits[tx.origin];
        uint256 availableAmount = 0;
        uint8 numberOfDepositsToBeUsed = 0;
        uint8[] memory depositsToBeUsed = new uint8[](addressDeposits.length + 1);

        for (uint8 i = 0; i < addressDeposits.length; i++) {
            //todo treat here the bisect years
            if (addressDeposits[i].time + numberOfYears * 365 days > block.timestamp) continue;

            if (addressDeposits[i].amount < msg.value) {
                availableAmount += addressDeposits[i].amount;
                depositsToBeUsed[numberOfDepositsToBeUsed++] = i;
                continue;
            }

            (bool success,) = tx.origin.call{value : msg.value}("");

            if (success && addressDeposits[i].amount == msg.value) {
                delete addressDeposits[i];
                emit Withdrawal(tx.origin, msg.value);
                return;
            } else if (success && addressDeposits[i].amount > msg.value) {
                addressDeposits[i].amount -= msg.value;
                emit Withdrawal(tx.origin, msg.value);
                return;
            } else {
                emit WithdrawalFailed(tx.origin, msg.value, "Sent to address call has not been successful");
                revert();
            }
        }

        if (availableAmount >= msg.value) {
            (bool success,) = tx.origin.call{value : msg.value}("");
            if (!success) {
                emit WithdrawalFailed(tx.origin, msg.value, "Sent to address call has not been successful");
                revert();
            }

            emit Withdrawal(tx.origin, msg.value);

            availableAmount = 0;
            uint256 remainingAmount = msg.value;
            for (uint8 i = 0; i < numberOfDepositsToBeUsed; i++) {
                if (remainingAmount == 0) return;

                uint256 currentAmount = addressDeposits[depositsToBeUsed[i]].amount;
                if (currentAmount <= remainingAmount) {
                    remainingAmount -= currentAmount;
                    delete addressDeposits[depositsToBeUsed[i]];
                } else {
                    remainingAmount = 0;
                    addressDeposits[depositsToBeUsed[i]].amount -= remainingAmount;
                }
            }
        } else {
            emit WithdrawalFailed(tx.origin, msg.value, "Not enough amount deposited or enough time had passed to release the funds");
        }
    }

    fallback() external {}

}

