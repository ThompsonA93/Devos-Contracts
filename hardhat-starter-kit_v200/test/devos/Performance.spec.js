const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")
const { generateString, generateNationality, generateVotingDays, generateRandomWallet, generateVote, stringToBytes32 } = require("../../helper-functions")

const fs = require('fs')

// Set prices for a given day on ETHEUR and LINKEUR
const ETHEUR = 2404.36
const LINKEUR = 10.28
const logPath = 'test/devos/results/Performance.spec.csv'

// Writes to CSV
const writeLog = (testcase, voters, ballots, requiredTime, costEth, costLink) => {
    if (fs.existsSync(logPath)) {
        // Ignore for now
    } else {
        console.log("\t! Logfile not found. Setup of CSV-Structure.")
        fs.writeFile(
            logPath,
            "testcase,voters,ballots,totalTime,totalEth,totalLink,costEUR\n",
            (err) => { if (err) throw err; }
        )
    }

    let costInEur = costEth * ETHEUR + costLink * LINKEUR

    record = testcase + "," + voters + "," + ballots + ","                                   // Data category
        + requiredTime.toFixed(5) + "," + costEth.toFixed(5) + "," + costLink.toFixed(5) + ","                             // Data during execution
        + costInEur.toFixed(5) + "\n"   // Aggregated post execution

    fs.appendFile(
        logPath,
        record,
        (err) => { if (err) throw err; }
    )
}


!developmentChains.includes(network.name)
    ? describe.skip
    : describe("# Performance tests on devos system", async function () {
        beforeEach(async function () {
            await hre.network.provider.send("hardhat_reset")
        })


        it("Deploy Archives (100x)", async function () {
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")

            const wallets = [];
            const cases = 100;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            for (let i = 0; i < cases; i++) {
                let startEth = await wallets[i].getBalance()

                let startTime = performance.now();
                let contractAddress = await DevosBallotArchiveFactory
                    .connect(wallets[i])
                    .deploy()
                let endTime = performance.now();

                let endEth = await wallets[i].getBalance()

                let totalTime = ((endTime - startTime) / 10 ** 3);
                let costEth = (startEth - endEth) / 10 ** 18
                let costLink = 0

                expect(contractAddress).to.not.be.null;
                writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)
            }
        })

        it("Deploy Registrar (100x)", async function () {
            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")

            const wallets = [];
            const cases = 100;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            for (let i = 0; i < cases; i++) {
                let startEth = await wallets[i].getBalance()

                let startTime = performance.now();
                let contractAddress = await DevosVoterArchiveFactory
                    .connect(wallets[i])
                    .deploy(mockOracle.address, linkToken.address, jobId, fee)
                let endTime = performance.now();

                let endEth = await wallets[i].getBalance()

                let totalTime = ((endTime - startTime) / 10 ** 3);
                let costEth = (startEth - endEth) / 10 ** 18
                let costLink = 0

                expect(contractAddress).to.not.be.null;
                writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)
            }
        })

        it("Deploy Ballot (100x)", async function () {
            const [owner] = await ethers.getSigners()

            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotArchive = await DevosBallotArchiveFactory
                .connect(owner)
                .deploy()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(owner).deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(owner).deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]

            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosVoterArchive = await DevosVoterArchiveFactory
                .connect(owner)
                .deploy(mockOracle.address, linkToken.address, jobId, fee)

            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 100;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            for (let i = 0; i < cases; i++) {
                let startEth = await wallets[i].getBalance()

                let startTime = performance.now();
                let contractAddress = await DevosBallotFactory
                    .connect(wallets[i])
                    .deploy(
                        DevosBallotArchive.address,
                        DevosVoterArchive.address,
                        "My title",
                        "My metainformation",
                        "Austria",
                        7
                    )
                let endTime = performance.now();

                let endEth = await wallets[i].getBalance()

                let totalTime = ((endTime - startTime) / 10 ** 3);
                let costEth = (startEth - endEth) / 10 ** 18
                let costLink = 0

                expect(contractAddress).to.not.be.null;
                writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
            }
        })

        it("Verify Voter (100x)", async function () {
            const [owner] = await ethers.getSigners()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(owner).deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(owner).deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosVoterArchive = await DevosVoterArchiveFactory
                .connect(owner)
                .deploy(mockOracle.address, linkToken.address, jobId, fee)

            const fundAmount = "1000000000000000000000" // 10**21
            await linkToken.connect(owner).transfer(DevosVoterArchive.address, fundAmount)


            const wallets = [];
            const cases = 100;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            for (let i = 0; i < cases; i++) {
                let startEth = await wallets[i].getBalance()
                let startLink = await linkToken.balanceOf(DevosVoterArchive.address)

                let startTime = performance.now();

                const transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                const transactionReceipt = await transaction.wait(1)
                const requestId = transactionReceipt.events[0].topics[1]
                const mockResponse = 'Austria'
                const mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                expect(mockOracleResponse).to.not.be.null

                await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                const getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                expect(getNationality).equal(mockResponse);

                let endTime = performance.now();

                let endEth = await wallets[i].getBalance()
                let endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                let totalTime = (endTime - startTime) / 10 ** 3;

                let costEth = (startEth - endEth) / 10 ** 18
                let costLink = (startLink - endLink) / 10 ** 18

                writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
            }
        })

        it("Vote (100x)", async function () {
            const [owner] = await ethers.getSigners()

            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotArchive = await DevosBallotArchiveFactory
                .connect(owner)
                .deploy()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(owner).deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(owner).deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosVoterArchive = await DevosVoterArchiveFactory
                .connect(owner)
                .deploy(mockOracle.address, linkToken.address, jobId, fee)

            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")
            const DevosBallot = await DevosBallotFactory
                .connect(owner)
                .deploy(
                    DevosBallotArchive.address,
                    DevosVoterArchive.address,
                    "My title",
                    "My metainformation",
                    "Austria",
                    7
                )

            const fundAmount = "1000000000000000000000" // 10**21
            await linkToken.connect(owner).transfer(DevosVoterArchive.address, fundAmount)

            const wallets = [];
            const cases = 100;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            for (let i = 0; i < cases; i++) {
                let startEth = await wallets[i].getBalance()
                let startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                const transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                const transactionReceipt = await transaction.wait(1)
                const requestId = transactionReceipt.events[0].topics[1]
                const mockResponse = 'Austria'
                const mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                expect(mockOracleResponse).to.not.be.null

                await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                const getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                expect(getNationality).equal(mockResponse);

                let startTime = performance.now();
                let contractAddress = await DevosBallot
                    .connect(wallets[i])
                    .callVote(1);
                let endTime = performance.now();

                let endEth = await wallets[i].getBalance()
                let endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                let totalTime = (endTime - startTime) / 10 ** 3;

                let costEth = (startEth - endEth) / 10 ** 18
                let costLink = (startLink - endLink) / 10 ** 18

                expect(contractAddress).to.not.be.null;
                writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
            }
        })
    })