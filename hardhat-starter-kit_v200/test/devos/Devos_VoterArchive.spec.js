const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { stringToBytes32 } = require("../../helper-functions")
const { expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Devos-System basic functionality testing", async function () {
        async function deployVoterArchiveFixture() {
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

            return { deployer, DevosVoterArchive, mockOracle }
        }

        describe("#Devos_VoterArchive", async function () {
            describe("success", async function () {
                it("Should successfully make an API request", async function () {
                    const { deployer, DevosVoterArchive } = await loadFixture(deployVoterArchiveFixture)
                    const transaction = await DevosVoterArchive.requestNationalityData(deployer.address)
                    const transactionReceipt = await transaction.wait(1)
                    const requestId = transactionReceipt.events[0].topics[1]
                    expect(requestId).to.not.be.null
                })
                it("Should successfully make an API request and get a result", async function () {
                    const { deployer, DevosVoterArchive, mockOracle } = await loadFixture(deployVoterArchiveFixture)
                    const transaction = await DevosVoterArchive.requestNationalityData(deployer.address)
                    const transactionReceipt = await transaction.wait(1)
                    const requestId = transactionReceipt.events[0].topics[1]
                    const mockResponse = 'Austria'
                    const mockOracleResponse = await mockOracle.fulfillOracleRequest(requestId, stringToBytes32(mockResponse))
                    expect(mockOracleResponse).to.not.be.null

                    await DevosVoterArchive.DEBUG_setNationalityData(deployer.address, mockResponse);
                    const getNationality = await DevosVoterArchive.getNationalityData(deployer.address)
                    expect(getNationality).equal(mockResponse);
                })
            describe("error", async function () {
                // TODO 
            })
        })
    })
})
