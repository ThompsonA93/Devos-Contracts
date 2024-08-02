const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")
const { generateString, generateNationality, generateVotingDays, generateRandomWallet, generateVote } = require("../../helper-functions")

const fs = require('fs')

// Set prices for a given day on ETHEUR and LINKEUR
const ETHEUR = 2901.34
const LINKEUR = 11.93
const logPath = 'test/devos/results/Performance.spec.csv'

// Writes to CSV
const writeLog = (testcase, testcaseId, voters, ballots, requiredTime, costEth, costLink) => {
    if (fs.existsSync(logPath)) {
        // Ignore for now
    } else {
        console.log("\t! Logfile not found. Setup of CSV-Structure.")
        fs.writeFile(
            logPath,
            "testcase,testcaseId,voters,ballots,totalTime,totalEth,totalLink,TPS,cEth,cLink,costEUR\n",
            (err) => { if (err) throw err; }
        )
    }

    let tps = requiredTime / ballots;
    let cEth = costEth / voters;
    let cLink = costLink / voters;
    let costInEur = costEth * ETHEUR + costLink * LINKEUR

    record = testcase + "," + testcaseId + "," + voters + "," + ballots + ","                                   // Data category
        + requiredTime + "," + costEth.toFixed(5) + "," + costLink.toFixed(5) + ","                             // Data during execution
        + tps.toFixed(5) + "," + cEth + "," + cLink + "," + costInEur.toFixed(5) + "\n"   // Aggregated post execution

    fs.appendFile(
        logPath,
        record,
        (err) => { if (err) throw err; }
    )
}







