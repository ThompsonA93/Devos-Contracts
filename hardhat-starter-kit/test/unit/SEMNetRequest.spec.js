const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")


// Adjusted code, @see APIConsumer.spec.js
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SEMNetRequest API Unit Tests", async function () {

        async function deployAPISEMNetRequestFixture() {
            const [deployer] = await ethers.getSigners()

            const chainId = network.config.chainId

            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(deployer).deploy()

            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(deployer).deploy(linkToken.address)

            const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
            const fee = networkConfig[chainId]["fee"]

            const apiSEMNetRequestFactory = await ethers.getContractFactory("SEMNetRequest")
            const apiSEMNetRequest = await apiSEMNetRequestFactory
                .connect(deployer)
                .deploy(mockOracle.address, jobId, fee, linkToken.address)

            const fundAmount = networkConfig[chainId]["fundAmount"] || "1000000000000000000"
            await linkToken.connect(deployer).transfer(apiSEMNetRequest.address, fundAmount)

            return { apiSEMNetRequest, mockOracle }
        }

        describe("#requestNationalityData", async function () {
            describe("success", async function () {
                it("Should successfully make an API request to semantic web backend", async function () {
                    const { apiSEMNetRequest } = await loadFixture(deployAPISEMNetRequestFixture)
                    const transaction = await apiSEMNetRequest.requestNationalityData("0x71bE63f3384f5fb98995898A86B02Fb2426c5788")
                    const transactionReceipt = await transaction.wait(1)
                    const requestId = transactionReceipt.events[0].topics[1]
                    expect(requestId).to.not.be.null
                })
            })
        })

        


    })