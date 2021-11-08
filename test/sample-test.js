const {expect} = require("chai");
const {ethers, waffle} = require("hardhat");

describe("Test DiamondHands contract", function () {

    let diamondHands;
    let owner, newAddress;
    const numberOfYears = 2;
    const yearTime = 365 * 24 * 60 * 60;

    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        [owner, newAddress] = await ethers.getSigners();

        const DiamondHands = await ethers.getContractFactory("DiamondHands");
        diamondHands = await DiamondHands.deploy();
        await diamondHands.deployed();

    })

    it("Should add deposit to the mapping and emit event", async function () {
        let blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(owner.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 10);
    });

    it("Should add deposit to the mapping and let the user withdrawal them after numberOfYears", async function () {
        let blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(newAddress.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 10);

        await ethers.provider.send('evm_increaseTime', [numberOfYears * yearTime]);

        await expect(diamondHands.connect(newAddress).withdrawal({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Withdrawal")
            .withArgs(newAddress.address, BigInt(10 ** 18));
    });

    it("Should add deposit to the mapping and NOT let the user withdrawal them after less then numberOfYears", async function () {
        let blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(newAddress.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 10);

        await ethers.provider.send('evm_increaseTime', [numberOfYears * yearTime - 1]);

        await expect(diamondHands.connect(newAddress).withdrawal({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "WithdrawalFailed")
            .withArgs(newAddress.address, BigInt(10 ** 18), "Not enough amount deposited or enough time had passed to release the funds");
    });

    it("Should add deposit to the mapping and NOT let the user withdrawal them if the amount is bigger then what he deposited", async function () {
        let blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(newAddress.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 10);

        await ethers.provider.send('evm_increaseTime', [numberOfYears * yearTime]);

        await expect(diamondHands.connect(newAddress).withdrawal({
            value: ethers.utils.parseEther("2.0")
        })).to.emit(diamondHands, "WithdrawalFailed")
            .withArgs(newAddress.address, BigInt(2 * (10 ** 18)), "Not enough amount deposited or enough time had passed to release the funds");
    });

    it("Should not let address withdrawal if no deposit was made", async function () {
        let blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).withdrawal({
            value: ethers.utils.parseEther("2.0")
        })).to.emit(diamondHands, "WithdrawalFailed")
            .withArgs(newAddress.address, BigInt(2 * (10 ** 18)), "Not enough amount deposited or enough time had passed to release the funds");
    });

    it("Should add deposits to the mapping and let the user withdrawal them if the amount is bigger then what he deposited in total", async function () {
        let blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(newAddress.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 10);

        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(newAddress.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 20);

        await ethers.provider.send('evm_increaseTime', [numberOfYears * yearTime]);

        await expect(diamondHands.connect(newAddress).withdrawal({
            value: ethers.utils.parseEther("2.0")
        })).to.emit(diamondHands, "Withdrawal")
            .withArgs(newAddress.address, BigInt(2 * (10 ** 18)));
    });

    it("Should add deposits to the mapping and NOT let the user withdrawal them if the amount is bigger then what he deposited in total", async function () {
        let blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(newAddress.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 10);

        await ethers.provider.send('evm_increaseTime', [10]);

        await expect(diamondHands.connect(newAddress).deposit({
            value: ethers.utils.parseEther("1.0")
        })).to.emit(diamondHands, "Deposited")
            .withArgs(newAddress.address, BigInt(10 ** 18), blockBefore.timestamp + (numberOfYears * yearTime) + 20);

        await ethers.provider.send('evm_increaseTime', [numberOfYears * yearTime]);

        await expect(diamondHands.connect(newAddress).withdrawal({
            value: ethers.utils.parseEther("2.5")
        })).to.emit(diamondHands, "WithdrawalFailed")
            .withArgs(newAddress.address, BigInt(2.5 * (10 ** 18)), "Not enough amount deposited or enough time had passed to release the funds");
    });
});