// Beginning of Test-Suite
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("# System stress tests on ballot deployment", async function () {
        async function deployDevosSystemFixture() {
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

            return { owner, DevosBallotArchive, DevosVoterArchive, DevosBallot }
        }




        it("Get Archive deployment time and cost", async function () {
            const [owner] = await ethers.getSigners()
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")

            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            let contractAddress = await DevosBallotArchiveFactory.connect(owner).deploy()
            let totalTime = (performance.now() - startTime) / 10 ** 3;
            expect(contractAddress).to.not.be.null;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("ArchiveCreation", 0, 1, 1, totalTime, costEth, costLink)
        })



        it("Get Registrar deployment time and cost", async function () {
            const [owner] = await ethers.getSigners()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")

            let costEth = 0;
            let costLink = 0;
            let startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            contractAddress = await DevosVoterArchiveFactory
                .connect(owner)
                .deploy(mockOracle.address, linkToken.address, jobId, fee)
            let totalTime = (performance.now() - startTime) / 10 ** 3;
            expect(contractAddress).to.not.be.null;
            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)




            writeLog("RegistrarCreation", 0, 1, 1, totalTime, costEth, costLink)
        })


        it("Get Ballot deployment time and cost", async function () {
            const { owner, DevosBallotArchive, DevosVoterArchive } = await loadFixture(deployDevosSystemFixture);
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            contractAddress = await DevosBallotFactory
                .connect(owner)
                .deploy(
                    DevosBallotArchive.address,
                    DevosVoterArchive.address,
                    "My title",
                    "My metainformation",
                    "Austria",
                    7
                )
            let totalTime = (performance.now() - startTime) / 10 ** 3;
            expect(contractAddress).to.not.be.null;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)





            writeLog("BallotCreation", 0, 1, 1, totalTime, costEth, costLink)
        })

        it("Get voter check time and cost", async function () {
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

            let costEth = 0;
            let costLink = 0;

            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            await ethers.provider.send("hardhat_setBalance", [
                wallet.address,
                "0x56BC75E2D63100000", // 100 ETH
            ]);

            startEth = await wallet.getBalance() / 10 ** 18
            startLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

            let startTime = performance.now();
            contractAddress = await DevosVoterArchive.connect(wallet).requestNationalityData(wallet.getAddress());
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await wallet.getBalance() / 10 ** 18
            endLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

            costEth = costEth + (startEth - endEth)
            costLink = costLink + (startLink - endLink)



            writeLog("VoterCheck", 0, 1, 1, totalTime, costEth, costLink)
        })

        it("Get voting time and cost", async function () {
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

            let costEth = 0;
            let costLink = 0;

            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            await ethers.provider.send("hardhat_setBalance", [
                wallet.address,
                "0x56BC75E2D63100000", // 100 ETH
            ]);
            await DevosVoterArchive.connect(wallet).DEBUG_setNationalityData(wallet.getAddress(), "Austria");

            startEth = await wallet.getBalance() / 10 ** 18

            let startTime = performance.now();
            contractAddress = await DevosBallot.connect(wallet).callVote(1);
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await wallet.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("BallotVoting", 0, 1, 1, totalTime, costEth, costLink)
        })




























        it("Deployment of 10 Archives", async function () {
            const [owner] = await ethers.getSigners()
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")

            let numberTests = 10;
            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                let contractAddress = await DevosBallotArchiveFactory.connect(owner).deploy()
                expect(contractAddress).to.not.be.null;
            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("ArchiveCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })

        it("Deployment of 10 Registrars", async function () {
            const [owner] = await ethers.getSigners()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")

            let numberTests = 10;
            let costEth = 0;
            let costLink = 0;
            let startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                contractAddress = await DevosVoterArchiveFactory
                    .connect(owner)
                    .deploy(mockOracle.address, linkToken.address, jobId, fee)
                expect(contractAddress).to.not.be.null;

            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;
            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("RegistrarCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })


        it("Deployment of 10 Ballots", async function () {
            const { owner, DevosBallotArchive, DevosVoterArchive } = await loadFixture(deployDevosSystemFixture);
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            let numberTests = 10;
            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                contractAddress = await DevosBallotFactory
                    .connect(owner)
                    .deploy(
                        DevosBallotArchive.address,
                        DevosVoterArchive.address,
                        "My title",
                        "My metainformation",
                        "Austria",
                        7
                    )
                expect(contractAddress).to.not.be.null;

            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("BallotCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })

        it("10x Checking on Voter", async function () {
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

            let numberTests = 10;
            let costEth = 0;
            let costLink = 0;
            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);

                startEth = await wallet.getBalance() / 10 ** 18
                startLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

                contractAddress = await DevosVoterArchive.connect(wallet).requestNationalityData(wallet.getAddress());

                endEth = await wallet.getBalance() / 10 ** 18
                endLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

                costEth = costEth + (startEth - endEth)
                costLink = costLink + (startLink - endLink)
            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;



            writeLog("VoterCheck", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })



        it("10x Voting on Ballot", async function () {
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

            let numberTests = 10;
            let costEth = 0;
            let costLink = 0;
            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                await DevosVoterArchive.connect(wallet).DEBUG_setNationalityData(wallet.getAddress(), "Austria");

                startEth = await wallet.getBalance() / 10 ** 18

                contractAddress = await DevosBallot.connect(wallet).callVote(1);

                endEth = await wallet.getBalance() / 10 ** 18
                costEth = costEth + (startEth - endEth)
            }

            let totalTime = (performance.now() - startTime) / 10 ** 3;




            writeLog("BallotVoting", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })









































        it("Deployment of 100 Archives", async function () {
            const [owner] = await ethers.getSigners()
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")

            let numberTests = 100;
            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                let contractAddress = await DevosBallotArchiveFactory.connect(owner).deploy()
                expect(contractAddress).to.not.be.null;
            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("ArchiveCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })

        it("Deployment of 100 Registrars", async function () {
            const [owner] = await ethers.getSigners()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")

            let numberTests = 100;
            let costEth = 0;
            let costLink = 0;
            let startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                contractAddress = await DevosVoterArchiveFactory
                    .connect(owner)
                    .deploy(mockOracle.address, linkToken.address, jobId, fee)
                expect(contractAddress).to.not.be.null;

            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;
            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("RegistrarCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })


        it("Deployment of 100 Ballots", async function () {
            const { owner, DevosBallotArchive, DevosVoterArchive } = await loadFixture(deployDevosSystemFixture);
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            let numberTests = 100;
            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                contractAddress = await DevosBallotFactory
                    .connect(owner)
                    .deploy(
                        DevosBallotArchive.address,
                        DevosVoterArchive.address,
                        "My title",
                        "My metainformation",
                        "Austria",
                        7
                    )
                expect(contractAddress).to.not.be.null;

            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("BallotCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })

        it("100x Checking on Voter", async function () {
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

            let numberTests = 100;
            let costEth = 0;
            let costLink = 0;
            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);

                startEth = await wallet.getBalance() / 10 ** 18
                startLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

                contractAddress = await DevosVoterArchive.connect(wallet).requestNationalityData(wallet.getAddress());

                endEth = await wallet.getBalance() / 10 ** 18
                endLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

                costEth = costEth + (startEth - endEth)
                costLink = costLink + (startLink - endLink)
            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;



            writeLog("VoterCheck", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })



        it("100x Voting on Ballot", async function () {
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

            let numberTests = 100;
            let costEth = 0;
            let costLink = 0;
            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                await DevosVoterArchive.connect(wallet).DEBUG_setNationalityData(wallet.getAddress(), "Austria");

                startEth = await wallet.getBalance() / 10 ** 18

                contractAddress = await DevosBallot.connect(wallet).callVote(1);

                endEth = await wallet.getBalance() / 10 ** 18
                costEth = costEth + (startEth - endEth)
            }

            let totalTime = (performance.now() - startTime) / 10 ** 3;



            writeLog("BallotVoting", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })



















































        it("Deployment of 1000 Archives", async function () {
            const [owner] = await ethers.getSigners()
            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")

            let numberTests = 1000;
            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                let contractAddress = await DevosBallotArchiveFactory.connect(owner).deploy()
                expect(contractAddress).to.not.be.null;
            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)


            writeLog("ArchiveCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })

        it("Deployment of 1000 Registrars", async function () {
            const [owner] = await ethers.getSigners()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]
            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")

            let numberTests = 1000;
            let costEth = 0;
            let costLink = 0;
            let startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                contractAddress = await DevosVoterArchiveFactory
                    .connect(owner)
                    .deploy(mockOracle.address, linkToken.address, jobId, fee)
                expect(contractAddress).to.not.be.null;

            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;
            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)



            writeLog("RegistrarCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })


        it("Deployment of 1000 Ballots", async function () {
            const { owner, DevosBallotArchive, DevosVoterArchive } = await loadFixture(deployDevosSystemFixture);
            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")

            let numberTests = 1000;
            let costEth = 0;
            let costLink = 0;
            startEth = await owner.getBalance() / 10 ** 18

            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                contractAddress = await DevosBallotFactory
                    .connect(owner)
                    .deploy(
                        DevosBallotArchive.address,
                        DevosVoterArchive.address,
                        "My title",
                        "My metainformation",
                        "Austria",
                        7
                    )
                expect(contractAddress).to.not.be.null;

            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;

            endEth = await owner.getBalance() / 10 ** 18
            costEth = costEth + (startEth - endEth)


            writeLog("BallotCreation", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })

        it("1000x Checking on Voter", async function () {
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

            let numberTests = 1000;
            let costEth = 0;
            let costLink = 0;
            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);

                startEth = await wallet.getBalance() / 10 ** 18
                startLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

                contractAddress = await DevosVoterArchive.connect(wallet).requestNationalityData(wallet.getAddress());

                endEth = await wallet.getBalance() / 10 ** 18
                endLink = await linkToken.balanceOf(DevosVoterArchive.address) / 10 ** 18

                costEth = costEth + (startEth - endEth)
                costLink = costLink + (startLink - endLink)
            }
            let totalTime = (performance.now() - startTime) / 10 ** 3;



            writeLog("VoterCheck", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })



        it("1000x Voting on Ballot", async function () {
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

            let numberTests = 1000;
            let costEth = 0;
            let costLink = 0;
            let startTime = performance.now();
            for (var i = 0; i < numberTests; i++) {
                const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await ethers.provider.send("hardhat_setBalance", [
                    wallet.address,
                    "0x56BC75E2D63100000", // 100 ETH
                ]);
                await DevosVoterArchive.connect(wallet).DEBUG_setNationalityData(wallet.getAddress(), "Austria");

                startEth = await wallet.getBalance() / 10 ** 18

                contractAddress = await DevosBallot.connect(wallet).callVote(1);

                endEth = await wallet.getBalance() / 10 ** 18
                costEth = costEth + (startEth - endEth)
            }

            let totalTime = (performance.now() - startTime) / 10 ** 3;



            writeLog("BallotVoting", 1, numberTests, numberTests, totalTime, costEth, costLink)
        })
    })
