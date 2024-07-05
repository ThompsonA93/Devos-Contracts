const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

const fs = require('fs')

// Set prices for a given day on ETHEUR and LINKEUR
const ETHEUR = 2901.34
const LINKEUR = 11.93
const logPath = 'test/devos/results/SequentialPerformance.spec.csv'

// Generate randomized String
const generateString = (length) =>
    Math.random().toString(32).substring(2, length);

// Randomly chooses from predefined set of nationalities
const generateNationality = () => {
    var nationalities = ["Austria", "Egypt", "Germany", "Japan", "Turkey", "China", "Russia"];
    return nationalities[Math.floor(Math.random() * nationalities.length)];
}

// Generates 1 oder 2 
const generateVote = () => {
    return Math.floor(Math.random() * 2) + 1;
}

// Writes to CSV
const writeLog = (testcase, testcaseId, voters, ballots, requiredTime, costEth, costLink) => {
    if (fs.existsSync(logPath)) {
        // Ignore for now
    } else {
        console.log("\t! Logfile not found. Setup of CSV-Structure.")
        fs.writeFile(
            logPath,
            "testcase,testcaseId,voters,ballots,requiredTime,costEth,costLink,TPS,costEUR\n",
            (err) => { if (err) throw err; }
        )
    }

    let executionTimeInS = requiredTime / ballots;
    let costInEur = costEth * ETHEUR + costLink * LINKEUR

    record = testcase + "," + testcaseId + "," + voters + "," + ballots + ","               // Data category
        + requiredTime + "," + costEth.toFixed(5) + "," + costLink.toFixed(5) + ","         // Data during execution
        + executionTimeInS.toFixed(5) + "," + costInEur.toFixed(5) + "\n"                   // Aggregated post execution
    fs.appendFile(
        logPath,
        record,
        (err) => { if (err) throw err; }
    )
}

// Beginning of Test-Suite
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("# Sequential mass voting system stress tests on ballot deployment", async function () {
        it("Deployment of Ballots (1 Voter, 25 Ballots)", async function () {
            assert(false)
            let amountOfContracts = 25;
            const [voterOne] = await ethers.getSigners();
            const chainId = network.config.chainId

            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(voterOne).deploy()

            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(voterOne).deploy(linkToken.address)

            const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
            const fee = networkConfig[chainId]["fee"]

            const devosArchiveFactory = await hre.ethers.getContractFactory("Devos_Archive");
            const devosArchive = await devosArchiveFactory.deploy();
            const devosArchiveContract = await devosArchive.deployed();

            const startEth = await voterOne.getBalance()
            const start = performance.now();

            for (var i = 0; i < amountOfContracts; i++) {
                _archiveAddress = devosArchiveContract.address;
                _title = generateString(10);
                _metainfo = generateString(10);
                _votingDays = 1;
                _nationality = generateNationality();

                const devosBallotFactory = await hre.ethers.getContractFactory("Devos_Ballot");
                const devosBallot = await devosBallotFactory.connect(voterOne).deploy(
                    _archiveAddress,
                    _title,
                    _metainfo,
                    _votingDays,
                    _nationality,
                    mockOracle.address,
                    jobId,
                    fee,
                    linkToken.address
                );
                const devosBallotContract = await devosBallot.deployed();
                expect(devosBallotContract).to.not.be.reverted
            }

            const end = performance.now()

            const confirmBallotAmount = await devosArchiveContract.getAllBallots()
            expect(confirmBallotAmount.length).equals(amountOfContracts)

            const requiredTime = (end - start) / 1000; // Subtract result, transform from ms to s

            const endEth = await voterOne.getBalance()
            const requiredEthWEI = startEth - endEth
            const requiredEthMetric = requiredEthWEI / 10 ** 18;

            writeLog("BallotCreation", 2, 1, amountOfContracts, requiredTime, requiredEthMetric, 0)
        })






















        /**********************************************************************************************************/
        /*  Voting on Ballots
        /**********************************************************************************************************/
        it("Voting on Ballots (1 Voter, 25 Vote)", async function () {
            assert(false)
            let amountOfVotes = 25;
            const [deployer, voter] = await ethers.getSigners();
            const chainId = network.config.chainId

            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(deployer).deploy()

            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(deployer).deploy(linkToken.address)

            const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
            // @see https://docs.chain.link/chainlink-functions/resources/billing#cost-calculation-fulfillment
            //const fee = networkConfig[chainId]["fee"]                         // Native to networkConfig
            // const fee = (gasPrice * (gasOverhead + callbackGas)) + premiumFee // Native to LINK translation
            // Set Fee randomization on BallotFactory

            const devosArchiveFactory = await hre.ethers.getContractFactory("Devos_Archive");
            const devosArchive = await devosArchiveFactory.deploy();
            const devosArchiveContract = await devosArchive.deployed();

            const startEth = await voter.getBalance()
            const linkCostPerContract = [];
            const start = performance.now();

            for (let i = 0; i < amountOfVotes; i++) {
                let _archiveAddress = devosArchiveContract.address;
                let _title = generateString(10);
                let _metainfo = generateString(10);
                let _votingDays = 1;
                let _nationality = generateNationality();
                let fee = Math.floor(10**15 * (Math.random()+0.3))

                const devosBallotFactory = await hre.ethers.getContractFactory("Devos_Ballot");
                const devosBallot = await devosBallotFactory.connect(deployer).deploy(
                    _archiveAddress,
                    _title,
                    _metainfo,
                    _votingDays,
                    _nationality,
                    mockOracle.address,
                    jobId,
                    fee,
                    linkToken.address
                );
                const devosBallotContract = await devosBallot.deployed();

                //const fundAmount = networkConfig[chainId]["fundAmount"] || "10000000000000000000000"
                // Set "unlimited funds"
                const fundAmount = "1000000000000000000000" // 10**21
                await linkToken.connect(deployer).transfer(devosBallotContract.address, fundAmount)

                let startLink = await linkToken.balanceOf(devosBallotContract.address) 

                const transaction = await devosBallotContract.connect(voter).vote(generateVote())
                const transactionReceipt = await transaction.wait(1)
                const requestId = transactionReceipt.events[0].topics[1]
                expect(requestId).to.not.be.null

                let endLink = await linkToken.balanceOf(devosBallotContract.address)

                linkCostPerContract.push(startLink - endLink)
            }

            const end = performance.now()
            const requiredTime = (end - start) / 1000;

            const endEth = await voter.getBalance()
            const requiredEthWEI = startEth - endEth
            const requiredEthMetric = requiredEthWEI / 10 ** 18;

            let requiredLinkWEI = 0
            linkCostPerContract.forEach(value => {
                requiredLinkWEI += value
            })
            const requiredLinkMetric = requiredLinkWEI / 10 ** 18;

            writeLog("Voting", 0, 1, amountOfVotes, requiredTime, requiredEthMetric, requiredLinkMetric)
        })
    })
