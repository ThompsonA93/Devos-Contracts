const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Devos-System basic functionalities testing", async function () {
        async function deployDevosBallotTestFixture() {
            const [voterOne, voterTwo] = await ethers.getSigners()
            const chainId = network.config.chainId

            const devosArchiveFactory = await ethers.getContractFactory("Devos_Archive")
            const DevosArchive = await devosArchiveFactory.connect(voterOne).deploy()

            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(voterOne).deploy()

            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(voterOne).deploy(linkToken.address)

            const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
            const fee = networkConfig[chainId]["fee"]

            const devosBallotFactory = await ethers.getContractFactory("Devos_Ballot")
            const DevosBallot = await devosBallotFactory
                .connect(voterOne)
                .deploy(
                    DevosArchive.address, "NPXTest", "Hardhat NPX Testing", 7, "Austria",
                    mockOracle.address, jobId, fee, linkToken.address)

            const fundAmount = networkConfig[chainId]["fundAmount"] || "1000000000000000000"
            await linkToken.connect(voterOne).transfer(DevosBallot.address, fundAmount)

            return { voterOne, voterTwo, DevosBallot, DevosArchive, mockOracle }
        }

        describe("#ETHNETRequests", async function () {
            describe("success", async function() {
                it("Should succesfully deploy Devos_Ballot with correct values", async function (){
                    const {voterOne, DevosBallot, DevosArchive} = await loadFixture(deployDevosBallotTestFixture)
                    var fullBallotInfo = await DevosBallot.getFullBallotInformation();

                    expect(fullBallotInfo[0]).equal(DevosArchive.address)
                    expect(fullBallotInfo[1]).equal(voterOne.address)
                    expect(fullBallotInfo[2]).equal(DevosBallot.address)
                    expect(fullBallotInfo[3]).equal("NPXTest")
                    expect(fullBallotInfo[4]).equal("Hardhat NPX Testing")
                    expect(fullBallotInfo[5]).equal("Austria")

                })

                it("Should successfully create a Devos_Ballot contract and link it to Devos_Archive", async function () {
                    const { DevosBallot, DevosArchive } = await loadFixture(deployDevosBallotTestFixture)
                    const storedAddress = await DevosArchive.getBallotByAddress(DevosBallot.address)              
                    expect(storedAddress).to.equal(DevosBallot.address);
                })
                it("Should successfully allow vote on ballot by one user", async function () {
                    const { DevosBallot } = await loadFixture(deployDevosBallotTestFixture)
                    const transaction = await DevosBallot.vote(1)    // Choose Yes
                    const transactionReceipt = await transaction.wait(1)
                    expect(transactionReceipt).to.not.be.reverted
                })
                it("Should successfully allow vote on ballot by multiple users", async function () {
                    const { voterOne, voterTwo, DevosBallot } = await loadFixture(deployDevosBallotTestFixture)
                    const transactionOne = await DevosBallot.connect(voterOne).vote(1)
                    const transactionReceiptOne = await transactionOne.wait(1)

                    const transactionTwo = await DevosBallot.connect(voterTwo).vote(2)
                    const transactionReceiptTwo = await transactionTwo.wait(1)
                    
                    expect(transactionReceiptOne).to.not.be.reverted
                    expect(transactionReceiptTwo).to.not.be.reverted
                })
            })
            describe("error", async function(){
                // TODO 
                
            })
        })

        describe("#SEMNETRequests", async function () {
            describe("success", async function () {
                it("Should successfully make an API request to oracle system", async function () {
                    const { DevosBallot } = await loadFixture(deployDevosBallotTestFixture)
                    const transaction = await DevosBallot.vote(2)    // Choose Yes
                    const transactionReceipt = await transaction.wait(1)
                    const requestId = transactionReceipt.events[0].topics[1]
                    expect(requestId).to.not.be.null
                })
            })            
            describe("error", async function(){
                // TODO 
                
            })
        })
    })