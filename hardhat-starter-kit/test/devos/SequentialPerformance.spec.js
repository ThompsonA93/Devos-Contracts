const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
const fs = require('fs')

const logPath = 'test/devos/results/SequentialPerformance.spec.csv'

const generateString = (length) =>
    Math.random().toString(32).substring(2, length);

const generateNationality = () => {
    var nationalities = ["Austria", "Egypt", "Germany", "Japan", "Turkey", "China", "Russia"];
    return nationalities[Math.floor(Math.random() * nationalities.length)];
}

const writeLog = (testcase, testcaseId, voters, ballots, requiredTime, costEth, costLink) => {
    if (fs.existsSync(logPath)) {
        console.log("Logfile found. Appending new records.")
    } else {
        console.log("Logfile not found. Setup of CSV-Structure.")
        fs.writeFile(
            logPath,
            "testcase,testcaseId,voters,ballots,requiredTime,costEth,costLink\n",
            (err) => { if (err) throw err; }
        )
    }
    record = testcase + "," + testcaseId + "," + voters + "," + ballots + "," + requiredTime + "," + costEth + "," + costLink + "\n"
    fs.appendFile(
        logPath,
        record,
        (err) => { if (err) throw err; }
    )
}


!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Mass voting system stress tests, sequential voting", async function () {
        it("ID0 :: Deployment of Ballots (1 Voter, 1 Ballots)", async function () {
            let amountOfContracts = 1;
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
                expect(devosBallotContract.address).not.equals("");
            }

            const end = performance.now()
            const requiredTime = (end - start) / 1000; // Subtract result, transform from ms to s

            const endEth = await voterOne.getBalance()
            const requiredEthWEI = startEth - endEth
            const requiredEthMetric = requiredEthWEI / 10**18;
        
            writeLog("BallotCreation", 1, 1, amountOfContracts, requiredTime, requiredEthMetric, 0)
        })
        it("ID1 :: Deployment of Ballots (1 Voter, 10 Ballots)", async function () {
            let amountOfContracts = 10;
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
                expect(devosBallotContract.address).not.equals("");
            }

            const end = performance.now()
            const requiredTime = (end - start) / 1000; // Subtract result, transform from ms to s

            const endEth = await voterOne.getBalance()
            const requiredEthWEI = startEth - endEth
            const requiredEthMetric = requiredEthWEI / 10**18;
        
            writeLog("BallotCreation", 1, 1, amountOfContracts, requiredTime, requiredEthMetric, 0)
        })
    })
