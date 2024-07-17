const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")
const { generateString, generateNationality, generateVotingDays, generateRandomWallet } = require("../../helper-functions")

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


            return { owner, DevosBallotArchive, DevosVoterArchive }
        }

        it("Deployment of 10 Ballots", async function () {
            const { DevosBallotArchive, DevosVoterArchive, DevosBallot } = await loadFixture(deployDevosSystemFixture);

            const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
            
            console.log(wallet)

            console.log(wallet.isProvider())

        })














    })
