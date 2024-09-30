const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")
const { generateString, generateNationality, generateVotingDays, generateRandomWallet, generateVote, stringToBytes32 } = require("../../helper-functions")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

const fs = require('fs')

// Set prices for a given day on ETHEUR and LINKEUR
const ETHEUR = 2404.36
const LINKEUR = 10.28
const logPath = 'test/devos/results/Scalability.spec.csv'

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
    : describe("# Scalability tests on devos system", async function () {
        async function deploySystemFixture() {
            const [deployer] = await ethers.getSigners()
            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(deployer).deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(deployer).deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]

            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosVoterArchive = await DevosVoterArchiveFactory
                .connect(deployer)
                .deploy(mockOracle.address, linkToken.address, jobId, fee)

            const fundAmount = networkConfig[chainId]["fundAmount"] || "1000000000000000000"
            await linkToken.connect(deployer).transfer(DevosVoterArchive.address, fundAmount)

            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotArchive = await DevosBallotArchiveFactory
                .connect(deployer)
                .deploy()

                const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")
                const DevosBallot = await DevosBallotFactory
                    .connect(deployer)
                    .deploy(
                        DevosBallotArchive.address,
                        DevosVoterArchive.address,
                        "My title",
                        "My metainformation",
                        "Austria",
                        7
                    )

            return { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee }
        }


        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        it("Deploy random contract (10x)", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot, mockOracle, linkToken, jobId, fee } = await loadFixture(deploySystemFixture);
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            const wallets = [];
            const cases = 10;
            for (let i = 0; i < cases; i++) {
                let wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                wallets.push(wallet)
            }

            let startEth, endEth;
            let startLink, endLink;
            let costEth, costLink;
            let startTime, endTime, totalTime;
            let contractAddress;

            for (let i = 0; i < cases; i++) {
                let rand = Math.random() * 5 | 0;
                switch (rand) {
                    case 0:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotArchiveFactory
                            .connect(wallets[i])
                            .deploy()
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("ArchiveCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 1:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosVoterArchiveFactory
                            .connect(wallets[i])
                            .deploy(mockOracle.address, linkToken.address, jobId, fee)
                        endTime = performance.now();

                        endEth = await wallets[i].getBalance()

                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0

                        expect(contractAddress).to.not.be.null;
                        writeLog("RegistrarCreation", i, 1, totalTime, costEth, costLink)

                        break;
                    case 2:
                        startEth = await wallets[i].getBalance()

                        startTime = performance.now();
                        contractAddress = await DevosBallotFactory
                            .connect(wallets[i])
                            .deploy(
                                DevosBallotArchive.address,
                                DevosVoterArchive.address,
                                "My title",
                                "My metainformation",
                                "Austria",
                                7
                            )
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
        
                        totalTime = ((endTime - startTime) / 10 ** 3);
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = 0
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotCreation", i, 1, totalTime, costEth, costLink)
                        break;
                    case 3:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
        
                        startTime = performance.now();
        
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
        
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18

                        expect(getNationality).equal(mockResponse);
                        writeLog("VoterCheck", i, 1, totalTime, costEth, costLink)
                    break;
                    case 4:
                        startEth = await wallets[i].getBalance()
                        startLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        transaction = await DevosVoterArchive.connect(wallets[i]).requestNationalityData(wallets[i].address)
                        transactionReceipt = await transaction.wait(1)
                        requestId = transactionReceipt.events[0].topics[1]
                        mockResponse = 'Austria'
                        mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                        expect(mockOracleResponse).to.not.be.null
        
                        await DevosVoterArchive.DEBUG_setNationalityData(wallets[i].address, mockResponse);
                        getNationality = await DevosVoterArchive.getNationalityData(wallets[i].address)
                        expect(getNationality).equal(mockResponse);
        
                        startTime = performance.now();
                        contractAddress = await DevosBallot
                            .connect(wallets[i])
                            .callVote(1);
                        endTime = performance.now();
        
                        endEth = await wallets[i].getBalance()
                        endLink = await linkToken.balanceOf(DevosVoterArchive.address)
                        totalTime = (endTime - startTime) / 10 ** 3;
        
                        costEth = (startEth - endEth) / 10 ** 18
                        costLink = (startLink - endLink) / 10 ** 18
        
                        expect(contractAddress).to.not.be.null;
                        writeLog("BallotVoting", i, 1, totalTime, costEth, costLink)
                    
                        break;
                    default:
                }
            }
        })
        

    })